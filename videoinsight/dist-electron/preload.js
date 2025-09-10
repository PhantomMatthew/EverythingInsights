"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const electronAPI = {
    // Video processing
    downloadVideo: (url, cookiesFile) => electron_1.ipcRenderer.invoke('download-video', url, cookiesFile),
    extractAudio: (videoPath) => electron_1.ipcRenderer.invoke('extract-audio', videoPath),
    speechToText: (audioPath, model) => electron_1.ipcRenderer.invoke('speech-to-text', audioPath, model),
    llmSummarize: (text, model, apiKeys) => electron_1.ipcRenderer.invoke('llm-summarize', text, model, apiKeys),
    // System operations
    openExternal: (url) => electron_1.ipcRenderer.invoke('open-external', url),
    showSaveDialog: (options) => electron_1.ipcRenderer.invoke('show-save-dialog', options),
    showOpenDialog: (options) => electron_1.ipcRenderer.invoke('show-open-dialog', options),
    // Database operations
    dbSaveTask: (task) => electron_1.ipcRenderer.invoke('db-save-task', task),
    dbUpdateTask: (id, updates) => electron_1.ipcRenderer.invoke('db-update-task', id, updates),
    dbGetTask: (id) => electron_1.ipcRenderer.invoke('db-get-task', id),
    dbGetAllTasks: (limit, offset) => electron_1.ipcRenderer.invoke('db-get-all-tasks', limit, offset),
    dbGetTasksByStatus: (status) => electron_1.ipcRenderer.invoke('db-get-tasks-by-status', status),
    dbSearchTasks: (query) => electron_1.ipcRenderer.invoke('db-search-tasks', query),
    dbDeleteTask: (id) => electron_1.ipcRenderer.invoke('db-delete-task', id),
    dbGetStats: () => electron_1.ipcRenderer.invoke('db-get-stats'),
    dbCleanup: () => electron_1.ipcRenderer.invoke('db-cleanup'),
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