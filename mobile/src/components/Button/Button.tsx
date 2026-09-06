import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  TouchableOpacityProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useStore } from '../../store';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'text';
  size?: 'small' | 'medium' | 'large';
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  style,
  disabled,
  ...props
}) => {
  const theme = useStore(state => state.currentTheme);

  const buttonStyles: ViewStyle = {
    ...styles.base,
    backgroundColor:
      variant === 'primary'
        ? theme.colors.primary
        : variant === 'secondary'
        ? theme.colors.accent
        : 'transparent',
    paddingVertical:
      size === 'small'
        ? theme.spacing.small
        : size === 'large'
        ? theme.spacing.large
        : theme.spacing.medium,
    paddingHorizontal:
      size === 'small'
        ? theme.spacing.medium
        : size === 'large'
        ? theme.spacing.xlarge
        : theme.spacing.large,
    borderRadius: theme.borderRadius.small,
    opacity: disabled ? 0.5 : 1,
  };

  const textStyles: TextStyle = {
    ...theme.typography.body,
    fontFamily: theme.typography.fontFamily,
    color: variant === 'text' ? theme.colors.primary : theme.colors.onPrimary,
    fontSize:
      size === 'small'
        ? theme.typography.small.fontSize
        : size === 'large'
        ? theme.typography.h3.fontSize
        : theme.typography.body.fontSize,
    // fontWeight: variant === 'primary' ? '600' : '400',
  };

  return (
    <TouchableOpacity
      style={[buttonStyles, style]}
      disabled={disabled}
      activeOpacity={0.7}
      {...props}
    >
      <Text style={textStyles}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
