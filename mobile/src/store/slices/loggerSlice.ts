import { StateCreator } from 'zustand';

export type LogLevel = 'info' | 'warn' | 'error' | 'success' | 'network';

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
  details?: any;
}

export interface LoggerSlice {
  logs: LogEntry[];
  filterLevel: LogLevel | 'all';
  addLog: (level: LogLevel, message: string, details?: any) => void;
  clearLogs: () => void;
  setFilterLevel: (level: LogLevel | 'all') => void;
}

export const createLoggerSlice: StateCreator<LoggerSlice> = set => ({
  logs: [],
  filterLevel: 'all',

  addLog: (level, message, details) => {
    const log: LogEntry = {
      id: Date.now().toString(),
      timestamp: new Date(),
      level,
      message,
      details,
    };
    set(state => ({
      logs: [...state.logs, log].slice(-500), // Keep only the latest 500 logs
    }));
  },

  clearLogs: () => set({ logs: [] }),

  setFilterLevel: level => set({ filterLevel: level }),
});
