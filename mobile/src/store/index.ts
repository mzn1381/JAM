// stores/index.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createThemeSlice, ThemeSlice } from './slices/themeSlice';
import { createUserSlice, UserSlice } from './slices/userSlice';
import { createTaskSlice, TaskSlice } from './slices/taskSlice';
import { createMessageSlice, MessageSlice } from './slices/messageSlice';
import {
  createLocalSecuritySlice,
  LocalSecuritySlice,
} from './slices/localSecuritySlice';
import { LocalTask, Task } from '../types/Tasks';
import { Message } from '../types/Chat';
import {
  NEW_TASK,
  WELCOME_MESSAGE,
  WELCOME_TEXT_MESSAGES,
} from '../utils/constants';
import { randomText } from '../utils/handlers';
import { createLoggerSlice, LoggerSlice } from './slices/loggerSlice';
import { v4 as uuidv4 } from 'uuid';
import { AuthSlice, createAuthSlice } from './slices/authSlice';

export type StoreState = ThemeSlice &
  UserSlice &
  TaskSlice &
  MessageSlice &
  LocalSecuritySlice &
  LoggerSlice &
  AuthSlice;

export const useStore = create<StoreState>()(
  persist(
    (...a) => ({
      ...createThemeSlice(...a),
      ...createUserSlice(...a),
      ...createTaskSlice(...a),
      ...createMessageSlice(...a),
      ...createLocalSecuritySlice(...a),
      ...createLoggerSlice(...a),
      ...createAuthSlice(...a),
    }),
    {
      name: 'pishkar-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        themeMode: state.themeMode,
        isRTL: state.isRTL,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        tasks: state.tasks,
        activeTaskId: state.activeTaskId,
        messages: state.messages.filter(message => !message.isTemporary),
        isOnboarded: state.isOnboarded,
        isSelectedPreferences: state.isSelectedPreferences,
        pishkarAvatar: state.pishkarAvatar,
      }),
    },
  ),
);

// // Existing selectors
// export const useUser = () => useStore(state => state.user);
// export const useThemeMode = () => useStore(state => state.themeMode);
// export const useCurrentTheme = () => useStore(state => state.currentTheme);
// export const useIsAuthenticated = () =>
//   useStore(state => state.isAuthenticated);

// // Task selectors
// export const useTasks = () => useStore(state => state.tasks);
// export const useActiveTask = () => useStore(state => state.getActiveTask());
export const useTaskById = (taskId: string) => {
  return useStore(state => state.getTaskById(taskId));
};
export const useRemoveTaskAndMessages = () => {
  const deleteTask = useStore(state => state.deleteTask);
  const deleteMessagesByTaskId = useStore(
    state => state.deleteMessagesByTaskId,
  );
  return (taskId: string) => {
    deleteTask(taskId);
    deleteMessagesByTaskId(taskId);
  };
};

// // Message selectors
// export const useMessages = () => useStore(state => state.messages);
// export const useMessagesByTaskId = (taskId: string) =>
//   useStore(state => state.getMessagesByTaskId(taskId));
// export const useMessageCount = (taskId: string) =>
//   useStore(state => state.getMessageCount(taskId));

export const useCreateMessageDirectly = () => {
  const createTask = useStore(state => state.createTask);
  const assMessage = useStore(state => state.addMessage);

  return () => {
    const newTask: Task = {
      ...NEW_TASK,
      id: uuidv4(), //`task-${Date.now()}`,
      datetime: new Date().toISOString(),
    };

    const welcomeMessage: Message = {
      ...WELCOME_MESSAGE,
      id: (Date.now() + 1).toString(),
      timestamp: new Date().toISOString(),
      text: randomText(WELCOME_TEXT_MESSAGES),
    };

    createTask(newTask);
    assMessage(newTask.id, welcomeMessage);
    return newTask.id;
  };
};

// Combined selector for LocalTask (task with messages)
export const useLocalTask = (taskId: string): LocalTask | undefined =>
  useStore(state => {
    const task = state.getTaskById(taskId);
    if (!task) return undefined;

    const messages = state.getMessagesByTaskId(taskId);
    return {
      ...task,
      messages,
    };
  });

// Get all LocalTasks
export const useLocalTasks = (): LocalTask[] =>
  useStore(state => {
    return state.tasks.map(task => ({
      ...task,
      messages: state.getMessagesByTaskId(task.id),
    }));
  });
// // Optional: Separate store for sensitive data (not persisted)
// export const useAuthStore = create<{
//   token: string | null;
//   setToken: (token: string | null) => void;
// }>((set) => ({
//   token: null,
//   setToken: (token) => set({ token }),
// }));

export const Logger = {
  info: (message: string, details?: any) => {
    useStore.getState().addLog('info', message, details);
    console.log('ℹ️', message, details);
  },

  warn: (message: string, details?: any) => {
    useStore.getState().addLog('warn', message, details);
    console.warn('⚠️', message, details);
  },

  error: (message: string, details?: any) => {
    useStore.getState().addLog('error', message, details);
    console.error('❌', message, details);
  },

  success: (message: string, details?: any) => {
    useStore.getState().addLog('success', message, details);
    console.log('✅', message, details);
  },

  network: (message: string, details?: any) => {
    useStore.getState().addLog('network', message, details);
    console.log('🌐', message, details);
  },
};
