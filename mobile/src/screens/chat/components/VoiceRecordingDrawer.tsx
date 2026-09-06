import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput as NativeTextInput,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { Text, View } from '../../../components';
import MaterialIcon from '../../../components/MaterialIcon';
import Spinner from '../../../components/loading/Spinner';
import TextInput from '../../../components/textInput/TextInput';
import { useStore } from '../../../store';
import VoiceVisualization from './VoiceVisualization';
import { voiceRecorder } from './voiceRecorder';
import { VoiceRecorderError } from './voiceRecorder.types';
import type { RecordedAudio, VoiceRecordingState } from '../../../types/Chat';
import { transcribeAudio } from '../../../services/APIs/transcriptions/transcriptionService';

const DEFAULT_MAX_RECORDING_DURATION = 15; // seconds
const PREVIEW_INPUT_MIN_HEIGHT = 24;
const PREVIEW_INPUT_MAX_HEIGHT = 120;
const PREVIEW_INPUT_LINE_HEIGHT = 24;
const PREVIEW_TIMER_RESERVED_HEIGHT = 36;

type WebTextArea = {
  scrollHeight: number;
  style: { height: string };
};

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds
    .toString()
    .padStart(2, '0')}`;
};

export const VoiceRecordingDrawer = (
  props: import('../../../types/Chat').VoiceRecordingDrawerProps,
) => {
  const {
    visible,
    onClose,
    onSend,
    onAudioRecorded,
    maxRecordingDuration = DEFAULT_MAX_RECORDING_DURATION,
  } = props;
  const { width } = useWindowDimensions();
  const [recordingState, setRecordingState] =
    useState<VoiceRecordingState>('idle');
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [transcription, setTranscription] = useState('');
  const [recordedAudio, setRecordedAudio] = useState<RecordedAudio | null>(
    null,
  );
  const [previewInputHeight, setPreviewInputHeight] = useState(
    PREVIEW_INPUT_MIN_HEIGHT,
  );
  const isRTL = useStore(state => state.isRTL);
  const theme = useStore(state => state.currentTheme);

  const pendingSendRef = useRef(false);
  const isSubmittingRef = useRef(false);
  const isRecorderTransitioningRef = useRef(false);
  const recordingSessionRef = useRef(0);
  const visibleRef = useRef(visible);
  const recordedAudioRef = useRef<RecordedAudio | null>(null);
  const transcriptionAbortRef = useRef<AbortController | null>(null);
  const previewInputRef = useRef<NativeTextInput>(null);
  const sheetTranslateY = useRef(new Animated.Value(32)).current;
  const sheetOpacity = useRef(new Animated.Value(0)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;
  const safeMaxDuration = Number.isFinite(maxRecordingDuration)
    ? Math.max(1, Math.floor(maxRecordingDuration))
    : DEFAULT_MAX_RECORDING_DURATION;

  const clearRecordedAudio = useCallback(() => {
    voiceRecorder.release(recordedAudioRef.current);
    recordedAudioRef.current = null;
    setRecordedAudio(null);
    onAudioRecorded?.(null);
  }, [onAudioRecorded]);

  const reset = useCallback(() => {
    pendingSendRef.current = false;
    isSubmittingRef.current = false;
    isRecorderTransitioningRef.current = false;
    transcriptionAbortRef.current?.abort();
    transcriptionAbortRef.current = null;
    setElapsedSeconds(0);
    setTranscription('');
    setRecordingError(null);
    setPreviewInputHeight(PREVIEW_INPUT_MIN_HEIGHT);
    setRecordingState('idle');
  }, []);

  const handleRecorderError = useCallback((error: unknown) => {
    pendingSendRef.current = false;
    setRecordingError(
      error instanceof VoiceRecorderError
        ? error.code === 'permission-denied'
          ? 'دسترسی به میکروفون داده نشد.'
          : error.code === 'not-supported'
          ? 'ضبط صدا در این مرورگر پشتیبانی نمی‌شود.'
          : 'ضبط صدا انجام نشد. دوباره تلاش کنید.'
        : 'ضبط صدا انجام نشد. دوباره تلاش کنید.',
    );
    setRecordingState('error');
    if (error instanceof VoiceRecorderError) return;
    console.error('Voice recording failed', error);
  }, []);

  const startRecording = useCallback(async () => {
    if (isRecorderTransitioningRef.current) return;
    const session = recordingSessionRef.current;
    isRecorderTransitioningRef.current = true;
    try {
      setRecordingError(null);
      await voiceRecorder.start();
      if (!visibleRef.current || recordingSessionRef.current !== session) {
        await voiceRecorder.cancel();
        return;
      }
      setRecordingState('recording');
    } catch (error) {
      handleRecorderError(error);
    } finally {
      isRecorderTransitioningRef.current = false;
    }
  }, [handleRecorderError]);

  const stopRecording = useCallback(
    async (nextState: VoiceRecordingState) => {
      if (isRecorderTransitioningRef.current) return;
      const session = recordingSessionRef.current;
      isRecorderTransitioningRef.current = true;
      try {
        const audio = await voiceRecorder.stop(elapsedSeconds * 1000);
        if (!visibleRef.current || recordingSessionRef.current !== session) {
          voiceRecorder.release(audio);
          return;
        }
        recordedAudioRef.current = audio;
        setRecordedAudio(audio);
        onAudioRecorded?.(audio);
        setRecordingState(nextState);
      } catch (error) {
        handleRecorderError(error);
      } finally {
        isRecorderTransitioningRef.current = false;
      }
    },
    [elapsedSeconds, handleRecorderError, onAudioRecorded],
  );

  useEffect(() => {
    visibleRef.current = visible;
    if (!visible) {
      recordingSessionRef.current += 1;
      void voiceRecorder.cancel();
      reset();
      return;
    }

    recordingSessionRef.current += 1;
    clearRecordedAudio();

    sheetTranslateY.setValue(32);
    sheetOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(sheetTranslateY, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(sheetOpacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();

    const startTimeout = setTimeout(() => void startRecording(), 150);
    return () => clearTimeout(startTimeout);
  }, [
    clearRecordedAudio,
    reset,
    sheetOpacity,
    sheetTranslateY,
    startRecording,
    visible,
  ]);

  useEffect(() => {
    if (!visible || recordingState !== 'recording') return;

    const timer = setInterval(() => {
      setElapsedSeconds(current => Math.min(current + 1, safeMaxDuration));
    }, 1000);
    return () => clearInterval(timer);
  }, [recordingState, safeMaxDuration, visible]);

  useEffect(() => {
    if (recordingState === 'recording' && elapsedSeconds >= safeMaxDuration) {
      pendingSendRef.current = false;
      void stopRecording('processing');
    }
  }, [elapsedSeconds, recordingState, safeMaxDuration, stopRecording]);

  useEffect(() => {
    if (recordingState !== 'recording') {
      pulseScale.stopAnimation();
      pulseScale.setValue(1);
      return;
    }

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseScale, {
          toValue: 1.1,
          duration: 650,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseScale, {
          toValue: 1,
          duration: 650,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseScale, recordingState]);

  const submitTranscription = useCallback(
    async (text: string) => {
      if (!text.trim() || isSubmittingRef.current) return;
      isSubmittingRef.current = true;
      setRecordingState('sending');
      try {
        await onSend(text.trim());
        onClose();
      } catch {
        isSubmittingRef.current = false;
        setRecordingState('error');
      }
    },
    [onClose, onSend],
  );

  useEffect(() => {
    if (recordingState !== 'processing') return;
    const audio = recordedAudioRef.current;
    if (!audio) return;
    const session = recordingSessionRef.current;
    const abortController = new AbortController();
    transcriptionAbortRef.current = abortController;

    void transcribeAudio(
      audio,
      (text, isFinal) => {
        if (
          abortController.signal.aborted ||
          recordingSessionRef.current !== session
        )
          return;
        setTranscription(text);
        if (isFinal && pendingSendRef.current) {
          pendingSendRef.current = false;
          void submitTranscription(text);
        }
      },
      undefined,
      abortController.signal,
    )
      .then(text => {
        if (
          abortController.signal.aborted ||
          recordingSessionRef.current !== session
        )
          return;
        setTranscription(text);
        if (pendingSendRef.current) {
          pendingSendRef.current = false;
          void submitTranscription(text);
        } else if (!isSubmittingRef.current) {
          setRecordingState('ready');
        }
      })
      .catch(error => {
        if (
          abortController.signal.aborted ||
          recordingSessionRef.current !== session
        )
          return;
        setRecordingError('تبدیل صدا به متن انجام نشد. دوباره تلاش کنید.');
        setRecordingState('error');
        console.error('Transcription failed', error);
      });

    return () => abortController.abort();
  }, [recordingState, submitTranscription]);

  const handleClose = () => {
    if (recordingState === 'sending') return;
    recordingSessionRef.current += 1;
    void voiceRecorder.cancel();
    clearRecordedAudio();
    reset();
    onClose();
  };

  const handlePauseResume = async () => {
    if (isRecorderTransitioningRef.current) return;
    isRecorderTransitioningRef.current = true;
    try {
      if (recordingState === 'recording') {
        await voiceRecorder.pause();
        setRecordingState('paused');
      } else if (recordingState === 'paused' || recordingState === 'idle') {
        if (recordingState === 'idle') {
          await voiceRecorder.start();
        } else {
          await voiceRecorder.resume();
        }
        setRecordingState('recording');
      }
    } catch (error) {
      handleRecorderError(error);
    } finally {
      isRecorderTransitioningRef.current = false;
    }
  };

  const handleSend = () => {
    if (recordingState === 'recording' || recordingState === 'paused') {
      pendingSendRef.current = true;
      void stopRecording('processing');
    } else if (recordingState === 'ready' || recordingState === 'error') {
      if (
        recordingState === 'error' &&
        recordingError &&
        recordedAudioRef.current
      ) {
        pendingSendRef.current = true;
        setRecordingError(null);
        setRecordingState('processing');
      } else if (transcription.trim()) {
        void submitTranscription(transcription);
      }
    }
  };

  useEffect(
    () => () => {
      void voiceRecorder.cancel();
      voiceRecorder.release(recordedAudioRef.current);
    },
    [],
  );

  const handlePreviewContentSizeChange = (event: {
    nativeEvent: { contentSize: { height: number } };
  }) => {
    if (Platform.OS === 'web') return;

    const nextHeight = event.nativeEvent.contentSize.height;
    setPreviewInputHeight(
      Math.min(
        Math.max(nextHeight, PREVIEW_INPUT_MIN_HEIGHT),
        PREVIEW_INPUT_MAX_HEIGHT,
      ),
    );
  };

  const handleTranscriptionChange = (text: string) => {
    setTranscription(text);

    const lineCount = text.length > 0 ? text.split('\n').length : 1;
    const estimatedHeight = Math.min(
      Math.max(lineCount * PREVIEW_INPUT_LINE_HEIGHT, PREVIEW_INPUT_MIN_HEIGHT),
      PREVIEW_INPUT_MAX_HEIGHT,
    );

    setPreviewInputHeight(previousHeight => {
      if (text.length === 0) {
        return PREVIEW_INPUT_MIN_HEIGHT;
      }
      return estimatedHeight < previousHeight
        ? estimatedHeight
        : previousHeight;
    });
  };

  useEffect(() => {
    const hasTranscriptionInput =
      recordingState === 'ready' ||
      recordingState === 'sending' ||
      recordingState === 'error';
    if (Platform.OS !== 'web' || !hasTranscriptionInput) return;

    const input = previewInputRef.current as unknown as WebTextArea | null;
    if (!input) return;

    input.style.height = 'auto';
    const nextHeight = Math.min(
      Math.max(input.scrollHeight, PREVIEW_INPUT_MIN_HEIGHT),
      PREVIEW_INPUT_MAX_HEIGHT,
    );
    input.style.height = `${nextHeight}px`;
    setPreviewInputHeight(nextHeight);
  }, [recordingState, transcription, width]);

  const statusCopy: Record<VoiceRecordingState, string> = {
    idle: 'آماده ضبط',
    recording: 'در حال گوش دادن...',
    paused: 'ضبط متوقف شده است',
    processing: 'در حال تبدیل صدا به متن...',
    ready: 'متن آماده ارسال است',
    sending: 'در حال ارسال...',
    error: 'ارسال انجام نشد. دوباره تلاش کنید.',
  };
  const statusText = recordingError ?? statusCopy[recordingState];

  const isBusy =
    recordingState === 'processing' || recordingState === 'sending';
  const canSend =
    recordingState === 'recording' ||
    recordingState === 'paused' ||
    ((recordingState === 'ready' || recordingState === 'error') &&
      recordedAudio !== null &&
      (recordingState === 'error' || transcription.trim().length > 0));
  const isPaused = recordingState === 'paused';
  const isCompact = width < 380;

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0, 0, 0, 0.42)',
    },
    dismissArea: {
      flex: 1,
    },
    sheet: {
      width: '100%',
      maxWidth: Platform.OS === 'web' ? 680 : undefined,
      alignSelf: 'center',
      borderTopLeftRadius: theme.borderRadius.medium,
      borderTopRightRadius: theme.borderRadius.medium,
      backgroundColor: theme.colors.background,
      paddingHorizontal: isCompact ? theme.spacing.large : theme.spacing.xlarge,
      paddingBottom:
        Platform.OS === 'ios' ? theme.spacing.xxlarge : theme.spacing.xlarge,
    },
    handleButton: {
      minHeight: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    handle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.colors.border,
    },
    title: {
      marginTop: theme.spacing.small,
      textAlign: 'center',
      fontSize: 18,
      lineHeight: 28,
      fontWeight: '600',
    },
    preview: {
      minHeight: 78,
      marginTop: theme.spacing.large,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.small,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: theme.spacing.large,
      paddingTop: theme.spacing.medium,
      paddingBottom: PREVIEW_TIMER_RESERVED_HEIGHT,
    },
    previewText: {
      textAlign: isRTL ? 'right' : 'left',
      writingDirection: isRTL ? 'rtl' : 'ltr',
      lineHeight: PREVIEW_INPUT_LINE_HEIGHT,
    },
    previewInput: {
      height: previewInputHeight,
      minHeight: PREVIEW_INPUT_MIN_HEIGHT,
      maxHeight: PREVIEW_INPUT_MAX_HEIGHT,
      borderWidth: 0,
      borderRadius: 0,
      backgroundColor: 'transparent',
      paddingHorizontal: 0,
      paddingVertical: 0,
      margin: 0,
      color: theme.colors.textPrimary,
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.body.fontSize,
      lineHeight: PREVIEW_INPUT_LINE_HEIGHT,
      textAlign: isRTL ? 'right' : 'left',
      writingDirection: isRTL ? 'rtl' : 'ltr',
      textAlignVertical: 'top',
    },
    status: {
      color:
        recordingState === 'error'
          ? theme.colors.error
          : theme.colors.textSecondary,
    },
    timer: {
      position: 'absolute',
      left: theme.spacing.large,
      bottom: theme.spacing.small,
      color: theme.colors.textSecondary,
      backgroundColor: theme.colors.inputColor,
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
      fontSize: 13,
      lineHeight: 20,
      fontWeight: '400',
      textAlign: 'left',
      fontVariant: ['tabular-nums'],
      letterSpacing: 0,
      paddingHorizontal: theme.spacing.small,
      paddingVertical: 2,
      borderRadius: theme.borderRadius.small,
    },
    durationLimit: {
      minHeight: 20,
      marginTop: theme.spacing.xsmall,
      textAlign: 'center',
      color: theme.colors.textSecondary,
    },
    controls: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'flex-start',
      justifyContent: 'center',
      columnGap: isCompact ? theme.spacing.xsmall : theme.spacing.small,
      marginTop: theme.spacing.xlarge,
    },
    controlGroup: {
      width: isCompact ? 64 : 72,
      alignItems: 'center',
    },
    visualizationGroup: {
      flex: 1,
      minWidth: 0,
      maxWidth: 420,
      alignItems: 'stretch',
    },
    visualizationLabelSpace: {
      minHeight: 20,
      marginTop: theme.spacing.small,
    },
    controlButton: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    deleteButton: {
      borderWidth: 1,
      borderColor: theme.colors.error,
      backgroundColor: theme.colors.background,
    },
    pauseButton: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    sendButton: {
      backgroundColor: theme.colors.primary,
    },
    disabledButton: {
      opacity: 0.45,
    },
    controlLabel: {
      minHeight: 20,
      marginTop: theme.spacing.small,
      textAlign: 'center',
      color: theme.colors.textSecondary,
    },
    pauseGlyph: {
      color: theme.colors.textPrimary,
      fontSize: 25,
      lineHeight: 30,
      fontWeight: '600',
    },
  });

  const showsTranscription =
    recordingState === 'ready' ||
    recordingState === 'sending' ||
    recordingState === 'error';
  const isPreviewEditable =
    recordingState === 'ready' || recordingState === 'error';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable
          style={styles.dismissArea}
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel="بستن ضبط صدا"
        />
        <Animated.View
          style={[
            styles.sheet,
            {
              opacity: sheetOpacity,
              transform: [{ translateY: sheetTranslateY }],
            },
          ]}
          accessibilityViewIsModal
        >
          <TouchableOpacity
            style={styles.handleButton}
            onPress={handleClose}
            disabled={recordingState === 'sending'}
            accessibilityRole="button"
            accessibilityLabel="بستن"
          >
            <View style={styles.handle} />
          </TouchableOpacity>

          <Text style={styles.title}>ضبط پیام صوتی</Text>

          <View style={styles.preview} accessibilityLiveRegion="polite">
            {showsTranscription ? (
              <TextInput
                ref={previewInputRef}
                style={[
                  styles.previewInput,
                  Platform.OS === 'web'
                    ? ({ outlineStyle: 'none' } as object)
                    : null,
                ]}
                value={transcription}
                onChangeText={handleTranscriptionChange}
                onContentSizeChange={handlePreviewContentSizeChange}
                multiline
                submitBehavior="newline"
                scrollEnabled={previewInputHeight >= PREVIEW_INPUT_MAX_HEIGHT}
                editable={isPreviewEditable}
                maxLength={4000}
                accessibilityLabel="ویرایش متن تبدیل‌شده"
                accessibilityHint="متن پیام را پیش از ارسال ویرایش کنید"
              />
            ) : (
              <Text style={[styles.previewText, styles.status]}>
                {statusText}
              </Text>
            )}
            <Animated.Text
              style={[styles.timer, { transform: [{ scale: pulseScale }] }]}
              accessibilityLabel={`زمان ضبط ${formatDuration(elapsedSeconds)}`}
            >
              {formatDuration(elapsedSeconds)}
            </Animated.Text>
          </View>
          <Text variant="x_small" style={styles.durationLimit}>
            حداکثر {formatDuration(safeMaxDuration)}
          </Text>

          <View style={styles.controls}>
            <View style={styles.controlGroup}>
              <TouchableOpacity
                style={[styles.controlButton, styles.deleteButton]}
                onPress={handleClose}
                disabled={recordingState === 'sending'}
                accessibilityRole="button"
                accessibilityLabel="حذف ضبط"
                accessibilityState={{ disabled: recordingState === 'sending' }}
              >
                <MaterialIcon
                  name="delete_forever"
                  size={24}
                  color={theme.colors.error}
                />
              </TouchableOpacity>
              <Text variant="x_small" style={styles.controlLabel}>
                حذف
              </Text>
            </View>

            <View style={styles.visualizationGroup}>
              <VoiceVisualization
                active={recordingState === 'recording'}
                color={theme.colors.primary}
                backgroundColor={theme.colors.inputColor}
              />
              <View style={styles.visualizationLabelSpace} />
            </View>

            <View style={styles.controlGroup}>
              <TouchableOpacity
                style={[
                  styles.controlButton,
                  styles.pauseButton,
                  isBusy && styles.disabledButton,
                ]}
                onPress={handlePauseResume}
                disabled={
                  isBusy ||
                  recordingState === 'ready' ||
                  recordingState === 'error'
                }
                accessibilityRole="button"
                accessibilityLabel={isPaused ? 'ادامه ضبط' : 'توقف ضبط'}
                accessibilityState={{ disabled: isBusy, selected: isPaused }}
              >
                <Text style={styles.pauseGlyph}>{isPaused ? '▶' : 'Ⅱ'}</Text>
              </TouchableOpacity>
              <Text variant="x_small" style={styles.controlLabel}>
                {isPaused ? 'ادامه' : 'توقف'}
              </Text>
            </View>

            <View style={styles.controlGroup}>
              <TouchableOpacity
                style={[
                  styles.controlButton,
                  styles.sendButton,
                  !canSend && styles.disabledButton,
                ]}
                onPress={handleSend}
                disabled={!canSend}
                accessibilityRole="button"
                accessibilityLabel={
                  recordingState === 'error' ? 'تلاش دوباره' : 'ارسال پیام'
                }
                accessibilityState={{ disabled: !canSend, busy: isBusy }}
              >
                {isBusy ? (
                  <Spinner size={30} />
                ) : (
                  <MaterialIcon
                    name="send"
                    size={25}
                    color={theme.colors.onPrimary}
                  />
                )}
              </TouchableOpacity>
              <Text variant="x_small" style={styles.controlLabel}>
                {recordingState === 'error' ? 'تلاش دوباره' : 'ارسال'}
              </Text>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default VoiceRecordingDrawer;
