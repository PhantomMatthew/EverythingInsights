import { contextBridge, ipcRenderer } from 'electron';

const electronAPI = {
  // Video processing
  downloadVideo: (url: string) => ipcRenderer.invoke('download-video', url),
  extractAudio: (videoPath: string) => ipcRenderer.invoke('extract-audio', videoPath),
  speechToText: (audioPath: string) => ipcRenderer.invoke('speech-to-text', audioPath),
  llmSummarize: (text: string, model: string) => ipcRenderer.invoke('llm-summarize', text, model),

  // System operations
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  showSaveDialog: (options: any) => ipcRenderer.invoke('show-save-dialog', options),

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