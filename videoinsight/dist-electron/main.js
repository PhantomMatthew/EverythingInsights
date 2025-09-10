"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const electron_log_1 = __importDefault(require("electron-log"));
const isDev = process.env.NODE_ENV === 'development';
class MainProcess {
    constructor() {
        this.mainWindow = null;
        this.tempDir = path.join(os.tmpdir(), 'videoinsight');
        this.ensureTempDir();
        this.setupIPC();
    }
    ensureTempDir() {
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
    }
    createWindow() {
        this.mainWindow = new electron_1.BrowserWindow({
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
    setupIPC() {
        // Download video and extract audio
        electron_1.ipcMain.handle('download-video', async (event, url) => {
            try {
                electron_log_1.default.info('Starting video download:', url);
                return await this.downloadVideo(url);
            }
            catch (error) {
                electron_log_1.default.error('Video download failed:', error);
                throw error;
            }
        });
        // Extract audio using ffmpeg
        electron_1.ipcMain.handle('extract-audio', async (event, videoPath) => {
            try {
                electron_log_1.default.info('Starting audio extraction:', videoPath);
                return await this.extractAudio(videoPath);
            }
            catch (error) {
                electron_log_1.default.error('Audio extraction failed:', error);
                throw error;
            }
        });
        // Speech to text using Whisper
        electron_1.ipcMain.handle('speech-to-text', async (event, audioPath) => {
            try {
                electron_log_1.default.info('Starting speech to text:', audioPath);
                return await this.speechToText(audioPath);
            }
            catch (error) {
                electron_log_1.default.error('Speech to text failed:', error);
                throw error;
            }
        });
        // LLM summarization
        electron_1.ipcMain.handle('llm-summarize', async (event, text, model) => {
            try {
                electron_log_1.default.info('Starting LLM summarization with model:', model);
                return await this.llmSummarize(text, model);
            }
            catch (error) {
                electron_log_1.default.error('LLM summarization failed:', error);
                throw error;
            }
        });
        // Open external links
        electron_1.ipcMain.handle('open-external', async (event, url) => {
            await electron_1.shell.openExternal(url);
        });
        // Show save dialog
        electron_1.ipcMain.handle('show-save-dialog', async (event, options) => {
            const result = await electron_1.dialog.showSaveDialog(this.mainWindow, options);
            return result;
        });
    }
    async downloadVideo(url) {
        return new Promise((resolve) => {
            const outputPath = path.join(this.tempDir, `video_${Date.now()}.%(ext)s`);
            const ytDlp = (0, child_process_1.spawn)('yt-dlp', [
                '-f', 'best[height<=720]',
                '-o', outputPath,
                url
            ]);
            let videoPath = '';
            ytDlp.stdout.on('data', (data) => {
                const output = data.toString();
                electron_log_1.default.info('yt-dlp stdout:', output);
                // Extract the final video path from yt-dlp output
                const pathMatch = output.match(/\[download\] (.+) has already been downloaded/);
                if (pathMatch) {
                    videoPath = pathMatch[1];
                }
            });
            ytDlp.stderr.on('data', (data) => {
                electron_log_1.default.error('yt-dlp stderr:', data.toString());
            });
            ytDlp.on('close', (code) => {
                if (code === 0 && videoPath) {
                    resolve({ success: true, videoPath });
                }
                else {
                    resolve({ success: false, error: `yt-dlp exited with code ${code}` });
                }
            });
        });
    }
    async extractAudio(videoPath) {
        return new Promise((resolve) => {
            const audioPath = path.join(this.tempDir, `audio_${Date.now()}.wav`);
            const ffmpeg = (0, child_process_1.spawn)('ffmpeg', [
                '-i', videoPath,
                '-vn',
                '-acodec', 'pcm_s16le',
                '-ar', '16000',
                '-ac', '1',
                audioPath
            ]);
            ffmpeg.stderr.on('data', (data) => {
                electron_log_1.default.info('ffmpeg stderr:', data.toString());
            });
            ffmpeg.on('close', (code) => {
                if (code === 0) {
                    resolve({ success: true, audioPath });
                }
                else {
                    resolve({ success: false, error: `ffmpeg exited with code ${code}` });
                }
            });
        });
    }
    async speechToText(audioPath) {
        return new Promise((resolve) => {
            const whisper = (0, child_process_1.spawn)('whisper', [audioPath, '--model', 'base', '--output_format', 'txt']);
            let outputText = '';
            whisper.stdout.on('data', (data) => {
                outputText += data.toString();
            });
            whisper.stderr.on('data', (data) => {
                electron_log_1.default.info('whisper stderr:', data.toString());
            });
            whisper.on('close', (code) => {
                if (code === 0) {
                    resolve({ success: true, text: outputText.trim() });
                }
                else {
                    resolve({ success: false, error: `whisper exited with code ${code}` });
                }
            });
        });
    }
    async llmSummarize(text, model) {
        try {
            if (model.startsWith('ollama:')) {
                // Use local Ollama
                const modelName = model.replace('ollama:', '');
                return await this.callOllama(text, modelName);
            }
            else if (model.startsWith('openai:')) {
                // Use OpenAI API
                return await this.callOpenAI(text, model.replace('openai:', ''));
            }
            else {
                return { success: false, error: 'Unsupported model type' };
            }
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async callOllama(text, model) {
        return new Promise((resolve) => {
            const prompt = `Please provide a concise summary (maximum 200 words) of the following video transcript and list 3 key points:\n\n${text}`;
            const ollama = (0, child_process_1.spawn)('ollama', ['run', model], {
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
                }
                else {
                    resolve({ success: false, error: errorOutput || `ollama exited with code ${code}` });
                }
            });
        });
    }
    async callOpenAI(text, model) {
        // This would implement OpenAI API calls
        // For now, return a placeholder
        return { success: false, error: 'OpenAI integration not implemented yet' };
    }
}
const mainProcess = new MainProcess();
electron_1.app.whenReady().then(() => {
    mainProcess.createWindow();
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            mainProcess.createWindow();
        }
    });
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
//# sourceMappingURL=main.js.map