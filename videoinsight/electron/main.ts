import { app, BrowserWindow, ipcMain, dialog, shell, globalShortcut } from 'electron';
import * as path from 'path';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import log from 'electron-log';
import DatabaseService from './database';

const isDev = process.env.NODE_ENV === 'development';

class MainProcess {
  private mainWindow: BrowserWindow | null = null;
  private tempDir: string;
  private database: DatabaseService;

  constructor() {
    this.tempDir = path.join(os.tmpdir(), 'videoinsight');
    this.database = new DatabaseService();
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
      
      // Option 1: True fullscreen (hides title bar and dock/taskbar)
      // this.mainWindow?.setFullScreen(true);
      
      // Option 2: Maximize window (keeps title bar and dock/taskbar)
      this.mainWindow?.maximize();
    });

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    // Register keyboard shortcuts for fullscreen toggle
    this.setupKeyboardShortcuts();
  }

  private setupKeyboardShortcuts(): void {
    // Register F11 for fullscreen toggle (Windows/Linux style)
    globalShortcut.register('F11', () => {
      if (this.mainWindow) {
        const isFullScreen = this.mainWindow.isFullScreen();
        this.mainWindow.setFullScreen(!isFullScreen);
      }
    });

    // Register Cmd/Ctrl+Shift+F for fullscreen toggle
    globalShortcut.register('CommandOrControl+Shift+F', () => {
      if (this.mainWindow) {
        const isFullScreen = this.mainWindow.isFullScreen();
        this.mainWindow.setFullScreen(!isFullScreen);
      }
    });
  }

  private setupIPC(): void {
    // Download video and extract audio
    ipcMain.handle('download-video', async (event, url: string, cookiesFile?: string) => {
      try {
        log.info('Starting video download:', { url, cookiesFile });
        return await this.downloadVideo(url, cookiesFile);
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
    ipcMain.handle('speech-to-text', async (event, audioPath: string, model?: string) => {
      try {
        log.info('Starting speech to text:', audioPath);
        return await this.speechToText(audioPath, model || 'base');
      } catch (error) {
        log.error('Speech to text failed:', error);
        throw error;
      }
    });

    // LLM summarization
    ipcMain.handle('llm-summarize', async (event, text: string, model: string, apiKeys?: any) => {
      try {
        log.info('Starting LLM summarization with model:', model);
        return await this.llmSummarize(text, model, apiKeys);
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

    // Show open dialog
    ipcMain.handle('show-open-dialog', async (event, options) => {
      const result = await dialog.showOpenDialog(this.mainWindow!, options);
      return result;
    });

    // Database operations
    ipcMain.handle('db-save-task', async (event, task) => {
      try {
        return this.database.saveTask(task);
      } catch (error) {
        log.error('Failed to save task to database:', error);
        throw error;
      }
    });

    ipcMain.handle('db-update-task', async (event, id, updates) => {
      try {
        return this.database.updateTask(id, updates);
      } catch (error) {
        log.error('Failed to update task in database:', error);
        throw error;
      }
    });

    ipcMain.handle('db-get-task', async (event, id) => {
      try {
        return this.database.getTask(id);
      } catch (error) {
        log.error('Failed to get task from database:', error);
        throw error;
      }
    });

    ipcMain.handle('db-get-all-tasks', async (event, limit?, offset?) => {
      try {
        return this.database.getAllTasks(limit, offset);
      } catch (error) {
        log.error('Failed to get tasks from database:', error);
        throw error;
      }
    });

    ipcMain.handle('db-get-tasks-by-status', async (event, status) => {
      try {
        return this.database.getTasksByStatus(status);
      } catch (error) {
        log.error('Failed to get tasks by status from database:', error);
        throw error;
      }
    });

    ipcMain.handle('db-search-tasks', async (event, query) => {
      try {
        return this.database.searchTasks(query);
      } catch (error) {
        log.error('Failed to search tasks in database:', error);
        throw error;
      }
    });

    ipcMain.handle('db-delete-task', async (event, id) => {
      try {
        return this.database.deleteTask(id);
      } catch (error) {
        log.error('Failed to delete task from database:', error);
        throw error;
      }
    });

    ipcMain.handle('db-get-stats', async (event) => {
      try {
        return this.database.getTaskStats();
      } catch (error) {
        log.error('Failed to get task stats from database:', error);
        throw error;
      }
    });

    ipcMain.handle('db-cleanup', async (event) => {
      try {
        this.database.cleanup();
        return { success: true };
      } catch (error) {
        log.error('Failed to cleanup database:', error);
        throw error;
      }
    });
  }

  private async downloadVideo(url: string, cookiesFile?: string): Promise<{ success: boolean; videoPath?: string; error?: string; title?: string }> {
    return new Promise((resolve) => {
      const timestamp = Date.now();
      const outputTemplate = path.join(this.tempDir, `video_${timestamp}_%(title)s.%(ext)s`);
      
      // Build yt-dlp arguments for getting video info
      const infoArgs = ['--dump-single-json', '--no-playlist'];
      if (cookiesFile && cookiesFile.trim()) {
        if (fs.existsSync(cookiesFile)) {
          infoArgs.push('--cookies', cookiesFile);
          log.info('Using cookies file for video info:', cookiesFile);
        } else {
          log.warn('Cookies file does not exist:', cookiesFile);
        }
      } else {
        log.info('No cookies file provided for video info');
      }
      infoArgs.push(url);
      
      // Log the complete info command for debugging
      log.info('yt-dlp info command:', ['yt-dlp'].concat(infoArgs).join(' '));
      
      // Get video info first
      const infoProcess = spawn('yt-dlp', infoArgs);

      let videoInfo: any = null;
      let infoOutput = '';

      infoProcess.stdout.on('data', (data) => {
        infoOutput += data.toString();
      });

      infoProcess.on('close', (infoCode) => {
        if (infoCode === 0) {
          try {
            videoInfo = JSON.parse(infoOutput);
            log.info('Video info:', { title: videoInfo.title, duration: videoInfo.duration });
            this.mainWindow?.webContents.send('download-progress', {
              stage: 'info',
              title: videoInfo.title,
              duration: videoInfo.duration
            });
          } catch (e) {
            log.error('Failed to parse video info:', e);
          }
        }

        // Start actual download with more flexible format selection
        const downloadArgs = [
          '-f', 'best[height<=1080]/best[height<=720]/best',  // Try multiple format fallbacks
          '--newline',
          '--no-playlist',
          '--no-check-certificate',  // Help with some sites
          '-o', outputTemplate
        ];
        if (cookiesFile && cookiesFile.trim()) {
          if (fs.existsSync(cookiesFile)) {
            downloadArgs.push('--cookies', cookiesFile);
            log.info('Using cookies file for download:', cookiesFile);
          } else {
            log.warn('Cookies file does not exist for download:', cookiesFile);
          }
        } else {
          log.info('No cookies file provided for download');
        }
        downloadArgs.push(url);
        
        // Log the complete command for debugging
        log.info('yt-dlp download command:', ['yt-dlp'].concat(downloadArgs).join(' '));
        
        const ytDlp = spawn('yt-dlp', downloadArgs);

        let videoPath = '';
        let downloadComplete = false;

        ytDlp.stdout.on('data', (data) => {
          const output = data.toString();
          log.info('yt-dlp output:', output);
          
          // Parse progress information
          const progressMatch = output.match(/\[download\]\s+(\d+\.?\d*)%/);
          if (progressMatch) {
            const progress = parseFloat(progressMatch[1]);
            this.mainWindow?.webContents.send('download-progress', {
              stage: 'downloading',
              progress: progress,
              title: videoInfo?.title
            });
          }

          // Extract final video path
          const pathMatch = output.match(/\[download\] (.+) has already been downloaded/);
          if (pathMatch) {
            videoPath = pathMatch[1];
            downloadComplete = true;
          }

          // Extract merged file path
          const mergeMatch = output.match(/\[Merger\] Merging formats into "(.+)"/);
          if (mergeMatch) {
            videoPath = mergeMatch[1];
          }

          // Check for completion
          if (output.includes('100%') || output.includes('has already been downloaded')) {
            downloadComplete = true;
          }
        });

        ytDlp.stderr.on('data', (data) => {
          const error = data.toString();
          log.error('yt-dlp stderr:', error);
          
          // Send error updates to UI
          this.mainWindow?.webContents.send('download-progress', {
            stage: 'error',
            error: error,
            title: videoInfo?.title
          });
        });

        ytDlp.on('close', (code) => {
          if (code === 0 && downloadComplete) {
            // If no specific path was captured, try to find the downloaded file
            if (!videoPath) {
              const files = fs.readdirSync(this.tempDir);
              const videoFile = files.find(f => f.startsWith(`video_${timestamp}`));
              if (videoFile) {
                videoPath = path.join(this.tempDir, videoFile);
              }
            }

            if (videoPath && fs.existsSync(videoPath)) {
              resolve({ 
                success: true, 
                videoPath, 
                title: videoInfo?.title || 'Unknown Video'
              });
            } else {
              resolve({ 
                success: false, 
                error: 'Downloaded file not found' 
              });
            }
          } else if (code !== 0) {
            // Handle specific error cases and retry with different formats
            log.error('yt-dlp failed with code:', code);
            
            // Try with fallback format if format error occurred
            this.retryDownloadWithFallback(url, outputTemplate, cookiesFile, videoInfo).then(resolve);
          }
        });
      });
    });
  }

  private async retryDownloadWithFallback(
    url: string, 
    outputTemplate: string, 
    cookiesFile?: string, 
    videoInfo?: any
  ): Promise<{ success: boolean; videoPath?: string; error?: string; title?: string }> {
    return new Promise((resolve) => {
      log.info('Retrying download with fallback format selection');
      
      // Try with more permissive format selection
      const fallbackArgs = [
        '--format-sort', 'height:720',  // Prefer 720p but allow other heights
        '--newline',
        '--no-playlist',
        '--no-check-certificate',
        '--ignore-errors',  // Continue on non-fatal errors
        '-o', outputTemplate
      ];
      
      if (cookiesFile && cookiesFile.trim() && fs.existsSync(cookiesFile)) {
        fallbackArgs.push('--cookies', cookiesFile);
        log.info('Using cookies file for fallback download:', cookiesFile);
      }
      
      fallbackArgs.push(url);
      
      log.info('yt-dlp fallback command:', ['yt-dlp'].concat(fallbackArgs).join(' '));
      
      const ytDlpFallback = spawn('yt-dlp', fallbackArgs);
      let videoPath = '';
      let downloadComplete = false;
      const timestamp = Date.now();
      
      ytDlpFallback.stdout.on('data', (data) => {
        const output = data.toString();
        log.info('yt-dlp fallback output:', output);
        
        // Parse progress information
        const progressMatch = output.match(/\[download\]\s+(\d+\.?\d*)%/);
        if (progressMatch) {
          const progress = parseFloat(progressMatch[1]);
          this.mainWindow?.webContents.send('download-progress', {
            stage: 'downloading',
            progress: progress,
            title: videoInfo?.title,
            message: 'Retrying with fallback format...'
          });
        }

        // Extract final video path
        const pathMatch = output.match(/\[download\] (.+) has already been downloaded/);
        if (pathMatch) {
          videoPath = pathMatch[1];
          downloadComplete = true;
        }

        // Extract merged file path
        const mergeMatch = output.match(/\[Merger\] Merging formats into "(.+)"/);
        if (mergeMatch) {
          videoPath = mergeMatch[1];
        }

        // Check for completion
        if (output.includes('100%') || output.includes('has already been downloaded')) {
          downloadComplete = true;
        }
      });
      
      ytDlpFallback.stderr.on('data', (data) => {
        const error = data.toString();
        log.error('yt-dlp fallback stderr:', error);
      });
      
      ytDlpFallback.on('close', (code) => {
        if (code === 0 && downloadComplete) {
          // If no specific path was captured, try to find the downloaded file
          if (!videoPath) {
            const files = fs.readdirSync(this.tempDir);
            const videoFile = files.find(f => f.includes('video_') || (videoInfo?.title && f.includes(videoInfo.title.slice(0, 10))));
            if (videoFile) {
              videoPath = path.join(this.tempDir, videoFile);
            }
          }

          if (videoPath && fs.existsSync(videoPath)) {
            log.info('Fallback download succeeded:', videoPath);
            resolve({ 
              success: true, 
              videoPath, 
              title: videoInfo?.title || 'Unknown Video'
            });
          } else {
            resolve({ 
              success: false, 
              error: 'Fallback download failed: file not found' 
            });
          }
        } else {
          resolve({ 
            success: false, 
            error: `Both primary and fallback downloads failed. Last exit code: ${code}. Try using cookies or check if the video is available.` 
          });
        }
      });
    });
  }

  private async extractAudio(videoPath: string): Promise<{ success: boolean; audioPath?: string; error?: string }> {
    return new Promise((resolve) => {
      const audioPath = path.join(this.tempDir, `audio_${Date.now()}.wav`);
      
      log.info('Starting audio extraction:', { videoPath, audioPath });

      const ffmpeg = spawn('ffmpeg', [
        '-i', videoPath,
        '-vn',                    // No video
        '-acodec', 'pcm_s16le',  // PCM 16-bit little-endian
        '-ar', '16000',          // Sample rate 16kHz (optimal for Whisper)
        '-ac', '1',              // Mono channel
        '-y',                    // Overwrite output file
        audioPath
      ]);

      let duration = 0;
      let currentTime = 0;

      ffmpeg.stderr.on('data', (data) => {
        const output = data.toString();
        log.info('ffmpeg output:', output);

        // Extract duration
        const durationMatch = output.match(/Duration: (\d{2}):(\d{2}):(\d{2})/);
        if (durationMatch) {
          const hours = parseInt(durationMatch[1]);
          const minutes = parseInt(durationMatch[2]);
          const seconds = parseInt(durationMatch[3]);
          duration = hours * 3600 + minutes * 60 + seconds;
          
          this.mainWindow?.webContents.send('extraction-progress', {
            stage: 'extracting',
            duration: duration
          });
        }

        // Extract current time
        const timeMatch = output.match(/time=(\d{2}):(\d{2}):(\d{2})/);
        if (timeMatch && duration > 0) {
          const hours = parseInt(timeMatch[1]);
          const minutes = parseInt(timeMatch[2]);
          const seconds = parseInt(timeMatch[3]);
          currentTime = hours * 3600 + minutes * 60 + seconds;
          
          const progress = (currentTime / duration) * 100;
          
          this.mainWindow?.webContents.send('extraction-progress', {
            stage: 'extracting',
            progress: Math.min(progress, 100),
            currentTime: currentTime,
            duration: duration
          });
        }
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          // Verify the audio file was created
          if (fs.existsSync(audioPath)) {
            const stats = fs.statSync(audioPath);
            log.info('Audio extraction completed:', { 
              audioPath, 
              size: stats.size,
              duration: duration 
            });
            
            this.mainWindow?.webContents.send('extraction-progress', {
              stage: 'completed',
              progress: 100
            });
            
            resolve({ success: true, audioPath });
          } else {
            resolve({ success: false, error: 'Audio file was not created' });
          }
        } else {
          resolve({ success: false, error: `ffmpeg exited with code ${code}` });
        }
      });

      ffmpeg.on('error', (error) => {
        log.error('ffmpeg process error:', error);
        resolve({ success: false, error: `ffmpeg process error: ${error.message}` });
      });
    });
  }

  private async speechToText(audioPath: string, model: string = 'base'): Promise<{ success: boolean; text?: string; error?: string }> {
    return new Promise((resolve) => {
      const outputDir = path.dirname(audioPath);
      const outputPrefix = path.basename(audioPath, path.extname(audioPath));
      
      log.info('Starting speech recognition:', { audioPath, model });

      const whisper = spawn('whisper', [
        audioPath,
        '--model', model,
        '--output_format', 'txt',
        '--output_dir', outputDir,
        '--verbose', 'False'
      ]);

      let outputText = '';
      let errorOutput = '';

      whisper.stdout.on('data', (data) => {
        const output = data.toString();
        log.info('whisper stdout:', output);
        
        // Send progress updates to UI
        this.mainWindow?.webContents.send('transcription-progress', {
          stage: 'transcribing',
          message: 'Processing audio with Whisper...'
        });
      });

      whisper.stderr.on('data', (data) => {
        const output = data.toString();
        errorOutput += output;
        log.info('whisper stderr:', output);
        
        // Parse progress if available
        if (output.includes('%')) {
          const progressMatch = output.match(/(\d+)%/);
          if (progressMatch) {
            const progress = parseInt(progressMatch[1]);
            this.mainWindow?.webContents.send('transcription-progress', {
              stage: 'transcribing',
              progress: progress
            });
          }
        }
      });

      whisper.on('close', (code) => {
        if (code === 0) {
          // Read the output text file
          const txtFilePath = path.join(outputDir, `${outputPrefix}.txt`);
          
          try {
            if (fs.existsSync(txtFilePath)) {
              const transcriptText = fs.readFileSync(txtFilePath, 'utf-8').trim();
              
              log.info('Speech recognition completed:', { 
                transcriptLength: transcriptText.length,
                txtFile: txtFilePath
              });
              
              this.mainWindow?.webContents.send('transcription-progress', {
                stage: 'completed',
                progress: 100
              });
              
              // Clean up the txt file
              try {
                fs.unlinkSync(txtFilePath);
              } catch (cleanupError) {
                log.warn('Failed to cleanup transcript file:', cleanupError);
              }
              
              resolve({ success: true, text: transcriptText });
            } else {
              resolve({ success: false, error: 'Transcript file not found' });
            }
          } catch (readError) {
            log.error('Failed to read transcript file:', readError);
            resolve({ success: false, error: `Failed to read transcript: ${readError}` });
          }
        } else {
          log.error('Whisper failed:', { code, error: errorOutput });
          resolve({ success: false, error: `whisper exited with code ${code}: ${errorOutput}` });
        }
      });

      whisper.on('error', (error) => {
        log.error('whisper process error:', error);
        resolve({ success: false, error: `whisper process error: ${error.message}` });
      });
    });
  }

  private async llmSummarize(text: string, model: string, apiKeys?: any): Promise<{ success: boolean; summary?: string; error?: string }> {
    try {
      if (model.startsWith('ollama:')) {
        // Use local Ollama
        const modelName = model.replace('ollama:', '');
        return await this.callOllama(text, modelName);
      } else if (model.startsWith('openai:')) {
        // Use OpenAI API
        const modelName = model.replace('openai:', '');
        return await this.callOpenAI(text, modelName, apiKeys?.openai);
      } else if (model.startsWith('claude:')) {
        // Use Claude API
        const modelName = model.replace('claude:', '');
        return await this.callClaude(text, modelName, apiKeys?.claude);
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
      
      log.info('Starting Ollama request:', { model, promptLength: prompt.length });
      
      // Set a timeout for the Ollama request (5 minutes)
      const timeoutId = setTimeout(() => {
        log.error('Ollama request timed out after 5 minutes');
        ollama.kill('SIGTERM');
        resolve({ 
          success: false, 
          error: `Ollama request timed out after 5 minutes. Please check if Ollama is running and the model '${model}' is available.` 
        });
      }, 5 * 60 * 1000);
      
      const ollama = spawn('ollama', ['run', model], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';
      let hasResolved = false;

      // Send progress updates to UI
      this.mainWindow?.webContents.send('llm-progress', {
        stage: 'connecting',
        message: `Connecting to Ollama model: ${model}`
      });

      ollama.stdin.write(prompt);
      ollama.stdin.end();

      ollama.stdout.on('data', (data) => {
        const chunk = data.toString();
        output += chunk;
        log.info('Ollama output chunk received:', chunk.substring(0, 100) + '...');
        
        // Send progress update
        this.mainWindow?.webContents.send('llm-progress', {
          stage: 'generating',
          message: 'Generating summary...'
        });
      });

      ollama.stderr.on('data', (data) => {
        const error = data.toString();
        errorOutput += error;
        log.error('Ollama stderr:', error);
        
        // Check for specific error patterns
        if (error.includes('model') && error.includes('not found')) {
          clearTimeout(timeoutId);
          if (!hasResolved) {
            hasResolved = true;
            resolve({ 
              success: false, 
              error: `Model '${model}' not found. Please install it with: ollama pull ${model}` 
            });
          }
        } else if (error.includes('connection refused') || error.includes('connect: connection refused')) {
          clearTimeout(timeoutId);
          if (!hasResolved) {
            hasResolved = true;
            resolve({ 
              success: false, 
              error: 'Cannot connect to Ollama. Please make sure Ollama is running.' 
            });
          }
        }
      });

      ollama.on('error', (error) => {
        log.error('Ollama process error:', error);
        clearTimeout(timeoutId);
        if (!hasResolved) {
          hasResolved = true;
          resolve({ 
            success: false, 
            error: `Ollama process error: ${error.message}. Make sure Ollama is installed and running.` 
          });
        }
      });

      ollama.on('close', (code) => {
        clearTimeout(timeoutId);
        if (!hasResolved) {
          hasResolved = true;
          log.info('Ollama process closed:', { code, outputLength: output.length, errorLength: errorOutput.length });
          
          if (code === 0 && output.trim()) {
            log.info('Ollama summarization completed successfully');
            resolve({ success: true, summary: output.trim() });
          } else {
            let errorMessage = errorOutput || `ollama exited with code ${code}`;
            
            // Provide helpful error messages
            if (code === 1 && errorOutput.includes('model')) {
              errorMessage = `Model '${model}' is not available. Please install it with: ollama pull ${model}`;
            } else if (code === 1 && !errorOutput) {
              errorMessage = `Ollama failed to generate summary. Please check if the model '${model}' is working correctly.`;
            }
            
            resolve({ success: false, error: errorMessage });
          }
        }
      });
    });
  }

  private async callOpenAI(text: string, model: string, apiKey?: string): Promise<{ success: boolean; summary?: string; error?: string }> {
    if (!apiKey) {
      return { success: false, error: 'OpenAI API key not provided' };
    }

    try {
      const prompt = `Please provide a concise summary (maximum 200 words) of the following video transcript and list 3 key points:\n\n${text}`;
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as any;
        return { 
          success: false, 
          error: `OpenAI API error: ${response.status} - ${errorData.error?.message || response.statusText}` 
        };
      }

      const data = await response.json() as any;
      const summary = data.choices?.[0]?.message?.content?.trim();

      if (summary) {
        log.info('OpenAI summarization completed:', { 
          model, 
          inputLength: text.length,
          outputLength: summary.length 
        });
        return { success: true, summary };
      } else {
        return { success: false, error: 'No summary generated by OpenAI' };
      }
    } catch (error) {
      log.error('OpenAI API call failed:', error);
      return { success: false, error: `OpenAI API call failed: ${(error as Error).message}` };
    }
  }

  private async callClaude(text: string, model: string, apiKey?: string): Promise<{ success: boolean; summary?: string; error?: string }> {
    if (!apiKey) {
      return { success: false, error: 'Claude API key not provided' };
    }

    try {
      const prompt = `Please provide a concise summary (maximum 200 words) of the following video transcript and list 3 key points:\n\n${text}`;
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: model,
          max_tokens: 500,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as any;
        return { 
          success: false, 
          error: `Claude API error: ${response.status} - ${errorData.error?.message || response.statusText}` 
        };
      }

      const data = await response.json() as any;
      const summary = data.content?.[0]?.text?.trim();

      if (summary) {
        log.info('Claude summarization completed:', { 
          model, 
          inputLength: text.length,
          outputLength: summary.length 
        });
        return { success: true, summary };
      } else {
        return { success: false, error: 'No summary generated by Claude' };
      }
    } catch (error) {
      log.error('Claude API call failed:', error);
      return { success: false, error: `Claude API call failed: ${(error as Error).message}` };
    }
  }

  public cleanup(): void {
    if (this.database) {
      this.database.close();
    }
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

app.on('before-quit', () => {
  // Cleanup database connection
  if (mainProcess) {
    mainProcess.cleanup();
  }
});