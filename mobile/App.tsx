/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * "homepage": "https://github.com/react-native-community/template/tree/main",
 *
 * @format
 */

import React, { useEffect, useState } from 'react';
import { StatusBar, useColorScheme, I18nManager, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useStore } from './src/store';
import { colors } from './src/theme/colors';
import Navigation from './src/navigation/Routes';
import { DefaultTheme } from '@react-navigation/native';

import LoadingScreen from './src/common/commonUI/LoadingScreen';
import GlobalLogicProvider from './src/common/providers/GlobalLogicProvider';
import CustomQueryClientProvider from './src/services/provider/CustomQueryClientProvider';
import SafeContainer from './src/common/providers/SafeContainer';
import Toast from 'react-native-toast-message';
import { useDoubleBackToExit } from './src/hooks/useDoubleBackToExit';
import { AuthProvider } from './src/common/providers/AuthProvider';
import { navigateWithRef, navigationRef } from './src/navigation/navigationRef';

function App() {
  const systemColorScheme = useColorScheme();
  const updateTheme = useStore(state => state.updateTheme);
  const currentTheme = useStore(state => state.currentTheme);
  const isOnboarded = useStore(state => state.isOnboarded);
  const isSelectedPreferences = useStore(state => state.isSelectedPreferences);
  const isAuthenticated = useStore(state => state.isAuthenticated);
  const themeMode = useStore(state => state.themeMode);
  const isRTL = useStore(state => state.isRTL);
  const [isLoading, setIsLoading] = useState(true);

  useDoubleBackToExit();

  // Initialize RTL on app start
  useEffect(() => {
    if (I18nManager.isRTL !== isRTL) {
      I18nManager.forceRTL(isRTL);
      I18nManager.allowRTL(isRTL);
    }
  }, [isRTL]);

  // Update theme whenever system color scheme or theme mode changes
  useEffect(() => {
    updateTheme(systemColorScheme);
    setTimeout(() => setIsLoading(false), 1000);
  }, [systemColorScheme, themeMode, updateTheme]);

  const isDark = currentTheme.colors === colors.dark;

  const MyTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: currentTheme.colors.background,
      primary: currentTheme.colors.primary,
      card: currentTheme.colors.surface,
      text: currentTheme.colors.textPrimary,
      border: currentTheme.colors.border,
      notification: currentTheme.colors.accent,
    },
  };

  if (isLoading) {
    return <LoadingScreen />;
  }
  return (
    <SafeAreaProvider>
      <CustomQueryClientProvider>
        <AuthProvider>
          <GlobalLogicProvider>
            <SafeContainer>
              <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor={currentTheme.colors.background}
              />
              <Navigation
                theme={MyTheme}
                ref={navigationRef}
                linking={{
                  enabled: 'auto',
                  prefixes: [
                    // process.env.VITE_BASE_URL_WEB,
                    // ? process.env.VITE_BASE_URL_WEB
                    // : 'http://localhost:5175/v',
                  ],
                }}
                onReady={() => {
                  if (Platform.OS !== 'web') {
                    if (!isOnboarded) {
                      navigateWithRef('OnBoarding');
                    } else if (!isSelectedPreferences && isAuthenticated) {
                      navigateWithRef('PreferencesSelection');
                    }
                  }
                }}
              />

              <Toast />
            </SafeContainer>
          </GlobalLogicProvider>
        </AuthProvider>
      </CustomQueryClientProvider>
    </SafeAreaProvider>
  );
}

export default App;
