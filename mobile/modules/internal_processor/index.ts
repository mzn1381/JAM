import {
  InternalProcessor,
  ChatbotTask,
  ProcessedTask,
} from './src/InternalProcessor';

// ==================== SINGLETON INSTANCE ====================
export const internalProcessor = new InternalProcessor();
export { InternalProcessor };

export type { ChatbotTask, ProcessedTask };
