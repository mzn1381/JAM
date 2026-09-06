// stores/slices/createMessageSlice.ts
import { StateCreator } from 'zustand';
import { Message } from '../../types/Chat'; // adjust path as needed
import { DEFAULT_MESSAGES } from '../../utils/constants';

export interface MessageSlice {
  messages: Message[];
  isInitialized: boolean;

  initializeDefaultMessages: () => void;

  // Message operations
  addMessage: (taskId: string, message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  deleteMessage: (messageId: string) => void;
  deleteMessagesByTaskId: (taskId: string) => void;
  deleteTemporaryMessages: () => void;

  // Getters
  getMessagesByTaskId: (taskId: string) => Message[];
  getMessageById: (messageId: string) => Message | undefined;
  getMessageCount: (taskId: string) => number;
  getLatestMessage: (taskId: string) => Message | undefined;
}

export const createMessageSlice: StateCreator<MessageSlice> = (set, get) => ({
  messages: [],
  isInitialized: false,

  initializeDefaultMessages: () => {
    const { messages, isInitialized } = get();

    // Only initialize if not already done and no tasks exist
    if (!isInitialized && messages.length === 0) {
      set({
        messages: [...DEFAULT_MESSAGES],
        isInitialized: true,
      });
    }
  },

  addMessage: (taskId, message) => {
    const messageWithTask = {
      ...message,
      taskId,
    };

    set(state => ({
      messages: [...state.messages, messageWithTask],
    }));
  },

  updateMessage: (messageId, updates) => {
    set(state => ({
      messages: state.messages.map(msg =>
        msg.id === messageId ? { ...msg, ...updates } : msg,
      ),
    }));
  },

  deleteMessage: messageId => {
    set(state => ({
      messages: state.messages.filter(msg => msg.id !== messageId),
    }));
  },

  deleteMessagesByTaskId: taskId => {
    set(state => ({
      messages: state.messages.filter(msg => msg.taskId !== taskId),
    }));
  },

  deleteTemporaryMessages: () => {
    set(state => ({
      messages: state.messages.filter(msg => !msg.isTemporary),
    }));
  },

  getMessagesByTaskId: taskId => {
    return get().messages.filter(msg => msg.taskId === taskId);
  },

  getMessageById: messageId => {
    return get().messages.find(msg => msg.id === messageId);
  },

  getMessageCount: taskId => {
    return get().messages.filter(msg => msg.taskId === taskId).length;
  },

  getLatestMessage: taskId => {
    const taskMessages = get().messages.filter(msg => msg.taskId === taskId);
    return taskMessages[taskMessages.length - 1];
  },
});
