// src/components/UnlockModal.tsx
import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  View as RNView,
  Dimensions,
} from 'react-native';
import { View, Text, Button } from '../../components';
import { useStore } from '../../store';
import MaterialIcon from '../../components/MaterialIcon';

interface UnlockModalProps {
  visible: boolean;
  onClose: () => void;
  onUnlock: (password?: string) => void;
  title?: string;
  subtitle?: string;
}

const { width } = Dimensions.get('window');

export default function UnlockModal({
  visible,
  onClose,
  onUnlock,
  title = 'ورود امن',
  subtitle = 'لطفا هویت خود را تأیید کنید',
}: UnlockModalProps) {
  const theme = useStore(state => state.currentTheme);
  const isRTL = useStore(state => state.isRTL);

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));

  React.useEffect(() => {
    if (visible) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    }
  }, [visible]);

  const handleBiometricUnlock = () => {
    onUnlock();
  };

  const handlePasswordUnlock = () => {
    onUnlock(password);
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      //   alignItems: 'center',
      padding: theme.spacing.xlarge,
    },
    modalContainer: {
      width: '100%',
      maxWidth: 480,
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.large,
      padding: theme.spacing.xlarge,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 24,
      elevation: theme.elevation.large,
    },
    closeButton: {
      position: 'absolute',
      top: theme.spacing.large,
      left: isRTL ? undefined : theme.spacing.large,
      right: isRTL ? theme.spacing.large : undefined,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
    },
    headerSection: {
      alignItems: 'center',
      marginBottom: theme.spacing.xlarge,
      marginTop: theme.spacing.small,
    },

    title: {
      marginBottom: theme.spacing.small,
      textAlign: 'center',
    },
    subtitle: {
      textAlign: 'center',
    },
    biometricSection: {
      alignItems: 'center',
      marginBottom: theme.spacing.xlarge,
    },
    biometricButton: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.medium,
    },
    biometricButtonActive: {
      backgroundColor: `${theme.colors.primary}15`,
      borderColor: `${theme.colors.primary}30`,
    },
    biometricInner: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      borderRadius: 60,
      backgroundColor: `${theme.colors.primary}10`,
    },
    biometricText: {
      color: theme.colors.primary,
      textAlign: 'center',
    },
    divider: {
      flexDirection: isRTL ? 'row' : 'row-reverse',
      alignItems: 'center',
      marginBottom: theme.spacing.large,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.colors.border,
    },
    dividerText: {
      marginHorizontal: theme.spacing.large,
      textAlign: 'center',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    formSection: {
      gap: theme.spacing.large,
    },
    inputGroup: {
      gap: theme.spacing.small,
    },
    inputLabel: {
      textAlign: isRTL ? 'left' : 'right',
    },
    inputWrapper: {
      position: 'relative',
    },
    input: {
      ...theme.typography.small,
      color: theme.colors.textPrimary,
      fontFamily: theme.typography.fontFamily,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.medium,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingVertical: theme.spacing.medium,
      paddingHorizontal: theme.spacing.large,
      paddingLeft: isRTL ? theme.spacing.large : 48,
      paddingRight: isRTL ? 48 : theme.spacing.large,
      textAlign: isRTL ? 'right' : 'left',
      height: 56,
    },
    eyeButton: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: isRTL ? undefined : theme.spacing.medium,
      right: isRTL ? theme.spacing.medium : undefined,
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.small,
    },
    forgotPassword: {
      alignSelf: isRTL ? 'flex-end' : 'flex-start',
    },
    loginButton: {
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: theme.elevation.large,
    },
    footer: {
      marginTop: theme.spacing.large,
      alignItems: 'center',
    },
    footerBadge: {
      flexDirection: isRTL ? 'row' : 'row-reverse',
      alignItems: 'center',
      gap: theme.spacing.small,
    },
    footerText: {
      textAlign: 'center',
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity activeOpacity={1} onPress={e => e.stopPropagation()}>
          <View style={styles.modalContainer}>
            {/* Close Button */}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <MaterialIcon
                name="close"
                size={20}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>

            {/* Header Section */}
            <View style={styles.headerSection}>
              <Text variant="h3" style={styles.title}>
                {title}
              </Text>
              <Text variant="small" color="secondary" style={styles.subtitle}>
                {subtitle}
              </Text>
            </View>

            {/* Biometric Section */}
            <View style={styles.biometricSection}>
              <TouchableOpacity
                style={[styles.biometricButton, styles.biometricButtonActive]}
                onPress={handleBiometricUnlock}
                activeOpacity={0.8}
              >
                <RNView style={styles.biometricInner} />
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <MaterialIcon
                    name="fingerprint"
                    size={56}
                    color={theme.colors.primary}
                  />
                </Animated.View>
              </TouchableOpacity>
              <Text variant="small" style={styles.biometricText}>
                لمس کنید تا وارد شوید
              </Text>
            </View>

            {/* Divider */}
            <View style={styles.divider}>
              <RNView style={styles.dividerLine} />
              <Text
                variant="xx_small"
                color="secondary"
                style={styles.dividerText}
              >
                یا با رمز عبور
              </Text>
              <RNView style={styles.dividerLine} />
            </View>

            {/* Password Form */}
            <View style={styles.formSection}>
              <View style={styles.inputGroup}>
                <Text variant="small" style={styles.inputLabel}>
                  رمز عبور
                </Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <MaterialIcon
                      name={showPassword ? 'visibility' : 'visibility_off'}
                      size={20}
                      color={theme.colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.forgotPassword}>
                  <Text
                    variant="xx_small"
                    style={{ color: theme.colors.primary }}
                  >
                    رمز عبور را فراموش کرده‌اید؟
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Login Button */}
              <Button
                title="ورود به حساب"
                variant="primary"
                size="medium"
                onPress={handlePasswordUnlock}
                style={styles.loginButton}
              />
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <View style={styles.footerBadge}>
                <MaterialIcon
                  name="shield"
                  size={14}
                  color={theme.colors.textSecondary}
                />
                <Text variant="xx_small" color="secondary">
                  اطلاعات شما محافظت شده است
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
