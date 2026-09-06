// src/screens/Login.tsx
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  View as RNView,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { View, Text, Button } from '../../components';
import { useStore } from '../../store';
import { NavigationProp } from '../../navigation/Routes';
import MaterialIcon from '../../components/MaterialIcon';
import OTPVerificationModal from './components/OTPVerificationModal';

export default function LoginPage() {
  const navigation = useNavigation<NavigationProp>();
  const theme = useStore(state => state.currentTheme);
  const isRTL = useStore(state => state.isRTL);

  const [phoneNumber, setPhoneNumber] = useState('');

  const handleGetOTP = () => {
    if (phoneNumber.length >= 10) {
      console.log('Sending OTP to:', phoneNumber);
      // Navigate to OTP screen
      // navigation.navigate('OTPVerification', { phoneNumber });
    }
  };

  const handleGoogleLogin = () => {
    console.log('Google login');
  };

  const handleGithubLogin = () => {
    console.log('GitHub login');
  };

  const handleTermsPress = () => {
    Linking.openURL('https://yourapp.com/terms');
  };

  const handlePrivacyPress = () => {
    Linking.openURL('https://yourapp.com/privacy');
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingTop: theme.spacing.xxlarge,
    },

    closeButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: {
      // flex: 1,
      // paddingHorizontal: theme.spacing.large,
    },
    iconSection: {
      marginTop: theme.spacing.xxxlarge,
      marginBottom: theme.spacing.xlarge,
    },
    iconContainer: {
      width: 64,
      height: 64,
      borderRadius: theme.borderRadius.large,
      backgroundColor: `${theme.colors.primary}10`,
      borderWidth: 1,
      borderColor: `${theme.colors.primary}33`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    titleSection: {
      paddingHorizontal: theme.spacing.xlarge,
      alignItems: 'center',
      marginBottom: theme.spacing.xxxlarge,
    },
    title: {
      marginBottom: theme.spacing.small,
      textAlign: 'center',
    },
    subtitle: {
      textAlign: 'center',
    },
    formSection: {
      width: '100%',
      paddingHorizontal: theme.spacing.xlarge,
      gap: theme.spacing.large,
    },
    inputGroup: {
      gap: theme.spacing.small,
    },
    inputLabel: {
      marginLeft: isRTL ? theme.spacing.small : 0,
      marginRight: isRTL ? 0 : theme.spacing.small,
      textAlign: isRTL ? 'left' : 'right',
    },
    input: {
      ...theme.typography.h5,
      color: theme.colors.textPrimary,
      fontFamily: 'monospace',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.medium,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingVertical: theme.spacing.medium,
      paddingHorizontal: theme.spacing.large,
      textAlign: isRTL ? 'right' : 'left',
      height: 56,
      letterSpacing: 2,
    },
    inputFocused: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.inputColor,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
    getOtpButton: {
      height: 56,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: theme.elevation.medium,
    },
    dividerSection: {
      width: '100%',
      paddingHorizontal: theme.spacing.xlarge,
      paddingVertical: theme.spacing.xxxlarge,
    },
    divider: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: theme.spacing.large,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.colors.border,
    },
    dividerText: {
      textAlign: 'center',
    },
    socialSection: {
      width: '100%',
      paddingHorizontal: theme.spacing.xlarge,
      gap: theme.spacing.large,
    },
    socialRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      gap: theme.spacing.large,
    },
    socialButton: {
      flex: 1,
      height: 56,
      borderRadius: theme.borderRadius.medium,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.small,
    },
    socialIcon: {
      width: 24,
      height: 24,
    },
    socialText: {
      fontWeight: '700',
    },
    footer: {
      paddingHorizontal: theme.spacing.xxxlarge,
      paddingVertical: theme.spacing.xxxlarge,
      backgroundColor: theme.colors.background,
    },
    footerText: {
      textAlign: 'center',
      lineHeight: 18,
    },
    footerLink: {
      color: theme.colors.primary,
    },
    footerSpacer: {
      height: 24,
      marginTop: theme.spacing.large,
    },
  });

  return (
    <>
      <View style={styles.container}>
        {/* Content */}
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ alignItems: 'center', paddingBottom: 40 }}
        >
          {/* Icon Section */}
          <View style={styles.iconSection}>
            <View style={styles.iconContainer}>
              <MaterialIcon
                name="lock"
                size={38}
                color={theme.colors.primary}
              />
            </View>
          </View>

          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text variant="h3" style={styles.title}>
              ورود به پیشکار
            </Text>
            <Text variant="small" color="secondary" style={styles.subtitle}>
              امن و متمرکز بر حریم خصوصی
            </Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text variant="small" color="secondary" style={styles.inputLabel}>
                شماره موبایل
              </Text>
              <TextInput
                style={[styles.input, phoneNumber && styles.inputFocused]}
                placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                placeholderTextColor={theme.colors.textSecondary}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                maxLength={11}
              />
            </View>

            <Button
              title="دریافت کد تایید"
              variant="primary"
              size="medium"
              onPress={handleGetOTP}
              style={styles.getOtpButton}
            />
          </View>

          {/* Divider */}
          <View style={styles.dividerSection}>
            <View style={styles.divider}>
              <RNView style={styles.dividerLine} />
              <Text
                variant="xx_small"
                color="secondary"
                style={styles.dividerText}
              >
                یا ورود با
              </Text>
              <RNView style={styles.dividerLine} />
            </View>
          </View>

          {/* Social Login */}
          <View style={styles.socialSection}>
            <View style={styles.socialRow}>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={handleGoogleLogin}
                activeOpacity={0.7}
              >
                <MaterialIcon
                  name="google_G"
                  size={26}
                  color={theme.colors.textPrimary}
                />
                <Text variant="small" style={styles.socialText}>
                  Google
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialButton}
                onPress={handleGithubLogin}
                activeOpacity={0.7}
              >
                <MaterialIcon
                  name="gitHub"
                  size={24}
                  color={theme.colors.textPrimary}
                />
                <Text variant="small" style={styles.socialText}>
                  GitHub
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text
              variant="xx_small"
              color="secondary"
              style={styles.footerText}
            >
              با ورود به پیشکار، شما با{' '}
              <Text
                variant="x_small"
                style={styles.footerLink}
                onPress={handleTermsPress}
              >
                شرایط استفاده
              </Text>{' '}
              و{' '}
              <Text
                variant="x_small"
                style={styles.footerLink}
                onPress={handlePrivacyPress}
              >
                سیاست حریم خصوصی
              </Text>{' '}
              ما موافقت می‌کنید.
            </Text>
            <RNView style={styles.footerSpacer} />
          </View>
        </ScrollView>
        {/* <OTPVerificationModal
          visible={true}
          phoneNumber={userPhone}
          onClose={() => setShowOTPModal(false)}
          onVerify={handleOTPVerify}
          onResend={handleOTPResend}
        /> */}
      </View>
    </>
  );
}
