import React, { ReactNode, useEffect, useRef } from 'react';
import { LoginModal } from '../commonUI/LoginModal';
import { ReportErrorBottomSheet } from '../commonUI/ReportErrorBottomSheet';
import { Logger, useStore } from '../../store';
import { useToolsHandler } from '../../actions';
import UnlockModal from '../commonUI/UnlockModal';
import { useSetupNetworking } from '../../hooks/useNetwork';

type Props = {
  children: ReactNode;
};

export default function GlobalLogicProvider({ children }: Props) {
  const messages = useStore(state => state.messages);
  const setIsPendingChat = useStore(state => state.setIsPendingChat);
  const deleteTemporaryMessages = useStore(
    state => state.deleteTemporaryMessages,
  );
  const loginModalVisibility = useStore(state => state.loginModalVisibility);
  const setLoginModalVisibility = useStore(
    state => state.setLoginModalVisibility,
  );
  const { handleActionsTools } = useToolsHandler();
  const lastHandledUserMessageIdRef = useRef<string | null>(null);

  // Setup networking (network, logger, etc.)
  useSetupNetworking();

  useEffect(() => {
    deleteTemporaryMessages();
  }, [deleteTemporaryMessages]);

  useEffect(() => {
    const last = [...messages].reverse().find(message => !message.isTemporary);
    if (!last) {
      Logger.info('No messages to process');
      return;
    }

    const { text, isUser, taskId, id } = last;

    if (!isUser) return; // avoid infinite loop
    if (lastHandledUserMessageIdRef.current === id) return;

    lastHandledUserMessageIdRef.current = id;

    Logger.info('Processing user message', {
      messageId: id,
      taskId,
      text: text.substring(0, 50) + '...',
    });

    // Run the AI processor + intent router
    const runHandler = async () => {
      try {
        setIsPendingChat(true);

        await handleActionsTools(taskId, text, messages); // assume it returns a Promise

        Logger.network('Starting AI processing', { taskId, messageId: id });
      } catch (error) {
        Logger.error('AI processing failed', {
          taskId,
          messageId: id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      } finally {
        setIsPendingChat(false);
      }
    };

    runHandler();
  }, [messages, handleActionsTools]);

  return (
    <>
      {children}

      {/* Login */}
      <LoginModal
        visible={loginModalVisibility}
        onClose={() => {
          setLoginModalVisibility(false);
        }}
      />

      {/* Report */}
      <ReportErrorBottomSheet
        visible={false}
        onClose={() => {}}
        onReport={() => {}}
      />
      {/* Unlock */}
      <UnlockModal visible={false} onClose={() => {}} onUnlock={() => {}} />
    </>
  );
}
