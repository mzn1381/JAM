// src/components/LoginModal.tsx
import React, { useState, useRef, useEffect, useContext } from 'react';
import {
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
} from 'react-native';
import { View, Text, Button } from '../../components/index';
import { useStore } from '../../store';
import { useRegisterOtp } from '../../services/APIs/auth/useRegistryOTP';
import { useVerifyRegisterOtp } from '../../services/APIs/auth/useVerifyRegisterOtp';
import { AuthContext } from '../providers/AuthProvider';
import Toast from 'react-native-toast-message';
import { typography } from '../../theme';
import MaterialIcon from '../../components/MaterialIcon';
import { navigateWithRef } from '../../navigation/navigationRef';

interface LoginModalProps {
  visible: boolean;
  onClose: () => void;
}
const SSO_TIMER = 60;
export const LoginModal: React.FC<LoginModalProps> = ({ visible, onClose }) => {
  const { checkAuth } = useContext(AuthContext);

  const theme = useStore(state => state.currentTheme);
  const isRTL = useStore(state => state.isRTL);
  const isSelectedPreferences = useStore(state => state.isSelectedPreferences);

  // const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '']);
  const [timer, setTimer] = useState(SSO_TIMER);
  const [canResend, setCanResend] = useState(false);
  const [wrongOTP, setWrongOTP] = useState(false);

  const otpRefs = useRef<Array<TextInput | null>>([]);

  const { mutate: sendOtp, isPending } = useRegisterOtp();

  const { mutate: loginWithOTPCode, isPending: isRegisteryPending } =
    useVerifyRegisterOtp();

  useEffect(() => {
    if (showOTP) {
      // auto-focus when screen mounts
      Keyboard.dismiss(); // reset
      setTimeout(() => {
        otpRefs.current[0]?.focus(); // open keyboard automatically
      }, 300);
    }
  }, [showOTP]);

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

  useEffect(() => {
    setShowOTP(false);
    setOtp(['', '', '', '', '']);
    setMobile('');
    // setName('');
    setTimer(SSO_TIMER);
  }, [visible]);

  const handleSendCode = () => {
    if (mobile.length >= 10) {
      sendOtp(
        {
          phoneNumber: mobile,
          // firstName: name,
          // lastName: 'Doe',
        },
        {
          onSuccess: () => {
            setShowOTP(true);
            setTimer(SSO_TIMER);
          },
        },
      );
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      if (value && index < 4) {
        otpRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleLogin = () => {
    const otpCode = otp.join('');
    if (otpCode.length === 5) {
      loginWithOTPCode(
        { code: otpCode, phoneNumber: mobile },
        {
          onSuccess: async res => {
            if (res && res.data) {
              await checkAuth(); // fetch the identity-user-info from contex

              setWrongOTP(false);

              Toast.show({
                type: 'success',
                text2: `شما وارد حساب کاربری ${
                  res?.data?.user?.username || 'خود'
                } شدید (:`,
                text2Style: {
                  fontFamily: typography.fontFamily,
                  fontSize: 14,
                },
                visibilityTime: 3000,
              });

              if (!isSelectedPreferences) {
                navigateWithRef('PreferencesSelection');
              }
              onClose(); // close OTP modal
            } else if (res.errorCode === 4) {
              setOtp(['', '', '', '', '']);
              setWrongOTP(true);
            }
          },
        },
      );
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };
  const handleResend = () => {
    if (canResend) {
      setTimer(59);
      setCanResend(false);
      setOtp(['', '', '', '', '']);
      otpRefs.current[0]?.focus();
      handleSendCode();
    }
  };

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(15, 35, 34, 0.8)',
      justifyContent: 'flex-end',
      padding: theme.spacing.large,
    },
    modalContent: {
      borderRadius: theme.borderRadius.medium,
      borderWidth: 1,
      borderColor: `${theme.colors.primary}33`,
      overflow: 'hidden',
      maxHeight: '85%',
      marginBottom: theme.spacing.xxlarge,
    },
    header: {
      padding: theme.spacing.xlarge,
      alignItems: 'center',
    },
    title: {
      textAlign: 'center',
    },
    subtitle: {
      textAlign: 'center',
      marginTop: theme.spacing.small,
    },
    form: {
      padding: theme.spacing.xlarge,
      gap: theme.spacing.xlarge,
    },
    inputContainer: {
      gap: theme.spacing.small,
    },
    label: {
      textAlign: isRTL ? 'left' : 'right',
    },
    input: {
      height: 56,
      borderRadius: theme.borderRadius.medium,
      borderWidth: 1,
      borderColor: `${theme.colors.primary}55`,
      backgroundColor: theme.colors.inputColor,
      paddingHorizontal: theme.spacing.large,
      color: theme.colors.textSecondary,
      fontSize: 14,
      fontFamily: theme.typography.fontFamily,
      textAlign: isRTL ? 'right' : 'left',
    },
    inputFocused: {
      borderColor: theme.colors.primary,
      borderWidth: 2,
    },
    buttonContainer: {
      padding: theme.spacing.xlarge,
      paddingTop: theme.spacing.small,
    },

    otpSection: {
      padding: theme.spacing.xlarge,
      // borderTopWidth: 1,
      // borderTopColor: `${theme.colors.primary}33`,
      // marginTop: theme.spacing.large,
    },
    otpTitle: {
      textAlign: 'center',
      marginBottom: theme.spacing.large,
    },
    otpContainer: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      justifyContent: 'center',
      gap: theme.spacing.medium,
      marginBottom: theme.spacing.medium,
    },
    otpInput: {
      width: 48,
      height: 56,
      borderRadius: theme.borderRadius.medium,
      borderWidth: 1,
      textAlign: 'center',
      fontSize: 20,
      borderColor: `${theme.colors.primary}55`,
      backgroundColor: theme.colors.inputColor,
      paddingHorizontal: theme.spacing.large,
      color: theme.colors.textSecondary,
      fontFamily: theme.typography.fontFamily,
    },
    otpInputFocused: {
      borderColor: theme.colors.primary,
      borderWidth: 2,
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

    loginButton: {
      marginTop: theme.spacing.xxlarge,
    },
    buttonDisabled: {
      opacity: 0.5,
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Send Code Button */}
            {!showOTP && (
              <View>
                <View style={styles.header}>
                  <Text variant="h3" style={styles.title}>
                    ورود یا ثبت‌نام
                  </Text>
                  <Text
                    variant="small"
                    color="secondary"
                    style={styles.subtitle}
                  >
                    برای ادامه، شماره موبایل خود را وارد کنید
                  </Text>
                </View>
                <View style={styles.form}>
                  {/* <View style={styles.inputContainer}>
                    <Text variant="small" style={styles.label}>
                      نام کاربری (اختیاری)
                    </Text>
                    <TextInput
                      style={styles.input}
                      placeholder=" نام کاربری خود را وارد کنید"
                      placeholderTextColor={`${theme.colors.textSecondary}80`}
                      value={name}
                      onChangeText={setName}
                      editable={!isPending}
                    />
                  </View> */}

                  <View style={styles.inputContainer}>
                    <Text variant="small" style={styles.label}>
                      شماره موبایل *
                    </Text>
                    <TextInput
                      style={[styles.input, { textAlign: 'right' }]}
                      placeholder="09xxxxxxxxx"
                      placeholderTextColor={`${theme.colors.textSecondary}80`}
                      value={mobile}
                      onChangeText={setMobile}
                      keyboardType="phone-pad"
                      maxLength={11}
                      editable={!isPending}
                    />
                  </View>
                </View>
                <View style={styles.buttonContainer}>
                  <Button
                    title={isPending ? 'در حال ارسال کد...' : `ارسال کد تایید`}
                    disabled={mobile.length < 10 || isPending}
                    onPress={handleSendCode}
                  />
                </View>
              </View>
            )}

            {/* OTP Section */}
            {showOTP && (
              <View style={styles.otpSection}>
                <Text variant="body" style={styles.otpTitle}>
                  کد تأیید را وارد کنید
                </Text>
                <Text
                  variant="x_small"
                  color="secondary"
                  style={styles.otpTitle}
                >
                  {' '}
                  کد تایید به شماره{' '}
                  <Text
                    variant="x_small"
                    color="primary"
                    style={{
                      fontWeight: 'bold',
                    }}
                  >
                    {' '}
                    {mobile || '09123456789'}{' '}
                  </Text>{' '}
                  ارسال شد.{' '}
                  <TouchableOpacity
                    onPress={() => {
                      setMobile('');
                      setShowOTP(false);
                    }}
                    style={{
                      paddingTop: 7,
                    }}
                  >
                    <MaterialIcon
                      name="edit"
                      size={17}
                      color={theme.colors.textSecondary}
                    />
                  </TouchableOpacity>
                </Text>

                <View style={styles.otpContainer}>
                  {otp.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={ref => {
                        otpRefs.current[index] = ref;
                      }}
                      style={styles.otpInput}
                      value={digit}
                      onChangeText={value => handleOtpChange(value, index)}
                      onKeyPress={e => handleOtpKeyPress(e, index)}
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

                <View>
                  {wrongOTP && (
                    <Text variant="xx_small" color="error">
                      مشکلی در ورود وجود دارد٬ لطفا دوباره تلاش کنید.
                    </Text>
                  )}
                </View>

                <View style={styles.loginButton}>
                  <Button
                    title="ورود"
                    disabled={otp.join('').length < 5 || isRegisteryPending}
                    onPress={handleLogin}
                  />
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
