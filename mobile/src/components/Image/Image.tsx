// src/components/Image.tsx
import React from 'react';
import { Image as RNImage, ImageProps, ImageStyle } from 'react-native';
import { useStore } from '../../store';

interface CustomImageProps extends ImageProps {
  rounded?: boolean;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
}

export const Image: React.FC<CustomImageProps> = ({
  rounded = false,
  size = 'medium',
  style,
  ...props
}) => {
  const theme = useStore(state => state.currentTheme);

  const sizeMap = {
    small: 40,
    medium: 80,
    large: 120,
    xlarge: 200,
  };

  const imageStyles: ImageStyle = {
    width: sizeMap[size],
    height: sizeMap[size],
    borderRadius: rounded ? sizeMap[size] / 2 : theme.borderRadius.small,
  };

  return <RNImage style={[imageStyles, style]} {...props} />;
};
