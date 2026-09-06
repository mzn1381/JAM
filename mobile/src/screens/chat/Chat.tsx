import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { View, Text } from '../../components';
import { useStore, useTaskById } from '../../store';
import { CardViewPayload, Message, MessageType } from '../../types/Chat';
import { PROCESSING_MESSAGES, SHOW_VOICE_BUTTON } from '../../utils/constants';
import { randomText } from '../../utils/handlers';
import Toast from 'react-native-toast-message';
import { typography } from '../../theme';
import { ChatMessage } from './components/renderChatMessage';
import BottomInputBar from './components/BottomInputBar';
// import {
//   confirmMessageSample,
//   confirmMessageSample2,
//   listOptionMessageSample,
//   otpMessageSample,
//   listOptionMessageSampleSelected,
//   textMessageSample,
//   cardViewMessageSample,
// } from './components/messageTypeTest';

interface ChatScreenProps {
  route: {
    params: {
      taskId: string;
      initialPrompt?: string;
    };
  };
}

// Tool types that hijack the Bottom Input Bar while awaiting user interaction.
const INTERACTIVE_TOOL_TYPES: MessageType[] = [
  'OTP',
  // 'LIST_OPTION', //In list options does not hijack the input bar, so we can keep it enabled for user to type message
  'CONFIRMATION',
];

