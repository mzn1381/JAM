// src/components/IconButton.tsx
import React from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  ViewStyle,
} from 'react-native';
import { useStore } from '../../store';

interface IconButtonProps extends TouchableOpacityProps {
  icon: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'small' | 'medium' | 'large';
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  variant = 'ghost',
  size = 'medium',
  style,
  disabled,
  ...props
}) => {
  const theme = useStore(state => state.currentTheme);

  const sizeMap = {
    small: 32,
    medium: 44,
    large: 56,
  };

  const buttonStyles: ViewStyle = {
    width: sizeMap[size],
    height: sizeMap[size],
    borderRadius: sizeMap[size] / 2,
    backgroundColor:
      variant === 'primary'
        ? theme.colors.primary
        : variant === 'secondary'
        ? theme.colors.accent
        : 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: disabled ? 0.5 : 1,
  };

  return (
    <TouchableOpacity
      style={[buttonStyles, style]}
      disabled={disabled}
      activeOpacity={0.7}
      {...props}
    >
      {icon}
    </TouchableOpacity>
  );
};
