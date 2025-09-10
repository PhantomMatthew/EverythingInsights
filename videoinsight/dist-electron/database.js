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
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const fs = __importStar(require("fs"));
const electron_log_1 = __importDefault(require("electron-log"));
class DatabaseService {
    constructor() {
        // Create database directory
        const dbDir = path.join(os.homedir(), '.videoinsight');
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }
        this.dbPath = path.join(dbDir, 'tasks.db');
        this.initializeDatabase();
    }
    initializeDatabase() {
        try {
            this.db = new better_sqlite3_1.default(this.dbPath);
            this.createTables();
            electron_log_1.default.info('Database initialized:', this.dbPath);
        }
        catch (error) {
            electron_log_1.default.error('Failed to initialize database:', error);
            throw error;
        }
    }
    createTables() {
        // Tasks table
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        title TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        progress INTEGER DEFAULT 0,
        video_path TEXT,
        audio_path TEXT,
        transcript TEXT,
        summary TEXT,
        error TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        duration INTEGER,
        file_size INTEGER
      )
    `);
        // Create indexes for better performance
        this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
      CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
      CREATE INDEX IF NOT EXISTS idx_tasks_url ON tasks(url);
    `);
        electron_log_1.default.info('Database tables created/verified');
    }
    saveTask(task) {
        try {
            const stmt = this.db.prepare(`
        INSERT INTO tasks (
          id, url, title, status, progress, video_path, audio_path,
          transcript, summary, error, created_at, completed_at, duration, file_size
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
            const now = new Date();
            const taskData = {
                id: task.id || `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                url: task.url || '',
                title: task.title || null,
                status: task.status || 'pending',
                progress: task.progress || 0,
                video_path: task.video_path || null,
                audio_path: task.audio_path || null,
                transcript: task.transcript || null,
                summary: task.summary || null,
                error: task.error || null,
                created_at: task.created_at || now,
                completed_at: task.completed_at || null,
                duration: task.duration || null,
                file_size: task.file_size || null,
            };
            const result = stmt.run(taskData.id, taskData.url, taskData.title, taskData.status, taskData.progress, taskData.video_path, taskData.audio_path, taskData.transcript, taskData.summary, taskData.error, taskData.created_at.toISOString(), taskData.completed_at?.toISOString() || null, taskData.duration, taskData.file_size);
            if (result.changes > 0) {
                electron_log_1.default.info('Task saved to database:', taskData.id);
                return taskData;
            }
            else {
                electron_log_1.default.warn('Failed to save task to database');
                return null;
            }
        }
        catch (error) {
            electron_log_1.default.error('Error saving task to database:', error);
            return null;
        }
    }
    updateTask(id, updates) {
        try {
            const fields = [];
            const values = [];
            // Build dynamic update query
            Object.entries(updates).forEach(([key, value]) => {
                if (key === 'id')
                    return; // Don't update ID
                fields.push(`${key} = ?`);
                if (key === 'created_at' || key === 'completed_at') {
                    values.push(value ? new Date(value).toISOString() : null);
                }
                else {
                    values.push(value);
                }
            });
            if (fields.length === 0) {
                electron_log_1.default.warn('No fields to update for task:', id);
                return false;
            }
            values.push(id); // Add ID for WHERE clause
            const stmt = this.db.prepare(`
        UPDATE tasks 
        SET ${fields.join(', ')} 
        WHERE id = ?
      `);
            const result = stmt.run(...values);
            if (result.changes > 0) {
                electron_log_1.default.info('Task updated in database:', id);
                return true;
            }
            else {
                electron_log_1.default.warn('No task found to update:', id);
                return false;
            }
        }
        catch (error) {
            electron_log_1.default.error('Error updating task in database:', error);
            return false;
        }
    }
    getTask(id) {
        try {
            const stmt = this.db.prepare('SELECT * FROM tasks WHERE id = ?');
            const row = stmt.get(id);
            if (row) {
                return this.rowToTask(row);
            }
            return null;
        }
        catch (error) {
            electron_log_1.default.error('Error getting task from database:', error);
            return null;
        }
    }
    getAllTasks(limit, offset) {
        try {
            let query = 'SELECT * FROM tasks ORDER BY created_at DESC';
            const params = [];
            if (limit) {
                query += ' LIMIT ?';
                params.push(limit);
                if (offset) {
                    query += ' OFFSET ?';
                    params.push(offset);
                }
            }
            const stmt = this.db.prepare(query);
            const rows = stmt.all(...params);
            return rows.map(row => this.rowToTask(row));
        }
        catch (error) {
            electron_log_1.default.error('Error getting tasks from database:', error);
            return [];
        }
    }
    getTasksByStatus(status) {
        try {
            const stmt = this.db.prepare('SELECT * FROM tasks WHERE status = ? ORDER BY created_at DESC');
            const rows = stmt.all(status);
            return rows.map(row => this.rowToTask(row));
        }
        catch (error) {
            electron_log_1.default.error('Error getting tasks by status from database:', error);
            return [];
        }
    }
    searchTasks(query) {
        try {
            const stmt = this.db.prepare(`
        SELECT * FROM tasks 
        WHERE url LIKE ? OR title LIKE ? OR transcript LIKE ? OR summary LIKE ?
        ORDER BY created_at DESC
      `);
            const searchTerm = `%${query}%`;
            const rows = stmt.all(searchTerm, searchTerm, searchTerm, searchTerm);
            return rows.map(row => this.rowToTask(row));
        }
        catch (error) {
            electron_log_1.default.error('Error searching tasks in database:', error);
            return [];
        }
    }
    deleteTask(id) {
        try {
            const stmt = this.db.prepare('DELETE FROM tasks WHERE id = ?');
            const result = stmt.run(id);
            if (result.changes > 0) {
                electron_log_1.default.info('Task deleted from database:', id);
                return true;
            }
            else {
                electron_log_1.default.warn('No task found to delete:', id);
                return false;
            }
        }
        catch (error) {
            electron_log_1.default.error('Error deleting task from database:', error);
            return false;
        }
    }
    getTaskStats() {
        try {
            const stmt = this.db.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
          SUM(CASE WHEN status IN ('downloading', 'extracting', 'transcribing', 'summarizing') THEN 1 ELSE 0 END) as inProgress
        FROM tasks
      `);
            const result = stmt.get();
            return {
                total: result.total || 0,
                completed: result.completed || 0,
                failed: result.failed || 0,
                inProgress: result.inProgress || 0,
            };
        }
        catch (error) {
            electron_log_1.default.error('Error getting task stats from database:', error);
            return { total: 0, completed: 0, failed: 0, inProgress: 0 };
        }
    }
    cleanup() {
        try {
            // Delete old temporary files and failed tasks older than 30 days
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const stmt = this.db.prepare(`
        DELETE FROM tasks 
        WHERE status = 'failed' AND created_at < ?
      `);
            const result = stmt.run(thirtyDaysAgo.toISOString());
            if (result.changes > 0) {
                electron_log_1.default.info(`Cleaned up ${result.changes} old failed tasks`);
            }
        }
        catch (error) {
            electron_log_1.default.error('Error during database cleanup:', error);
        }
    }
    rowToTask(row) {
        return {
            id: row.id,
            url: row.url,
            title: row.title,
            status: row.status,
            progress: row.progress,
            video_path: row.video_path,
            audio_path: row.audio_path,
            transcript: row.transcript,
            summary: row.summary,
            error: row.error,
            created_at: new Date(row.created_at),
            completed_at: row.completed_at ? new Date(row.completed_at) : undefined,
            duration: row.duration,
            file_size: row.file_size,
        };
    }
    close() {
        if (this.db) {
            this.db.close();
            electron_log_1.default.info('Database connection closed');
        }
    }
}
exports.default = DatabaseService;
//# sourceMappingURL=database.js.map