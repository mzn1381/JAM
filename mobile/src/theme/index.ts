import { useColorScheme } from 'react-native';
import { colors, ColorScheme } from './colors';
import { typography, Typography } from './typography';
import { spacing, Spacing } from './spacing';
import { borderRadius, elevation } from './radius';

export interface Theme {
  colors: ColorScheme;
  typography: Typography;
  spacing: Spacing;
  borderRadius: typeof borderRadius;
  elevation: typeof elevation;
}

export const useTheme = (): Theme => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return {
    colors: isDark ? colors.dark : colors.light,
    typography,
    spacing,
    borderRadius,
    elevation,
  };
};

export { colors, typography, spacing, borderRadius, elevation };
