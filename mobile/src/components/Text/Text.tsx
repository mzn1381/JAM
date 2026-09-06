// src/components/Text.tsx
import React from 'react';
import { Text as RNText, TextProps, TextStyle } from 'react-native';
import {
  useStore,
  //  useIsRTL
} from '../../store';

interface CustomTextProps extends TextProps {
  variant?:
    | 'h1'
    | 'h2'
    | 'h3'
    | 'h4'
    | 'h5'
    | 'body'
    | 'small'
    | 'x_small'
    | 'xx_small';
  color?: 'primary' | 'secondary' | 'accent' | 'error' | 'success';
}

export const Text: React.FC<CustomTextProps> = ({
  variant = 'body',
  color = 'primary',
  style,
  children,
  ...props
}) => {
  const theme = useStore(state => state.currentTheme);
  //   const isRTL = useIsRTL();

  const textStyles: TextStyle = {
    ...theme.typography[variant],
    fontFamily: theme.typography.fontFamily,
    color:
      color === 'primary'
        ? theme.colors.textPrimary
        : color === 'secondary'
        ? theme.colors.textSecondary
        : color === 'accent'
        ? theme.colors.accent
        : color === 'error'
        ? theme.colors.error
        : theme.colors.success,
    // textAlign: isRTL ? 'right' : 'left',
    // writingDirection: isRTL ? 'rtl' : 'ltr',
  };

  return (
    <RNText style={[textStyles, style]} {...props}>
      {children}
    </RNText>
  );
};
