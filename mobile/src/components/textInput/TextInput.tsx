// src/components/TextInput.tsx
import React, { forwardRef } from 'react';
import {
  TextInput as RNTextInput,
  StyleSheet,
  TextInputProps,
  TextStyle,
} from 'react-native';
import { useStore } from '../../store';

interface CustomTextInputProps extends TextInputProps {
  variant?: 'default' | 'otp' | 'phone' | 'email' | 'password';
  label?: string;
}

export const TextInput = forwardRef<RNTextInput, CustomTextInputProps>(
  (
    {
      variant = 'default',
      label,
      placeholder,
      placeholderTextColor,
      style,
      keyboardType,
      maxLength,
      ...props
    },
    ref,
  ) => {
    const theme = useStore(state => state.currentTheme);
    const isRTL = useStore(state => state.isRTL);

    const getVariantStyles = (): TextStyle => {
      switch (variant) {
        case 'otp':
          return {
            height: 56,
            width: 48,
            borderRadius: theme.borderRadius.medium,
            borderWidth: 1,
            borderColor: '#2f6a64',
            backgroundColor: '#183532',
            textAlign: 'center',
            fontSize: 20,
            fontWeight: '700',
            color: theme.colors.onPrimary,
          };

        case 'phone':
          return {
            height: 56,
            borderRadius: theme.borderRadius.medium,
            borderWidth: 1,
            borderColor: '#2f6a64',
            backgroundColor: '#183532',
            paddingHorizontal: theme.spacing.large,
            color: theme.colors.onPrimary,
            fontSize: 16,
            fontFamily: theme.typography.fontFamily,
            textAlign: isRTL ? 'right' : 'left',
          };

        case 'email':
          return {
            height: 56,
            borderRadius: theme.borderRadius.medium,
            borderWidth: 1,
            borderColor: '#2f6a64',
            backgroundColor: '#183532',
            paddingHorizontal: theme.spacing.large,
            color: theme.colors.onPrimary,
            fontSize: 16,
            fontFamily: theme.typography.fontFamily,
            textAlign: 'left',
          };

        case 'password':
          return {
            height: 56,
            borderRadius: theme.borderRadius.medium,
            borderWidth: 1,
            borderColor: '#2f6a64',
            backgroundColor: '#183532',
            paddingHorizontal: theme.spacing.large,
            color: theme.colors.onPrimary,
            fontSize: 16,
            fontFamily: theme.typography.fontFamily,
            textAlign: isRTL ? 'right' : 'left',
          };

        case 'default':
        default:
          return {
            height: 56,
            borderRadius: theme.borderRadius.medium,
            borderWidth: 1,
            borderColor: '#2f6a64',
            backgroundColor: '#183532',
            paddingHorizontal: theme.spacing.large,
            color: theme.colors.onPrimary,
            fontSize: 16,
            fontFamily: theme.typography.fontFamily,
            textAlign: isRTL ? 'right' : 'left',
          };
      }
    };

    const getKeyboardType = () => {
      if (keyboardType) return keyboardType;
      switch (variant) {
        case 'phone':
          return 'phone-pad' as const;
        case 'email':
          return 'email-address' as const;
        case 'otp':
          return 'number-pad' as const;
        default:
          return 'default' as const;
      }
    };

    const getMaxLength = () => {
      if (maxLength) return maxLength;
      switch (variant) {
        case 'phone':
          return 11;
        case 'otp':
          return 1;
        default:
          return undefined;
      }
    };

    const getPlaceholder = () => {
      if (placeholder) return placeholder;
      switch (variant) {
        case 'phone':
          return '09xxxxxxxxx';
        case 'email':
          return 'example@email.com';
        case 'password':
          return '••••••••';
        case 'otp':
          return '0';
        default:
          return 'متن را وارد کنید';
      }
    };

    const finalPlaceholderColor =
      placeholderTextColor || `${theme.colors.textSecondary}80`;

    const styles = StyleSheet.create({
      input: getVariantStyles(),
    });

    return (
      <RNTextInput
        ref={ref}
        style={[styles.input, style]}
        placeholder={getPlaceholder()}
        placeholderTextColor={finalPlaceholderColor}
        keyboardType={getKeyboardType()}
        maxLength={getMaxLength()}
        selectionColor={theme.colors.primary}
        {...props}
      />
    );
  },
);

TextInput.displayName = 'TextInput';

export default TextInput;
