import { create } from 'zustand';

export interface Task {
  id: string;
  url: string;
  title?: string;
  status: 'pending' | 'downloading' | 'extracting' | 'transcribing' | 'summarizing' | 'completed' | 'failed';
  progress: number;
  videoPath?: string;
  audioPath?: string;
  transcript?: string;
  summary?: string;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface Settings {
  llmModel: string;
  apiKeys: {
    openai?: string;
    claude?: string;
  };
  whisperModel: string;
  theme: 'light' | 'dark' | 'system';
  outputFormat: 'txt' | 'md';
  tempDirectory: string;
  cookiesFile: string;
}

interface AppState {
  // Tasks
  tasks: Task[];
  currentTask: Task | null;
  
  // Settings
  settings: Settings;
  
  // UI State
  sidebarOpen: boolean;
  currentView: 'home' | 'tasks' | 'settings';
  
  // Actions
  addTask: (url: string) => string;
  updateTask: (id: string, updates: Partial<Task>) => void;
  removeTask: (id: string) => void;
  setCurrentTask: (task: Task | null) => void;
  
  // Settings actions
  updateSettings: (updates: Partial<Settings>) => void;
  
  // UI actions
  setSidebarOpen: (open: boolean) => void;
  setCurrentView: (view: 'home' | 'tasks' | 'settings') => void;
  
  // Task management
  startTaskProcessing: (taskId: string) => void;
  completeTaskProcessing: (taskId: string) => void;
}

const defaultSettings: Settings = {
  llmModel: 'ollama:qwen3:30b',
  apiKeys: {},
  whisperModel: 'base',
  theme: 'system',
  outputFormat: 'md',
  tempDirectory: '',
  cookiesFile: '',
};

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  tasks: [],
  currentTask: null,
  settings: defaultSettings,
  sidebarOpen: false,
  currentView: 'home',

  // Task actions
  addTask: (url: string) => {
    const id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newTask: Task = {
      id,
      url,
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
    };
    
    set((state) => ({
      tasks: [...state.tasks, newTask],
    }));
    
    return id;
  },

  updateTask: (id: string, updates: Partial<Task>) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id ? { ...task, ...updates } : task
      ),
      currentTask: state.currentTask?.id === id 
        ? { ...state.currentTask, ...updates } 
        : state.currentTask,
    }));
  },

  removeTask: (id: string) => {
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== id),
      currentTask: state.currentTask?.id === id ? null : state.currentTask,
    }));
  },

  setCurrentTask: (task: Task | null) => {
    set({ currentTask: task });
  },

  // Settings actions
  updateSettings: (updates: Partial<Settings>) => {
    set((state) => ({
      settings: { ...state.settings, ...updates },
    }));
  },

  // UI actions
  setSidebarOpen: (open: boolean) => {
    set({ sidebarOpen: open });
  },

  setCurrentView: (view: 'home' | 'tasks' | 'settings') => {
    set({ currentView: view });
  },

  // Task processing
  startTaskProcessing: (taskId: string) => {
    const task = get().tasks.find(t => t.id === taskId);
    if (task) {
      get().updateTask(taskId, { status: 'downloading', progress: 0 });
      get().setCurrentTask(task);
    }
  },

  completeTaskProcessing: (taskId: string) => {
    get().updateTask(taskId, { 
      status: 'completed', 
      progress: 100, 
      completedAt: new Date() 
    });
  },
}));