declare const electronAPI: {
    downloadVideo: (url: string) => Promise<any>;
    extractAudio: (videoPath: string) => Promise<any>;
    speechToText: (audioPath: string, model?: string) => Promise<any>;
    llmSummarize: (text: string, model: string, apiKeys?: any) => Promise<any>;
    openExternal: (url: string) => Promise<any>;
    showSaveDialog: (options: any) => Promise<any>;
    dbSaveTask: (task: any) => Promise<any>;
    dbUpdateTask: (id: string, updates: any) => Promise<any>;
    dbGetTask: (id: string) => Promise<any>;
    dbGetAllTasks: (limit?: number, offset?: number) => Promise<any>;
    dbGetTasksByStatus: (status: string) => Promise<any>;
    dbSearchTasks: (query: string) => Promise<any>;
    dbDeleteTask: (id: string) => Promise<any>;
    dbGetStats: () => Promise<any>;
    dbCleanup: () => Promise<any>;
    onDownloadProgress: (callback: (progress: any) => void) => () => Electron.IpcRenderer;
    onExtractionProgress: (callback: (progress: any) => void) => () => Electron.IpcRenderer;
    onTranscriptionProgress: (callback: (progress: any) => void) => () => Electron.IpcRenderer;
};
export type ElectronAPI = typeof electronAPI;
export {};
//# sourceMappingURL=preload.d.ts.map