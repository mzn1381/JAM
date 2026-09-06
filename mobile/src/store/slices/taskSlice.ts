// stores/slices/createTaskSlice.ts
import { StateCreator } from 'zustand';
import { Task } from '../../types/Tasks';
import { DEFAULT_TASKS, NEW_TASK } from '../../utils/constants';
import { v4 as uuidv4 } from 'uuid';

export interface TaskSlice {
  tasks: Task[];
  activeTaskId: string | null;
  isInitialized: boolean; // Track if defaults have been loaded

  // Task operations
  createTask: (task: Task) => string;
  createNewTask: () => string;
  deleteTask: (taskId: string) => void;
  updateTask: (taskId: string, updates: Partial<Omit<Task, 'id'>>) => void;
  toggleTaskCompletion: (taskId: string) => void;

  // Initialization
  initializeDefaultTasks: () => void;

  // Auto-creation logic
  ensureTaskExists: (taskId: string) => string;

  // Active task
  setActiveTaskId: (taskId: string | null) => void;
  getActiveTask: () => Task | undefined;

  // Getters
  getTaskById: (taskId: string) => Task | undefined;
  getAllTasks: () => Task[];
  getPinnedTasks: () => Task[];
  getTasksByCategory: (category: string) => Task[];
}

export const createTaskSlice: StateCreator<TaskSlice> = (set, get) => ({
  tasks: [],
  activeTaskId: null,
  isInitialized: false,

  initializeDefaultTasks: () => {
    const { tasks, isInitialized } = get();

    // Only initialize if not already done and no tasks exist
    if (!isInitialized && tasks.length === 0) {
      set({
        tasks: [...DEFAULT_TASKS],
        isInitialized: true,
      });
    }
  },

  createTask: task => {
    set(state => ({
      tasks: [...state.tasks, task],
      activeTaskId: task.id,
    }));

    return task.id;
  },

  createNewTask: () => {
    return get().createTask({
      ...NEW_TASK,
      id: uuidv4(),
      datetime: new Date().toISOString(),
    });
  },

  ensureTaskExists: taskId => {
    if (taskId === '0') {
      return get().createNewTask();
    }

    const existingTask = get().getTaskById(taskId);
    if (!existingTask) {
      console.warn(`Task ${taskId} not found, creating new task`);
      return get().createNewTask();
    }

    return taskId;
  },

  deleteTask: taskId => {
    set(state => ({
      tasks: state.tasks.filter(task => task.id !== taskId),
      activeTaskId: state.activeTaskId === taskId ? null : state.activeTaskId,
    }));
  },

  updateTask: (taskId, updates) => {
    set(state => ({
      tasks: state.tasks.map(task =>
        task.id === taskId ? { ...task, ...updates } : task,
      ),
    }));
  },

  toggleTaskCompletion: taskId => {
    set(state => ({
      tasks: state.tasks.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task,
      ),
    }));
  },

  setActiveTaskId: taskId => {
    set({ activeTaskId: taskId });
  },

  getActiveTask: () => {
    const { tasks, activeTaskId } = get();
    return tasks.find(task => task.id === activeTaskId);
  },

  getTaskById: taskId => {
    return get().tasks.find(task => task.id === taskId);
  },

  getAllTasks: () => {
    return get().tasks;
  },

  getPinnedTasks: () => {
    return get().tasks.filter(task => task.pinned);
  },

  getTasksByCategory: category => {
    return get().tasks.filter(task => task.category === category);
  },
});
