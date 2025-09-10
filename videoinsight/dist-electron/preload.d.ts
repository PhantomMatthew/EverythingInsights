declare const electronAPI: {
    downloadVideo: (url: string) => Promise<any>;
    extractAudio: (videoPath: string) => Promise<any>;
    speechToText: (audioPath: string) => Promise<any>;
    llmSummarize: (text: string, model: string) => Promise<any>;
    openExternal: (url: string) => Promise<any>;
    showSaveDialog: (options: any) => Promise<any>;
    onDownloadProgress: (callback: (progress: any) => void) => () => Electron.IpcRenderer;
    onExtractionProgress: (callback: (progress: any) => void) => () => Electron.IpcRenderer;
    onTranscriptionProgress: (callback: (progress: any) => void) => () => Electron.IpcRenderer;
};
export type ElectronAPI = typeof electronAPI;
export {};
//# sourceMappingURL=preload.d.ts.map