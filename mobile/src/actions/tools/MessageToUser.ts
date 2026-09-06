import { Logger, useStore } from '../../store';
import { Message } from '../../types/Chat';

export const handleSendMessage = (taskId: string, inputText: string) => {
  const { addMessage } = useStore.getState();

  const trimmed = inputText.trim();

  if (!trimmed) {
    Logger.warn('Attempted to send empty message', { taskId });
    return;
  }

  Logger.info('Sending bot message to user', {
    taskId,
    messageLength: trimmed.length,
    preview: trimmed.substring(0, 50) + '...',
  });

  const newMessage: Message = {
    id: Date.now().toString(),
    taskId: taskId,
    text: trimmed,
    isUser: false,
    toolType: 'TEXT',
    timestamp: new Date().toISOString(),
  };

  addMessage(taskId, newMessage);

  Logger.success('Bot message added to conversation', {
    taskId,
    messageId: newMessage.id,
  });
};
