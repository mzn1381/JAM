// src/screens/chat/components/BottomInputBar.tsx
import React, { useRef, useState, useEffect } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  Animated,
} from 'react-native';
import { View, Text } from '../../../components';
import MaterialIcon from '../../../components/MaterialIcon';
import Spinner from '../../../components/loading/Spinner';
import { Theme } from '../../../theme';
import VoiceRecordingDrawer from './VoiceRecordingDrawer';
import { useStore } from '../../../store';

type WebKeyPressEvent = {
  key: string;
  shiftKey?: boolean;
  preventDefault?: () => void;
};

export interface BottomInputBarProps {
  /** Current text value */
  value: string;
  /** Callback when text changes */
  onChangeText: (text: string) => void;
  /** Callback when send button is pressed */
  onSend: () => void;
  /** Callback when voice button is pressed (optional) */
  onVoicePress?: () => void;
  /** Submit the voice transcription */
  onVoiceSend?: (transcription: string) => void | Promise<void>;
  /** Maximum voice recording duration in seconds (default: 120) */
  maxRecordingDuration?: number;
  /** Whether the input is in loading/processing state */
  isLoading?: boolean;
  /** Whether the input is in cancel/dismiss mode */
  isCancelMode?: boolean;
  /** Callback when cancel button is pressed */
  onCancel?: () => void;
  /** Placeholder text */
  placeholder?: string;
  /** Loading placeholder text */
  loadingPlaceholder?: string;
  /** Cancel button label */
  cancelLabel?: string;
  /** Maximum height for the input (default: 150) */
  maxHeight?: number;
  /** Minimum height for the input (default: 48) */
  minHeight?: number;
  /** Whether to show the voice button */
  showVoiceButton?: boolean;
  /** Auto-focus the input on mount */
  autoFocus?: boolean;
  /** Disable input and send button */
  disabled?: boolean;
}

/**
 * BottomInputBar - A reusable input bar component for chat interfaces
 *
 * Features:
 * - Multi-line text input with automatic height adjustment
 * - Send button with smooth animations
 * - Loading state with spinner
 * - Optional voice input button
 * - Cancel mode for tool interactions
 * - Full keyboard support (Enter to send on web)
 * - RTL support
 * - Accessibility labels and hints
 * - Theme and platform-aware styling
 *
 * @example
 * ```tsx
 * <BottomInputBar
 *   value={inputText}
 *   onChangeText={setInputText}
 *   onSend={handleSend}
 *   onVoiceSend={handleVoiceSend}
 *   isLoading={isPending}
 *   theme={theme}
 *   isRTL={true}
 * />
 * ```
 */

