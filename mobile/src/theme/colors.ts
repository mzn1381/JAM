export const colors = {
  light: {
    primary: '#00B3A6',
    onPrimary: '#FFFFFF',
    accent: '#FF7A59',
    background: '#FFFFFF',
    surface: '#f5f8f8ff',
    textPrimary: '#4b4b4b', //#4b4b4b
    textSecondary: '#777777', //#777777
    error: '#E53935',
    success: '#16A34A',
    privacyBadge: '#4B6670',
    border: '#e5e5e5', //#e5e5e5
    messageBubble: '#dad7d7d0',
    inputColor: '#e0f2f1',
    placeholderTextColor: '#eeeeee3c',
  },
  dark: {
    primary: '#00B3A6',
    onPrimary: '#FFFFFF',
    accent: '#FF7A59',
    background: '#0f2321',
    surface: '#273937',
    textPrimary: '#e6e6e6', //#e6e6e6
    textSecondary: '#a7a7a7', //#a7a7a7
    error: '#E53935',
    success: '#16A34A',
    privacyBadge: '#B0B0B0',
    border: '#1c302eff',
    messageBubble: '#323333ff',
    inputColor: '#183532',
    placeholderTextColor: '#eeeeee3c',
  },
};

export type ColorScheme = typeof colors.light;
