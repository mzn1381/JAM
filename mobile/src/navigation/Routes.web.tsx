import React, { Suspense, lazy, type ComponentType } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { createStaticNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import CustomHomeHeader from '../screens/home/Header';
import CustomChatHeader from '../screens/chat/Header';
import CustomSettingsHeader from '../screens/settings/Header';
import CustomTaskListHeader from '../screens/taskList/Header';
import CustomPersonalVaultHeader from '../screens/personalVault/Header';
import CustomPermissionsManagerHeader from '../screens/permissionsManager/Header';
import CustomPreferencesSelectionHeader from '../screens/preferences/Header';
import CustomUnlockHeader from '../screens/unlock/Header';
import CustomLoginHeader from '../screens/Login/Header';

const Home = lazy(() => import('../screens/home/Home'));
const Chat = lazy(() => import('../screens/chat/Chat'));
const Settings = lazy(() => import('../screens/settings/Settings'));
const ErrorStateScreen = lazy(() => import('../screens/errorState/ErrorState'));
const TaskList = lazy(() => import('../screens/taskList/TaskList'));
const PersonalVault = lazy(
  () => import('../screens/personalVault/PersonalVault'),
);
const OnBoarding = lazy(() => import('../screens/onboarding/Onboarding'));
const InternalProcessorSetting = lazy(
  () => import('../screens/internalProcessorSetting/InternalProcessorSetting'),
);
const PermissionsManager = lazy(
  () => import('../screens/permissionsManager/PermissionsManager'),
);
const TerminalLogger = lazy(() =>
  import('../screens/logger/Logger').then(module => ({
    default: module.TerminalLogger,
  })),
);
const PreferencesSelection = lazy(
  () => import('../screens/preferences/PreferencesSelection'),
);
const UnlockPage = lazy(() => import('../screens/unlock/Unlock'));
const LoginPage = lazy(() => import('../screens/Login/Login'));

function RouteFallback() {
  return (
    <View style={styles.routeFallback}>
      <ActivityIndicator size="small" />
    </View>
  );
}

function withRouteSuspense<Props extends object>(
  LazyScreen: React.LazyExoticComponent<ComponentType<Props>>,
) {
  return function SuspendedRoute(props: Props) {
    return (
      <Suspense fallback={<RouteFallback />}>
        <LazyScreen {...props} />
      </Suspense>
    );
  };
}

export type RootStackParamList = {
  OnBoarding: undefined;
  Home: undefined;
  Chat: { taskId: string; initialPrompt?: string };
  Settings: undefined;
  TaskList: undefined;
  PersonalVault: undefined;
  InternalProcessorSetting: undefined;
  ErrorPage: undefined;
  PermissionsManager: undefined;
  TerminalLogger: undefined;
  PreferencesSelection: undefined;
  UnLock: undefined;
  Login: undefined;
};

export type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const RootStack = createNativeStackNavigator<RootStackParamList>({
  screens: {
    Home: {
      screen: withRouteSuspense(Home),
      linking: 'Home',
      options: {
        title: 'Home',
        header: props => React.createElement(CustomHomeHeader, props),
      },
    },
    OnBoarding: {
      screen: withRouteSuspense(OnBoarding),
      linking: 'OnBoarding',
      options: { title: 'Welcome', headerShown: false },
    },
    Chat: {
      screen: withRouteSuspense(Chat),
      linking: 'Chat/:taskId',
      options: {
        title: 'Chat',
        header: props => React.createElement(CustomChatHeader, props),
      },
    },
    Settings: {
      screen: withRouteSuspense(Settings),
      linking: 'Settings',
      options: {
        title: 'Settings',
        header: props => React.createElement(CustomSettingsHeader, props),
      },
    },
    TaskList: {
      screen: withRouteSuspense(TaskList),
      linking: 'TaskList',
      options: {
        title: 'Tasks',
        header: props => React.createElement(CustomTaskListHeader, props),
      },
    },
    PersonalVault: {
      screen: withRouteSuspense(PersonalVault),
      linking: 'PersonalVault',
      options: {
        title: 'Vault',
        header: props => React.createElement(CustomPersonalVaultHeader, props),
      },
    },
    InternalProcessorSetting: {
      screen: withRouteSuspense(InternalProcessorSetting),
      linking: 'InternalProcessorSetting',
      options: { title: 'Processor Settings' },
    },
    PermissionsManager: {
      screen: withRouteSuspense(PermissionsManager),
      linking: 'PermissionsManager',
      options: {
        title: 'Permissions Manager',
        header: props =>
          React.createElement(CustomPermissionsManagerHeader, props),
      },
    },
    PreferencesSelection: {
      screen: withRouteSuspense(PreferencesSelection),
      linking: 'PreferencesSelection',
      options: {
        title: 'Preferences Selection',
        header: props =>
          React.createElement(CustomPreferencesSelectionHeader, props),
      },
    },
    UnLock: {
      screen: withRouteSuspense(UnlockPage),
      linking: 'UnLock',
      options: {
        title: 'UnLock',
        header: props => React.createElement(CustomUnlockHeader, props),
        headerShown: false,
      },
    },
    ErrorPage: {
      screen: withRouteSuspense(ErrorStateScreen),
      linking: 'ErrorPage',
      options: { title: 'Error', headerShown: false },
    },
    TerminalLogger: {
      screen: withRouteSuspense(TerminalLogger),
      linking: 'TerminalLogger',
      options: { title: 'Logger', headerShown: false },
    },
    Login: {
      screen: withRouteSuspense(LoginPage),
      linking: 'Login',
      options: {
        title: 'Login',
        header: props => React.createElement(CustomLoginHeader, props),
        headerShown: false,
      },
    },
  },
  initialRouteName: 'Home',
});

const Navigation = createStaticNavigation(RootStack);

const styles = StyleSheet.create({
  routeFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
});

export default Navigation;
