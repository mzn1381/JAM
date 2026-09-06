// src/screens/chat/components/OtpInput.tsx
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Text } from '../../../components';
import MaterialIcon from '../../../components/MaterialIcon';
import { useStore } from '../../../store';

interface OtpInputProps {
  length: number;
  resendLabel?: string;
  expiresInSeconds?: number;
  onComplete: (code: string) => void;
  onResend?: () => void;
  disabled?: boolean;
}

export const OtpInput = ({
  length,
  resendLabel = 'ارسال مجدد کد',
  expiresInSeconds,
  onComplete,
  onResend,
  disabled = false,
}: OtpInputProps) => {
  const theme = useStore(state => state.currentTheme);
  const isRTL = useStore(state => state.isRTL);

  const [digits, setDigits] = useState<string[]>(Array(length).fill(''));
  const [secondsLeft, setSecondsLeft] = useState(expiresInSeconds ?? 0);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  // Countdown for resend availability
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft(s => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const canResend = !expiresInSeconds || secondsLeft <= 0;

  const handleChange = useCallback(
    (value: string, index: number) => {
      // Only allow a single digit per box
      const sanitized = value.replace(/[^0-9]/g, '').slice(-1);

      const next = [...digits];
      next[index] = sanitized;
      setDigits(next);

      if (sanitized && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }

      if (next.every(d => d.length === 1)) {
        onComplete(next.join(''));
      }
    },
    [digits, length, onComplete],
  );

  const handleKeyPress = useCallback(
    (e: { nativeEvent: { key: string } }, index: number) => {
      if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
        const next = [...digits];
        next[index - 1] = '';
        setDigits(next);
      }
    },
    [digits],
  );

  const handleResend = () => {
    if (!canResend) return;
    setDigits(Array(length).fill(''));
    inputRefs.current[0]?.focus();
    setSecondsLeft(expiresInSeconds ?? 0);
    onResend?.();
  };

  const styles = StyleSheet.create({
    container: {
      // flexDirection: 'column',
      alignItems: 'center',
      gap: theme.spacing.medium,
      paddingVertical: theme.spacing.large,
      paddingHorizontal: theme.spacing.small,
      backgroundColor: theme.colors.inputColor,
      borderRadius: theme.borderRadius.medium,
      borderWidth: 1,
      borderColor: theme.colors.primary + '1A',
      width: '100%',
    },
    // OTP digits are always read left-to-right regardless of app RTL
    boxRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      justifyContent: 'center',
      gap: theme.spacing.small,
    },
    box: {
      width: 44,
      height: 56,
      borderRadius: theme.borderRadius.small ?? 8,
      borderWidth: 2,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface ?? theme.colors.background,
      textAlign: 'center',
      fontSize: 24,
      fontWeight: '700',
      color: theme.colors.primary,
      fontFamily: theme.typography.fontFamily,
    },
    boxFilled: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.background,
    },
    resendButton: {
      flexDirection: isRTL ? 'row' : 'row-reverse',
      alignItems: 'center',
      gap: 6,
    },
    resendLabel: {
      opacity: canResend ? 1 : 0.4,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.boxRow}>
        {Array.from({ length }).map((_, index) => (
          <TextInput
            key={index}
            ref={ref => {
              inputRefs.current[index] = ref;
            }}
            style={[styles.box, digits[index] ? styles.boxFilled : null]}
            value={digits[index]}
            onChangeText={value => handleChange(value, index)}
            onKeyPress={e => handleKeyPress(e, index)}
            keyboardType="number-pad"
            maxLength={1}
            editable={!disabled}
            autoFocus={index === 0}
            selectTextOnFocus
            textAlign="center"
          />
        ))}
      </View>

      <TouchableOpacity
        style={styles.resendButton}
        onPress={handleResend}
        disabled={!canResend}
      >
        <MaterialIcon
          name="history"
          size={18}
          color={canResend ? theme.colors.primary : theme.colors.textSecondary}
        />
        <Text variant="x_small" color="secondary" style={styles.resendLabel}>
          {!canResend && secondsLeft > 0
            ? `${resendLabel} (${secondsLeft})`
            : resendLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
};
