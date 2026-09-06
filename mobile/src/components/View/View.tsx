// src/components/View.tsx
import React from 'react';
import { View as RNView, ViewProps } from 'react-native';
import { useStore } from '../../store';

interface CustomViewProps extends ViewProps {
  variant?: 'background' | 'surface' | 'card';
  padding?: keyof typeof import('../../theme/spacing').spacing;
}

export const View: React.FC<CustomViewProps> = ({
  variant = 'background',
  padding,
  style,
  children,
  ...props
}) => {
  const theme = useStore(state => state.currentTheme);

  const viewStyles = {
    backgroundColor:
      variant === 'surface' || variant === 'card'
        ? theme.colors.surface
        : theme.colors.background,
    padding: padding ? theme.spacing[padding] : undefined,
    borderRadius: variant === 'card' ? theme.borderRadius.medium : 0,
  };

  return (
    <RNView style={[viewStyles, style]} {...props}>
      {children}
    </RNView>
  );
};
