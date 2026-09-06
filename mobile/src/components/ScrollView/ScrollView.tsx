// src/components/Scroll.tsx
import React from 'react';
import { ScrollView as RNScrollView, ScrollViewProps } from 'react-native';
import { useStore } from '../../store';

interface CustomScrollProps extends ScrollViewProps {
  variant?: 'background' | 'surface';
  padding?: keyof typeof import('../../theme/spacing').spacing;
}

export const ScrollView: React.FC<CustomScrollProps> = ({
  variant = 'background',
  padding,
  style,
  children,
  ...props
}) => {
  const theme = useStore(state => state.currentTheme);

  const scrollViewStyles = {
    backgroundColor:
      variant === 'surface' ? theme.colors.surface : theme.colors.background,
  };

  const contentContainerStyle = {
    padding: padding ? theme.spacing[padding] : theme.spacing.medium,
  };

  return (
    <RNScrollView
      style={[scrollViewStyles, style]}
      contentContainerStyle={contentContainerStyle}
      {...props}
    >
      {children}
    </RNScrollView>
  );
};
