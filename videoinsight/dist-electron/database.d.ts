export interface TaskRecord {
    id: string;
    url: string;
    title?: string;
    status: 'pending' | 'downloading' | 'extracting' | 'transcribing' | 'summarizing' | 'completed' | 'failed';
    progress: number;
    video_path?: string;
    audio_path?: string;
    transcript?: string;
    summary?: string;
    error?: string;
    created_at: Date;
    completed_at?: Date;
    duration?: number;
    file_size?: number;
}
declare class DatabaseService {
    private db;
    private dbPath;
    constructor();
    private initializeDatabase;
    private createTables;
    saveTask(task: Partial<TaskRecord>): TaskRecord | null;
    updateTask(id: string, updates: Partial<TaskRecord>): boolean;
    getTask(id: string): TaskRecord | null;
    getAllTasks(limit?: number, offset?: number): TaskRecord[];
    getTasksByStatus(status: string): TaskRecord[];
    searchTasks(query: string): TaskRecord[];
    deleteTask(id: string): boolean;
    getTaskStats(): {
        total: number;
        completed: number;
        failed: number;
        inProgress: number;
    };
    cleanup(): void;
    private rowToTask;
    close(): void;
}
export default DatabaseService;
//# sourceMappingURL=database.d.ts.map