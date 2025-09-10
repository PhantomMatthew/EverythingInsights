import { contextBridge, ipcRenderer } from 'electron';

const electronAPI = {
  // Video processing
  downloadVideo: (url: string) => ipcRenderer.invoke('download-video', url),
  extractAudio: (videoPath: string) => ipcRenderer.invoke('extract-audio', videoPath),
  speechToText: (audioPath: string, model?: string) => ipcRenderer.invoke('speech-to-text', audioPath, model),
  llmSummarize: (text: string, model: string, apiKeys?: any) => ipcRenderer.invoke('llm-summarize', text, model, apiKeys),

  // System operations
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  showSaveDialog: (options: any) => ipcRenderer.invoke('show-save-dialog', options),

  // Database operations
  dbSaveTask: (task: any) => ipcRenderer.invoke('db-save-task', task),
  dbUpdateTask: (id: string, updates: any) => ipcRenderer.invoke('db-update-task', id, updates),
  dbGetTask: (id: string) => ipcRenderer.invoke('db-get-task', id),
  dbGetAllTasks: (limit?: number, offset?: number) => ipcRenderer.invoke('db-get-all-tasks', limit, offset),
  dbGetTasksByStatus: (status: string) => ipcRenderer.invoke('db-get-tasks-by-status', status),
  dbSearchTasks: (query: string) => ipcRenderer.invoke('db-search-tasks', query),
  dbDeleteTask: (id: string) => ipcRenderer.invoke('db-delete-task', id),
  dbGetStats: () => ipcRenderer.invoke('db-get-stats'),
  dbCleanup: () => ipcRenderer.invoke('db-cleanup'),

  // Event listeners for progress updates
  onDownloadProgress: (callback: (progress: any) => void) => {
    ipcRenderer.on('download-progress', (_event, progress) => callback(progress));
    return () => ipcRenderer.removeAllListeners('download-progress');
  },
  
  onExtractionProgress: (callback: (progress: any) => void) => {
    ipcRenderer.on('extraction-progress', (_event, progress) => callback(progress));
    return () => ipcRenderer.removeAllListeners('extraction-progress');
  },
  
  onTranscriptionProgress: (callback: (progress: any) => void) => {
    ipcRenderer.on('transcription-progress', (_event, progress) => callback(progress));
    return () => ipcRenderer.removeAllListeners('transcription-progress');
  }
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

export type ElectronAPI = typeof electronAPI;