export default function Chat({ route }: ChatScreenProps) {
  const theme = useStore(state => state.currentTheme);
  const isRTL = useStore(state => state.isRTL);
  // const [avatarSelectorModal, SetAvatarSelectorModal] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const pendingAssistantMessageIdRef = useRef<string | null>(null);
  const initialPromptSentRef = useRef(false);
  const { taskId, initialPrompt } = route.params;

  const [inputText, setInputText] = useState('');
  const messages = useStore(state => state.messages);

  const task = useTaskById(taskId);

  const addMessage = useStore(state => state.addMessage);
  const updateMessage = useStore(state => state.updateMessage);
  const deleteMessage = useStore(state => state.deleteMessage);
  const isPendingChat = useStore(state => state.isPendingChat);
  const setIsPendingChat = useStore(state => state.setIsPendingChat);
  const netInfo = useStore(state => state.netInfo);

  // Cleanup effect for temporary "processing" assistant messages.
  // Purpose: remove a temporary "processing" bubble when a real assistant
  // response arrives, or when processing finished without producing a
  // response. This guards against stale/aborted flows while avoiding a
  // race where the temporary bubble could be removed immediately after
  // being added (the processing flag is toggled elsewhere).
  useEffect(() => {
    const pendingAssistantMessageId = pendingAssistantMessageIdRef.current;
    if (!pendingAssistantMessageId) return;

    const taskMessages = messages.filter(message => message.taskId === taskId);
    const pendingIndex = taskMessages.findIndex(
      message => message.id === pendingAssistantMessageId,
    );

    if (pendingIndex === -1) {
      pendingAssistantMessageIdRef.current = null;
      return;
    }

    const hasRealAssistantResponse = taskMessages
      .slice(pendingIndex + 1)
      .some(message => !message.isUser && !message.isTemporary);

    if (!hasRealAssistantResponse) {
      // If the request finished but no real assistant response arrived,
      // this pending temporary bubble is stale (failed/aborted flow).
      if (!isPendingChat) {
        deleteMessage(pendingAssistantMessageId);
        pendingAssistantMessageIdRef.current = null;
      }
      return;
    }

    deleteMessage(pendingAssistantMessageId);
    pendingAssistantMessageIdRef.current = null;
  }, [deleteMessage, isPendingChat, messages, taskId]);

  // --- Single source of truth for "tool interaction mode" -----------------
  // The active interactive message is the most recent, still-pending,
  // non-temporary assistant message whose toolType requires a dedicated
  // widget (OTP / LIST_OPTION / CONFIRMATION) instead of free text input.
  const activeInteractiveMessage = useMemo(() => {
    const taskMessages = messages.filter(message => message.taskId === taskId);
    for (let i = taskMessages.length - 1; i >= 0; i -= 1) {
      const message = taskMessages[i];
      if (message.isUser || message.isTemporary) continue;
      if (
        message.toolType &&
        INTERACTIVE_TOOL_TYPES.includes(message.toolType) &&
        message.status === 'pending'
      ) {
        return message;
      }
      // Stop scanning once we hit an older, already-resolved assistant
      // message — anything before it is no longer "current".
      if (
        message.toolType &&
        INTERACTIVE_TOOL_TYPES.includes(message.toolType) &&
        message.status !== 'pending'
      ) {
        break;
      }
    }
    return null;
  }, [messages, taskId]);

  const activeToolType: MessageType | null =
    activeInteractiveMessage?.toolType ?? null;
  const isToolInteractionMode = activeToolType !== null;

  // Track when tool interaction mode ends to trigger autofocus
  const wasInToolInteractionModeRef = useRef(isToolInteractionMode);
  useEffect(() => {
    wasInToolInteractionModeRef.current = isToolInteractionMode;
  }, [isToolInteractionMode]);

  const createTemporaryAssistantMessage = (messageId: string): Message => ({
    id: `${messageId}-temp`,
    taskId,
    text: randomText(PROCESSING_MESSAGES),
    isUser: false,
    toolType: 'TEXT',
    status: 'pending',
    isTemporary: true,
    timestamp: new Date().toISOString(),
  });

  const handleSend = ({
    text,
    id,
    toolType,
    selectedOptionId,
  }: {
    text: string;
    id?: string;
    toolType?: MessageType;
    selectedOptionId?: string;
  }) => {
    if (!netInfo?.isConnected) {
      Toast.show({
        type: 'info',
        text2: 'برای استفاده از پیشکار نیاز به اینترنت دارید.',
        text2Style: { fontFamily: typography.fontFamily, fontSize: 10 },
      });
      return;
    }

    if (text.trim()) {
      const userMessageId = Date.now().toString();
      const newMessage: Message = {
        id: userMessageId,
        taskId: taskId,
        text: text.trim(),
        isUser: true,
        timestamp: new Date().toISOString(),
        toolType: 'TEXT',
      };

      addMessage(taskId, newMessage);
      // Mark chat as pending immediately so the temporary "processing" bubble
      // isn't removed by the cleanup useEffect due to a timing race.
      setIsPendingChat(true);
      const temporaryMessage = createTemporaryAssistantMessage(userMessageId);
      pendingAssistantMessageIdRef.current = temporaryMessage.id;
      addMessage(taskId, temporaryMessage);
      setInputText('');

      // Mark the source assistant message as completed and update its state
      if (id) {
        if (toolType === 'LIST_OPTION' && selectedOptionId) {
          const original = messages.find(m => m.id === id);
          if (original?.listOptionsPayload) {
            updateMessage(id, {
              status: 'completed',
              selectedMessage: text.trim(),
              listOptionsPayload: {
                ...original.listOptionsPayload,
                defaultOptionId: selectedOptionId,
              },
            });
          }
        } else if (
          toolType === 'OTP' ||
          toolType === 'CONFIRMATION' ||
          toolType === 'LIST_OPTION'
        ) {
          updateMessage(id, {
            status: 'completed',
            selectedMessage: text.trim(),
          });
        } else {
          updateMessage(id, { status: 'completed' });
        }
      }
    }
  };

  // Cancels the currently active tool interaction (OTP / LIST_OPTION / CONFIRMATION)
  // without sending a user message, and restores the normal input bar.
  const handleCancelToolInteraction = () => {
    if (!activeInteractiveMessage) return;

    updateMessage(activeInteractiveMessage.id, {
      status: 'completed',
    });

    // If a temporary "processing" message was tied to this interaction,
    // make sure it doesn't linger.
    if (pendingAssistantMessageIdRef.current) {
      const stillExists = messages.some(
        m => m.id === pendingAssistantMessageIdRef.current,
      );
      if (stillExists) {
        deleteMessage(pendingAssistantMessageIdRef.current);
      }
      pendingAssistantMessageIdRef.current = null;
    }
  };

  // Auto-send initial prompt from Quick Actions
  useEffect(() => {
    if (initialPrompt && !initialPromptSentRef.current) {
      initialPromptSentRef.current = true;
      // Small delay to ensure the chat UI is ready
      const timeout = setTimeout(() => {
        handleSend({ text: initialPrompt, toolType: 'TEXT' });
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [initialPrompt]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    chatBody: {
      flex: 1,
      paddingHorizontal: theme.spacing.large,
      paddingVertical: theme.spacing.large,
    },
  });

  if (!task) {
    return <Text>Task not found</Text>;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Chat Body */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.chatBody}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        onContentSizeChange={() =>
          scrollViewRef.current?.scrollToEnd({ animated: true })
        }
      >
        {messages
          .filter(msg => msg.taskId === taskId)
          .map(msg => (
            <ChatMessage
              key={msg.id}
              message={msg}
              onConfirm={(id, option) => {
                handleSend({
                  text: `${option.label}`,
                  id,
                  toolType: 'CONFIRMATION',
                });
              }}
              onSelectOption={(id, option) => {
                // This code for select a doctor for show profile. (solution for avoiding unnecessary LLM call)
                // ###Paziresh24###DoctorProfile###دکتر-مسعود-دهقانی-گیشی-0###textMessage
                handleSend({
                  text: `###Paziresh24###DoctorProfile###${option.id}###${option.title} - ${option.subtitle}`,
                  id,
                  toolType: 'LIST_OPTION',
                  selectedOptionId: option.id,
                });
              }}
              onCardAction={(id, payload: CardViewPayload) => {
                handleSend({
                  text:
                    payload.actionValue ??
                    `رزرو نوبت آنلاین برای ${payload.title}`,
                  id,
                  toolType: 'CARD_VIEW',
                });
              }}
              onOtpComplete={(id, code) => {
                handleSend({
                  text: `${code}`,
                  id,
                  toolType: 'OTP',
                });
              }}
            />
          ))}
      </ScrollView>

      {/* Bottom Input Bar */}
      <BottomInputBar
        value={inputText}
        onChangeText={setInputText}
        onSend={() => handleSend({ text: inputText, toolType: 'TEXT' })}
        onVoiceSend={transcription =>
          handleSend({ text: transcription, toolType: 'TEXT' })
        }
        isCancelMode={isToolInteractionMode}
        onCancel={handleCancelToolInteraction}
        autoFocus={
          wasInToolInteractionModeRef.current && !isToolInteractionMode
        }
        showVoiceButton={SHOW_VOICE_BUTTON ?? false}
      />
      {/* <TouchableOpacity
        style={styles.button}
        onPress={() => {
          // addMessage(taskId, listOptionMessageSampleSelected);
          // addMessage(taskId, confirmMessageSample);
          // addMessage(taskId, confirmMessageSample2);
          // addMessage(taskId, listOptionMessageSample);
          // addMessage(taskId, cardViewMessageSample);
          // addMessage(taskId, textMessageSample);
        }}
      >
        <Text style={styles.label}>Try</Text>
      </TouchableOpacity> */}
    </KeyboardAvoidingView>
  );
}