export const BottomInputBar: React.FC<BottomInputBarProps> = ({
  value,
  onChangeText,
  onSend,
  onVoicePress,
  onVoiceSend,
  maxRecordingDuration,
  isCancelMode = false,
  onCancel,
  placeholder = '...پیام خود را بنویسید',
  loadingPlaceholder = '...لطفا صبر کنید',
  cancelLabel = 'لغو',
  maxHeight = 150,
  minHeight = 48,
  showVoiceButton = true,
  autoFocus = false,
  disabled = false,
}) => {
  // Internal vertical padding of the input pill. Kept small so multi-line
  // input keeps most of its space for content. Slightly platform-tuned to
  // account for the different default text metrics of the underlying widgets.
  const INPUT_VERTICAL_PADDING = Platform.select({
    ios: 8,
    android: 6,
    web: 6,
    default: 8,
  }) as number;
  // Height available to the text once the pill's vertical padding is removed.
  const singleLineHeight = minHeight - INPUT_VERTICAL_PADDING * 2;

  const inputRef = useRef<TextInput>(null);
  const [inputHeight, setInputHeight] = useState(singleLineHeight);
  const [isVoiceDrawerVisible, setIsVoiceDrawerVisible] = useState(false);
  const sendButtonScale = useRef(new Animated.Value(1)).current;
  const voiceButtonScale = useRef(new Animated.Value(1)).current;
  const isRTL = useStore(state => state.isRTL);
  const theme = useStore(state => state.currentTheme);
  const isPendingChat = useStore(state => state.isPendingChat);

  const hasText = value.trim().length > 0;
  const canSend = hasText && !isPendingChat && !disabled;
  const textLineHeight = theme.typography.small.lineHeight;
  const maxContentHeight = maxHeight - INPUT_VERTICAL_PADDING * 2;
  // Overall height of the pill: content height plus vertical padding, clamped.
  const wrapperHeight = Math.min(
    Math.max(inputHeight + INPUT_VERTICAL_PADDING * 2, minHeight),
    maxHeight,
  );
  const isAtMaxHeight = wrapperHeight >= maxHeight;

  // Focus management
  useEffect(() => {
    if (autoFocus && !isCancelMode && !isPendingChat) {
      const timeout = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timeout);
    }
  }, [autoFocus, isCancelMode, isPendingChat]);

  // Handle keyboard Enter key on web
  const handleKeyPress = (e: any) => {
    if (Platform.OS === 'web') {
      const nativeEvent = e.nativeEvent as WebKeyPressEvent;
      if (nativeEvent.key === 'Enter' && !nativeEvent.shiftKey) {
        nativeEvent.preventDefault?.();
        if (canSend) {
          onSend();
        }
      }
    }
  };

  // Handle input height changes. We track the raw content height (a single line
  // upward) and let the pill grow around it, so the first line always starts at
  // the same vertical offset as the placeholder.
  const handleContentSizeChange = (e: any) => {
    const height = e.nativeEvent.contentSize.height;
    setInputHeight(
      Math.min(Math.max(height, singleLineHeight), maxContentHeight),
    );
  };

  // Fallback for cases where contentSize misses shrink updates (notably web).
  const handleTextChange = (text: string) => {
    onChangeText(text);

    const lineCount = text.length > 0 ? text.split('\n').length : 1;
    const estimatedHeight = Math.min(
      Math.max(lineCount * textLineHeight, singleLineHeight),
      maxContentHeight,
    );

    setInputHeight(prevHeight => {
      if (text.length === 0) {
        return singleLineHeight;
      }
      return estimatedHeight < prevHeight ? estimatedHeight : prevHeight;
    });
  };

  // Animate send button on press
  const handleSendPress = () => {
    if (!canSend) return;

    Animated.sequence([
      Animated.timing(sendButtonScale, {
        toValue: 0.85,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(sendButtonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onSend();
  };

  // Animate voice button on press
  const handleVoicePress = () => {
    if (!onVoiceSend || isPendingChat || disabled) return;

    Animated.sequence([
      Animated.timing(voiceButtonScale, {
        toValue: 0.85,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(voiceButtonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onVoicePress?.();
    setIsVoiceDrawerVisible(true);
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'flex-end',
      gap: theme.spacing.medium,
      paddingHorizontal: theme.spacing.large,
      paddingVertical: theme.spacing.medium,
      backgroundColor: theme.colors.background,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingBottom: Platform.select({
        ios: theme.spacing.medium,
        android: theme.spacing.medium,
        default: theme.spacing.small,
      }),
    },
    inputWrapper: {
      flex: 1,
      minHeight: minHeight,
      maxHeight: maxHeight,
      borderRadius: 24,
      backgroundColor: theme.colors.inputColor,
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.large,
      paddingVertical: INPUT_VERTICAL_PADDING,
      opacity: disabled ? 0.6 : 1,
    },
    input: {
      flex: 1,
      height: inputHeight,
      ...theme.typography.small,
      color: theme.colors.textPrimary,
      fontFamily: theme.typography.fontFamily,
      textAlign: isRTL ? 'right' : 'left',
      paddingHorizontal: 0,
      paddingVertical: 0,
      margin: 0,
      paddingTop: Platform.OS === 'web' ? 8 : 0,
      // Center a single line; longer content simply fills the exact height so
      // the top edge stays put. Web ignores this and relies on the padding above.
      textAlignVertical: 'center',
      borderColor: 'transparent',
    },
    actionButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      paddingTop: 5,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendButton: {
      backgroundColor: theme.colors.primary,
      opacity: canSend ? 1 : 0.5,
    },
    voiceButton: {
      backgroundColor: theme.colors.inputColor,
    },
    loadingContainer: {
      width: 48,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelButton: {
      flex: 1,
      height: minHeight,
      borderRadius: 12,
      backgroundColor: theme.colors.primary ?? '#E24A4A',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: minHeight,
    },
    cancelButtonLabel: {
      color: theme.colors.onPrimary,
      fontFamily: theme.typography.fontFamily,
      fontSize: 15,
      fontWeight: '600',
    },
  });

  // Render cancel mode
  if (isCancelMode) {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={[styles.cancelButton, { height: wrapperHeight }]}
          onPress={onCancel}
          accessibilityLabel={cancelLabel}
          accessibilityRole="button"
        >
          <Text style={styles.cancelButtonLabel}>{cancelLabel}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Render normal mode
  return (
    <>
      <View style={styles.container}>
        {/* Voice Input Button (optional) */}
        {showVoiceButton && Boolean(onVoiceSend) && !hasText && (
          <Animated.View style={{ transform: [{ scale: voiceButtonScale }] }}>
            <TouchableOpacity
              style={[styles.actionButton, styles.voiceButton]}
              onPress={handleVoicePress}
              disabled={isPendingChat || disabled}
              accessibilityLabel="ضبط صدا"
              accessibilityRole="button"
              accessibilityHint="برای ارسال پیام صوتی، این دکمه را فشار دهید"
            >
              <MaterialIcon
                name="mic"
                size={24}
                color={
                  isPendingChat || disabled
                    ? theme.colors.textSecondary
                    : theme.colors.primary
                }
              />
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Input Field */}
        <View style={[styles.inputWrapper, { height: wrapperHeight }]}>
          <TextInput
            ref={inputRef}
            style={[
              styles.input,
              // Web-only: strip the focus outline (not part of RN's TextStyle).
              Platform.OS === 'web'
                ? ({ outlineStyle: 'none' } as object)
                : null,
            ]}
            placeholder={isPendingChat ? loadingPlaceholder : placeholder}
            placeholderTextColor={theme.colors.textSecondary}
            value={value}
            onChangeText={handleTextChange}
            onKeyPress={handleKeyPress}
            onContentSizeChange={handleContentSizeChange}
            multiline={true}
            scrollEnabled={isAtMaxHeight}
            editable={!isPendingChat && !disabled}
            maxLength={4000}
            accessibilityLabel="ورودی پیام"
            accessibilityRole="none"
            accessibilityHint="پیام خود را تایپ کنید"
          />
        </View>

        {/* Send Button / Loading Spinner */}
        {isPendingChat ? (
          <View style={styles.loadingContainer}>
            <Spinner size={32} />
          </View>
        ) : (
          <Animated.View style={{ transform: [{ scale: sendButtonScale }] }}>
            <TouchableOpacity
              style={[styles.actionButton, styles.sendButton]}
              onPress={handleSendPress}
              disabled={!canSend || isPendingChat}
              accessibilityLabel="ارسال پیام"
              accessibilityRole="button"
              accessibilityState={{ disabled: !canSend }}
              accessibilityHint={
                canSend
                  ? 'برای ارسال پیام، این دکمه را فشار دهید'
                  : 'ابتدا پیامی بنویسید'
              }
            >
              <MaterialIcon
                name="send"
                size={24}
                color={theme.colors.onPrimary}
              />
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
      {onVoiceSend && (
        <VoiceRecordingDrawer
          visible={isVoiceDrawerVisible}
          onClose={() => setIsVoiceDrawerVisible(false)}
          onSend={onVoiceSend}
          maxRecordingDuration={maxRecordingDuration}
        />
      )}
    </>
  );
};

export default BottomInputBar;
