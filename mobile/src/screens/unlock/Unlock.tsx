import React, { useState } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { View, Text, Button, ScrollView } from '../../components';
import { useStore } from '../../store';
import { NavigationProp } from '../../navigation/Routes';
import MaterialIcon from '../../components/MaterialIcon';

export default function UnlockPage() {
  const navigation = useNavigation<NavigationProp>();
  const theme = useStore(state => state.currentTheme);
  const isRTL = useStore(state => state.isRTL);

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
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
  }, []);

  const handleBiometricLogin = () => {
    console.log('Biometric authentication triggered');
    // Implement biometric authentication logic
  };

  const handlePasswordLogin = () => {
    console.log('Password login:', password);
    // Implement password login logic
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },

    spacer: {
      width: 40,
    },
    content: {
      flex: 1,
      paddingHorizontal: theme.spacing.xlarge,
      paddingTop: theme.spacing.xxxlarge,
    },
    welcomeSection: {
      alignItems: 'center',
      marginBottom: theme.spacing.xxxlarge,
    },
    welcomeTitle: {
      marginBottom: theme.spacing.small,
      textAlign: 'center',
    },
    welcomeSubtitle: {
      textAlign: 'center',
    },
    biometricSection: {
      alignItems: 'center',
      marginBottom: theme.spacing.xxxlarge,
    },
    biometricButton: {
      width: 140,
      height: 140,
      borderRadius: 70,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.large,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: theme.elevation.medium,
    },
    biometricButtonActive: {
      borderColor: `${theme.colors.primary}80`,
      backgroundColor: `${theme.colors.primary}10`,
    },
    biometricInner: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      borderRadius: 70,
      backgroundColor: `${theme.colors.primary}15`,
    },
    biometricText: {
      color: theme.colors.primary,
      textAlign: 'center',
    },
    divider: {
      flexDirection: isRTL ? 'row' : 'row-reverse',
      alignItems: 'center',
      marginBottom: theme.spacing.xlarge,
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
      marginLeft: isRTL ? theme.spacing.xsmall : 0,
      marginRight: isRTL ? 0 : theme.spacing.xsmall,
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
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    inputFocused: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.inputColor,
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
      paddingHorizontal: theme.spacing.xlarge,
      paddingVertical: theme.spacing.xlarge,
      alignItems: 'center',
    },
    footerBadge: {
      flexDirection: isRTL ? 'row' : 'row-reverse',
      alignItems: 'center',
      gap: theme.spacing.small,
      marginBottom: theme.spacing.small,
    },
    footerText: {
      textAlign: 'center',
      lineHeight: 18,
      maxWidth: 320,
    },
    backgroundGradient1: {
      position: 'absolute',
      top: -80,
      right: isRTL ? undefined : -80,
      left: isRTL ? -80 : undefined,
      width: 200,
      height: 200,
      borderRadius: 100,
      backgroundColor: `${theme.colors.primary}15`,
      opacity: 0.4,
    },
    backgroundGradient2: {
      position: 'absolute',
      bottom: -100,
      left: isRTL ? undefined : -100,
      right: isRTL ? -100 : undefined,
      width: 280,
      height: 280,
      borderRadius: 140,
      backgroundColor: `${theme.colors.primary}08`,
      opacity: 0.3,
    },
  });

  return (
    <>
      <View style={styles.container}>
        {/* Background Gradients */}
        <View style={styles.backgroundGradient1} />
        <View style={styles.backgroundGradient2} />

        {/* Scrollable Content */}
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: theme.spacing.xxxlarge }}
        >
          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            <Text variant="h2" style={styles.welcomeTitle}>
              خوش آمدید
            </Text>
            <Text
              variant="small"
              color="secondary"
              style={styles.welcomeSubtitle}
            >
              برای دسترسی به اطلاعات، هویت خود را تأیید کنید
            </Text>
          </View>

          {/* Biometric Button */}
          <View style={styles.biometricSection}>
            <TouchableOpacity
              style={[styles.biometricButton, styles.biometricButtonActive]}
              onPress={handleBiometricLogin}
              activeOpacity={0.8}
            >
              <View style={styles.biometricInner} />
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <MaterialIcon
                  name="fingerprint"
                  size={64}
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
            <View style={styles.dividerLine} />
            <Text
              variant="xx_small"
              color="secondary"
              style={styles.dividerText}
            >
              یا با رمز عبور
            </Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Password Form */}
          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text variant="small" style={styles.inputLabel}>
                رمز عبور
              </Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input]}
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
              onPress={handlePasswordLogin}
              style={styles.loginButton}
            />
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerBadge}>
            <MaterialIcon
              name="shield"
              size={16}
              color={theme.colors.textSecondary}
            />
            <Text variant="x_small" color="secondary">
              ذخیره‌سازی امن
            </Text>
          </View>
          <Text variant="xx_small" color="secondary" style={styles.footerText}>
            اطلاعات شما فقط در این دستگاه ذخیره می‌شود و هرگز به سرورهای خارجی
            ارسال نخواهد شد.
          </Text>
        </View>
      </View>
    </>
  );
}
