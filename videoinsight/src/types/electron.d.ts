export interface ElectronAPI {
  downloadVideo: (url: string) => Promise<{ success: boolean; videoPath?: string; error?: string }>;
  extractAudio: (videoPath: string) => Promise<{ success: boolean; audioPath?: string; error?: string }>;
  speechToText: (audioPath: string) => Promise<{ success: boolean; text?: string; error?: string }>;
  llmSummarize: (text: string, model: string) => Promise<{ success: boolean; summary?: string; error?: string }>;
  openExternal: (url: string) => Promise<void>;
  showSaveDialog: (options: any) => Promise<any>;
  onDownloadProgress: (callback: (progress: any) => void) => () => void;
  onExtractionProgress: (callback: (progress: any) => void) => () => void;
  onTranscriptionProgress: (callback: (progress: any) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}