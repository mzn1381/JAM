import Toast from 'react-native-toast-message';
import { Logger, useStore } from '../store';
import { Message } from '../types/Chat';
import { handelActions, handleChatbotMessage } from './handlers';
import { TASKS_BADGE_CATEGORY } from '../utils/constants';

type TaskBadgeKey = keyof typeof TASKS_BADGE_CATEGORY;

function isTaskBadgeKey(key: string): key is TaskBadgeKey {
  return key in TASKS_BADGE_CATEGORY;
}

export const useToolsHandler = () => {
  const updateTask = useStore(state => state.updateTask);

  /**
   * Main executor for handling chatbot → tools → user flow.
   * 1. Sends the user's text to the internal processor / AI backend
   * 2. Handles error / success responses
   * 3. Routes the typed ToolResponse to handelActions for execution
   */
  const handleActionsTools = async (
    taskId: string,
    text: string,
    messages: Message[],
  ) => {
    Logger.info('Starting tools handler', {
      taskId,
      textLength: text.length,
    });
    try {
      const { toolResponse, actionPayload, message, success, error } =
        await handleChatbotMessage(taskId, text);

      // Handle server or network errors
      if (error) {
        Toast.show({
          type: 'error',
          text1: 'خطا در ارتباط با سرور',
          text2: error,
          autoHide: false,
        });

        Logger.error('Server/Network error in chatbot API', {
          taskId,
          error,
          text: text.substring(0, 50),
        });
        return;
      }

      // Validate that the server returned a tool response
      if (!toolResponse || !success) {
        Toast.show({
          type: 'error',
          text1: 'خطا در سرویس chat',
          text2:
            'Something is wrong in useToolsHandler → handleActionsTools! Response from Chat API not found.',
          autoHide: false,
        });

        Logger.error(
          'Invalid API response structure – ToolResponse from Chat API not found.',
          {
            taskId,
            hasToolResponse: !!toolResponse,
            success,
            message,
          },
        );
        return;
      }

      // Log successful API response
      Logger.success('Chatbot API response received', {
        taskId,
        message,
        toolType: toolResponse.toolType,
        intent: actionPayload?.intent ?? 'none',
      });

      // Update Task metadata from the ON_DEVICE intent on the first exchange
      const messagesFilteredByTaskId = messages.filter(
        msg => msg.taskId === taskId && !msg.isTemporary,
      );
      const intent = actionPayload?.intent as string | undefined;
      if (intent && messagesFilteredByTaskId.length <= 2) {
        const badge = isTaskBadgeKey(intent)
          ? TASKS_BADGE_CATEGORY[intent as TaskBadgeKey]
          : TASKS_BADGE_CATEGORY.none;
        const { text: userText } = messagesFilteredByTaskId?.[1];

        updateTask(taskId, {
          title: userText.trim(),
          category: badge.category,
          categoryColor: badge.categoryColor,
        });
      }

      // Execute the tool action (permissions are handled inside handelActions)
      Logger.info('Executing tool action', {
        taskId,
        toolType: toolResponse.toolType,
        intent: actionPayload?.intent,
      });

      try {
        await handelActions(toolResponse, taskId);

        Logger.success('Tool action executed successfully', {
          taskId,
          toolType: toolResponse.toolType,
          intent: actionPayload?.intent,
        });
      } catch (actionError) {
        Logger.error('Tool action execution failed', {
          taskId,
          toolType: toolResponse.toolType,
          error:
            actionError instanceof Error
              ? actionError.message
              : 'Unknown error',
        });
        throw actionError;
      }
    } catch (unexpectedError) {
      Logger.error('Unexpected error in handleActionsTools', {
        taskId,
        error:
          unexpectedError instanceof Error
            ? unexpectedError.message
            : 'Unknown error',
        stack:
          unexpectedError instanceof Error ? unexpectedError.stack : undefined,
      });

      Toast.show({
        type: 'error',
        text1: 'خطای غیرمنتظره',
        text2: 'یک خطای غیرمنتظره رخ داد. لطفا دوباره تلاش کنید.',
        autoHide: false,
      });
    }
  };

  return { handleActionsTools };
};
