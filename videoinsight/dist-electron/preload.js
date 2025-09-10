"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const electronAPI = {
    // Video processing
    downloadVideo: (url) => electron_1.ipcRenderer.invoke('download-video', url),
    extractAudio: (videoPath) => electron_1.ipcRenderer.invoke('extract-audio', videoPath),
    speechToText: (audioPath) => electron_1.ipcRenderer.invoke('speech-to-text', audioPath),
    llmSummarize: (text, model) => electron_1.ipcRenderer.invoke('llm-summarize', text, model),
    // System operations
    openExternal: (url) => electron_1.ipcRenderer.invoke('open-external', url),
    showSaveDialog: (options) => electron_1.ipcRenderer.invoke('show-save-dialog', options),
    // Event listeners for progress updates
    onDownloadProgress: (callback) => {
        electron_1.ipcRenderer.on('download-progress', (_event, progress) => callback(progress));
        return () => electron_1.ipcRenderer.removeAllListeners('download-progress');
    },
    onExtractionProgress: (callback) => {
        electron_1.ipcRenderer.on('extraction-progress', (_event, progress) => callback(progress));
        return () => electron_1.ipcRenderer.removeAllListeners('extraction-progress');
    },
    onTranscriptionProgress: (callback) => {
        electron_1.ipcRenderer.on('transcription-progress', (_event, progress) => callback(progress));
        return () => electron_1.ipcRenderer.removeAllListeners('transcription-progress');
    }
};
electron_1.contextBridge.exposeInMainWorld('electronAPI', electronAPI);
//# sourceMappingURL=preload.js.map