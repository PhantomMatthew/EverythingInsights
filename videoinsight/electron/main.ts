import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import * as path from 'path';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import log from 'electron-log';

const isDev = process.env.NODE_ENV === 'development';

class MainProcess {
  private mainWindow: BrowserWindow | null = null;
  private tempDir: string;

  constructor() {
    this.tempDir = path.join(os.tmpdir(), 'videoinsight');
    this.ensureTempDir();
    this.setupIPC();
  }

  private ensureTempDir(): void {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  createWindow(): void {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
      },
      titleBarStyle: 'hiddenInset',
      show: false,
    });

    const url = isDev 
      ? 'http://localhost:5173' 
      : `file://${path.join(__dirname, '../dist/index.html')}`;

    this.mainWindow.loadURL(url);

    if (isDev) {
      this.mainWindow.webContents.openDevTools();
    }

    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
    });

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
  }

  private setupIPC(): void {
    // Download video and extract audio
    ipcMain.handle('download-video', async (event, url: string) => {
      try {
        log.info('Starting video download:', url);
        return await this.downloadVideo(url);
      } catch (error) {
        log.error('Video download failed:', error);
        throw error;
      }
    });

    // Extract audio using ffmpeg
    ipcMain.handle('extract-audio', async (event, videoPath: string) => {
      try {
        log.info('Starting audio extraction:', videoPath);
        return await this.extractAudio(videoPath);
      } catch (error) {
        log.error('Audio extraction failed:', error);
        throw error;
      }
    });

    // Speech to text using Whisper
    ipcMain.handle('speech-to-text', async (event, audioPath: string) => {
      try {
        log.info('Starting speech to text:', audioPath);
        return await this.speechToText(audioPath);
      } catch (error) {
        log.error('Speech to text failed:', error);
        throw error;
      }
    });

    // LLM summarization
    ipcMain.handle('llm-summarize', async (event, text: string, model: string) => {
      try {
        log.info('Starting LLM summarization with model:', model);
        return await this.llmSummarize(text, model);
      } catch (error) {
        log.error('LLM summarization failed:', error);
        throw error;
      }
    });

    // Open external links
    ipcMain.handle('open-external', async (event, url: string) => {
      await shell.openExternal(url);
    });

    // Show save dialog
    ipcMain.handle('show-save-dialog', async (event, options) => {
      const result = await dialog.showSaveDialog(this.mainWindow!, options);
      return result;
    });
  }

  private async downloadVideo(url: string): Promise<{ success: boolean; videoPath?: string; error?: string }> {
    return new Promise((resolve) => {
      const outputPath = path.join(this.tempDir, `video_${Date.now()}.%(ext)s`);
      const ytDlp = spawn('yt-dlp', [
        '-f', 'best[height<=720]',
        '-o', outputPath,
        url
      ]);

      let videoPath = '';

      ytDlp.stdout.on('data', (data) => {
        const output = data.toString();
        log.info('yt-dlp stdout:', output);
        
        // Extract the final video path from yt-dlp output
        const pathMatch = output.match(/\[download\] (.+) has already been downloaded/);
        if (pathMatch) {
          videoPath = pathMatch[1];
        }
      });

      ytDlp.stderr.on('data', (data) => {
        log.error('yt-dlp stderr:', data.toString());
      });

      ytDlp.on('close', (code) => {
        if (code === 0 && videoPath) {
          resolve({ success: true, videoPath });
        } else {
          resolve({ success: false, error: `yt-dlp exited with code ${code}` });
        }
      });
    });
  }

  private async extractAudio(videoPath: string): Promise<{ success: boolean; audioPath?: string; error?: string }> {
    return new Promise((resolve) => {
      const audioPath = path.join(this.tempDir, `audio_${Date.now()}.wav`);
      const ffmpeg = spawn('ffmpeg', [
        '-i', videoPath,
        '-vn',
        '-acodec', 'pcm_s16le',
        '-ar', '16000',
        '-ac', '1',
        audioPath
      ]);

      ffmpeg.stderr.on('data', (data) => {
        log.info('ffmpeg stderr:', data.toString());
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, audioPath });
        } else {
          resolve({ success: false, error: `ffmpeg exited with code ${code}` });
        }
      });
    });
  }

  private async speechToText(audioPath: string): Promise<{ success: boolean; text?: string; error?: string }> {
    return new Promise((resolve) => {
      const whisper = spawn('whisper', [audioPath, '--model', 'base', '--output_format', 'txt']);

      let outputText = '';

      whisper.stdout.on('data', (data) => {
        outputText += data.toString();
      });

      whisper.stderr.on('data', (data) => {
        log.info('whisper stderr:', data.toString());
      });

      whisper.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, text: outputText.trim() });
        } else {
          resolve({ success: false, error: `whisper exited with code ${code}` });
        }
      });
    });
  }

  private async llmSummarize(text: string, model: string): Promise<{ success: boolean; summary?: string; error?: string }> {
    try {
      if (model.startsWith('ollama:')) {
        // Use local Ollama
        const modelName = model.replace('ollama:', '');
        return await this.callOllama(text, modelName);
      } else if (model.startsWith('openai:')) {
        // Use OpenAI API
        return await this.callOpenAI(text, model.replace('openai:', ''));
      } else {
        return { success: false, error: 'Unsupported model type' };
      }
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  private async callOllama(text: string, model: string): Promise<{ success: boolean; summary?: string; error?: string }> {
    return new Promise((resolve) => {
      const prompt = `Please provide a concise summary (maximum 200 words) of the following video transcript and list 3 key points:\n\n${text}`;
      
      const ollama = spawn('ollama', ['run', model], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      ollama.stdin.write(prompt);
      ollama.stdin.end();

      ollama.stdout.on('data', (data) => {
        output += data.toString();
      });

      ollama.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      ollama.on('close', (code) => {
        if (code === 0 && output.trim()) {
          resolve({ success: true, summary: output.trim() });
        } else {
          resolve({ success: false, error: errorOutput || `ollama exited with code ${code}` });
        }
      });
    });
  }

  private async callOpenAI(text: string, model: string): Promise<{ success: boolean; summary?: string; error?: string }> {
    // This would implement OpenAI API calls
    // For now, return a placeholder
    return { success: false, error: 'OpenAI integration not implemented yet' };
  }
}

const mainProcess = new MainProcess();

app.whenReady().then(() => {
  mainProcess.createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainProcess.createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});