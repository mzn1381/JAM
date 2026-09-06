import { StateCreator } from 'zustand';
import { ColorSchemeName, I18nManager } from 'react-native';
import { Theme } from '../../theme';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { borderRadius, elevation } from '../../theme/radius';

export interface ThemeSlice {
  themeMode: 'light' | 'dark' | 'auto';
  currentTheme: Theme;
  isRTL: boolean;
  setThemeMode: (mode: 'light' | 'dark' | 'auto') => void;
  updateTheme: (systemColorScheme: ColorSchemeName) => void;
  setRTL: (isRTL: boolean) => void;
  toggleRTL: () => void;
}

export const createThemeSlice: StateCreator<ThemeSlice> = (set, get) => ({
  themeMode: 'auto',
  isRTL: true, // Default RTL
  currentTheme: {
    colors: colors.light,
    typography,
    spacing,
    borderRadius,
    elevation,
  },

  setThemeMode: mode => {
    set({ themeMode: mode });
  },

  updateTheme: systemColorScheme => {
    const { themeMode } = get();
    let isDark = false;

    if (themeMode === 'auto') {
      // Handle all possible ColorSchemeName values
      isDark = systemColorScheme === 'dark';
    } else {
      isDark = themeMode === 'dark';
    }

    set({
      currentTheme: {
        colors: isDark ? colors.dark : colors.light,
        typography,
        spacing,
        borderRadius,
        elevation,
      },
    });
  },

  setRTL: isRTL => {
    set({ isRTL });
    I18nManager.forceRTL(isRTL);
  },

  toggleRTL: () => {
    const { isRTL } = get();
    get().setRTL(!isRTL);
  },
});
