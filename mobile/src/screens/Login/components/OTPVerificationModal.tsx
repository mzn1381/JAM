// src/components/OTPVerificationModal.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  View as RNView,
  Dimensions,
} from 'react-native';
import { View, Text, Button } from '../../../components';
import { useStore } from '../../../store';
import MaterialIcon from '../../../components/MaterialIcon';

interface OTPVerificationModalProps {
  visible: boolean;
  phoneNumber: string;
  onClose: () => void;
  onVerify: (otp: string) => void;
  onResend?: () => void;
}

const { height } = Dimensions.get('window');

export default function OTPVerificationModal({
  visible,
  phoneNumber,
  onClose,
  onVerify,
  onResend,
}: OTPVerificationModalProps) {
  const theme = useStore(state => state.currentTheme);
  const isRTL = useStore(state => state.isRTL);

  const [otp, setOtp] = useState(['', '', '', '', '']);
  const [timer, setTimer] = useState(59);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setOtp(['', '', '', '', '']);
      setTimer(59);
      setCanResend(false);
      // Auto-focus first input after modal animation
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 300);
    }
  }, [visible]);

  // Timer countdown
  useEffect(() => {
    if (visible && timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else if (timer === 0) {
      setCanResend(true);
    }
  }, [visible, timer]);

  const handleOtpChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    // Handle backspace
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = () => {
    if (canResend) {
      setTimer(59);
      setCanResend(false);
      setOtp(['', '', '', '', '']);
      inputRefs.current[0]?.focus();
      onResend?.();
    }
  };

  const handleVerify = () => {
    const otpCode = otp.join('');
    if (otpCode.length === 6) {
      onVerify(otpCode);
    }
  };

  const isOtpComplete = otp.every(digit => digit !== '');

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingTop: theme.spacing.xxlarge,
    },
    modalContainer: {
      flex: 1,
      width: '100%',
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.medium,
      paddingVertical: theme.spacing.small,
      // borderBottomWidth: 1,
      // borderBottomColor: theme.colors.border,
    },
    headerTitle: {
      textAlign: 'center',
    },
    backButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 20,
    },
    spacer: {
      width: 40,
    },
    content: {
      paddingHorizontal: theme.spacing.xlarge,
      paddingTop: theme.spacing.xlarge,
      paddingBottom: theme.spacing.xxxlarge,
      alignItems: 'center',
    },
    titleSection: {
      width: '100%',
      marginBottom: theme.spacing.xxxlarge,
      alignItems: 'center',
    },
    title: {
      marginBottom: theme.spacing.medium,
      textAlign: 'center',
    },
    subtitle: {
      textAlign: 'center',
      lineHeight: 22,
    },
    phoneNumber: {
      fontFamily: 'monospace',
      paddingHorizontal: theme.spacing.xsmall,
    },
    otpContainer: {
      flexDirection: 'row-reverse',
      gap: theme.spacing.small,
      marginBottom: theme.spacing.xxxlarge,
      justifyContent: 'center',
      width: '100%',
    },
    otpInput: {
      width: 48,
      height: 60,
      textAlign: 'center',
      fontSize: 24,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      backgroundColor: theme.colors.surface,
      borderWidth: 2,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.medium,
      fontFamily: theme.typography.fontFamily,
    },
    otpInputFocused: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.inputColor,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.15,
      shadowRadius: 15,
      elevation: 4,
    },
    resendSection: {
      alignItems: 'center',
      gap: theme.spacing.large,
      marginBottom: theme.spacing.xlarge,
    },
    timerRow: {
      flexDirection: isRTL ? 'row' : 'row-reverse',
      alignItems: 'center',
      gap: theme.spacing.small,
    },
    timerBadge: {
      backgroundColor: `${theme.colors.primary}10`,
      paddingHorizontal: theme.spacing.small,
      paddingVertical: 2,
      borderRadius: theme.borderRadius.small,
    },
    timerText: {
      color: theme.colors.primary,
      fontFamily: 'monospace',
      letterSpacing: 2,
      fontWeight: '700',
    },
    resendButton: {
      paddingVertical: theme.spacing.small,
    },
    resendButtonDisabled: {
      opacity: 0.5,
    },
    verifyButton: {
      height: 56,
      width: '100%',
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: theme.elevation.large,
    },
    verifyButtonDisabled: {
      opacity: 0.5,
    },
    backgroundGradient1: {
      position: 'absolute',
      top: -50,
      left: isRTL ? undefined : -100,
      right: isRTL ? -100 : undefined,
      width: 300,
      height: 300,
      borderRadius: 150,
      backgroundColor: `${theme.colors.primary}08`,
      opacity: 0.5,
    },
    backgroundGradient2: {
      position: 'absolute',
      bottom: -80,
      right: isRTL ? undefined : -80,
      left: isRTL ? -80 : undefined,
      width: 250,
      height: 250,
      borderRadius: 125,
      backgroundColor: `${theme.colors.primary}08`,
      opacity: 0.3,
    },
  });

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Background Gradients */}
          <RNView style={styles.backgroundGradient1} />
          <RNView style={styles.backgroundGradient2} />

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={onClose}>
              <MaterialIcon
                name="close"
                size={15}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
            {/* <Text variant="body" style={styles.headerTitle}>
              تایید کد
            </Text> */}
            {/* <RNView style={styles.spacer} /> */}
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Title Section */}
            <View style={styles.titleSection}>
              <Text variant="h2" style={styles.title}>
                کد تایید را وارد کنید
              </Text>
              <Text variant="small" color="secondary" style={styles.subtitle}>
                کد ۵ رقمی به شماره{' 09162624074 '}
                <Text style={styles.phoneNumber}>{phoneNumber}</Text> ارسال شد
              </Text>
            </View>

            {/* OTP Input */}
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={ref => {
                    inputRefs.current[index] = ref;
                  }}
                  style={[styles.otpInput, digit && styles.otpInputFocused]}
                  value={digit}
                  onChangeText={value => handleOtpChange(index, value)}
                  onKeyPress={({ nativeEvent: { key } }) =>
                    handleKeyPress(index, key)
                  }
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                />
              ))}
            </View>

            {/* Resend Section */}
            <View style={styles.resendSection}>
              <View style={styles.timerRow}>
                <Text variant="small" color="secondary">
                  ارسال مجدد کد تا
                </Text>
                <View style={styles.timerBadge}>
                  <Text variant="small" style={styles.timerText}>
                    {formatTimer(timer)}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.resendButton,
                  !canResend && styles.resendButtonDisabled,
                ]}
                onPress={handleResend}
                disabled={!canResend}
              >
                <Text
                  variant="small"
                  color="secondary"
                  style={{
                    color: canResend
                      ? theme.colors.primary
                      : theme.colors.textSecondary,
                  }}
                >
                  دریافت مجدد کد از طریق پیامک
                </Text>
              </TouchableOpacity>
            </View>

            {/* Verify Button */}
            <Button
              title="تایید و ادامه"
              variant="primary"
              size="medium"
              onPress={handleVerify}
              disabled={!isOtpComplete}
              style={[
                styles.verifyButton,
                !isOtpComplete && styles.verifyButtonDisabled,
              ]}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
