export interface ElectronAPI {
  downloadVideo: (url: string) => Promise<{ success: boolean; videoPath?: string; error?: string; title?: string }>;
  extractAudio: (videoPath: string) => Promise<{ success: boolean; audioPath?: string; error?: string }>;
  speechToText: (audioPath: string, model?: string) => Promise<{ success: boolean; text?: string; error?: string }>;
  llmSummarize: (text: string, model: string, apiKeys?: any) => Promise<{ success: boolean; summary?: string; error?: string }>;
  openExternal: (url: string) => Promise<void>;
  showSaveDialog: (options: any) => Promise<any>;
  
  // Database operations
  dbSaveTask: (task: any) => Promise<any>;
  dbUpdateTask: (id: string, updates: any) => Promise<boolean>;
  dbGetTask: (id: string) => Promise<any>;
  dbGetAllTasks: (limit?: number, offset?: number) => Promise<any[]>;
  dbGetTasksByStatus: (status: string) => Promise<any[]>;
  dbSearchTasks: (query: string) => Promise<any[]>;
  dbDeleteTask: (id: string) => Promise<boolean>;
  dbGetStats: () => Promise<{ total: number; completed: number; failed: number; inProgress: number }>;
  dbCleanup: () => Promise<{ success: boolean }>;
  
  onDownloadProgress: (callback: (progress: any) => void) => () => void;
  onExtractionProgress: (callback: (progress: any) => void) => () => void;
  onTranscriptionProgress: (callback: (progress: any) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}