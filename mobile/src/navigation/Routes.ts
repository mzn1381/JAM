import React from 'react';
import { createStaticNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Home, { CustomHomeHeader } from '../screens/home';
import Chat, { CustomChatHeader } from '../screens/chat';
import Settings, { CustomSettingsHeader } from '../screens/settings';
import ErrorStateScreen from '../screens/errorState';
import TaskList, { CustomTaskListHeader } from '../screens/taskList';
import PersonalVault, {
  CustomPersonalVaultHeader,
} from '../screens/personalVault';
import OnBoarding from '../screens/onboarding';
import InternalProcessorSetting from '../screens/internalProcessorSetting';
import PermissionsManager, {
  CustomPermissionsManagerHeader,
} from '../screens/permissionsManager';
import { TerminalLogger } from '../screens/logger/Logger';
import PreferencesSelection, {
  CustomPreferencesSelectionHeader,
} from '../screens/preferences';
import UnlockPage, { CustomUnlockHeader } from '../screens/unlock';
import LoginPage, { CustomLoginHeader } from '../screens/Login';

// import ErrorPage from './screens/ErrorPage';

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
      screen: Home,
      linking: 'Home',
      options: {
        title: 'Home',
        header: props => React.createElement(CustomHomeHeader, props),
      },
    },
    OnBoarding: {
      screen: OnBoarding,
      linking: 'OnBoarding',
      options: { title: 'Welcome', headerShown: false },
    },
    Chat: {
      screen: Chat,
      linking: 'Chat/:taskId',
      options: {
        title: 'Chat',
        header: props => React.createElement(CustomChatHeader, props),
      },
    },
    Settings: {
      screen: Settings,
      linking: 'Settings',
      options: {
        title: 'Settings',
        header: props => React.createElement(CustomSettingsHeader, props),
      },
    },
    TaskList: {
      screen: TaskList,
      linking: 'TaskList',
      options: {
        title: 'Tasks',
        header: props => React.createElement(CustomTaskListHeader, props),
      },
    },
    PersonalVault: {
      screen: PersonalVault,
      linking: 'PersonalVault',
      options: {
        title: 'Vault',
        header: props => React.createElement(CustomPersonalVaultHeader, props),
      },
    },
    InternalProcessorSetting: {
      screen: InternalProcessorSetting,
      linking: 'InternalProcessorSetting',
      options: { title: 'Processor Settings' },
    },
    PermissionsManager: {
      screen: PermissionsManager,
      linking: 'PermissionsManager',
      options: {
        title: 'Permissions Manager',
        header: props =>
          React.createElement(CustomPermissionsManagerHeader, props),
      },
    },
    PreferencesSelection: {
      screen: PreferencesSelection,
      linking: 'PreferencesSelection',
      options: {
        title: 'Preferences Selection',
        header: props =>
          React.createElement(CustomPreferencesSelectionHeader, props),
      },
    },
    UnLock: {
      screen: UnlockPage,
      linking: 'UnLock',

      options: {
        title: 'UnLock',
        header: props => React.createElement(CustomUnlockHeader, props),
        headerShown: false,
      },
    },
    ErrorPage: {
      screen: ErrorStateScreen,
      linking: 'ErrorPage',
      options: { title: 'Error', headerShown: false },
    },
    TerminalLogger: {
      screen: TerminalLogger,
      linking: 'TerminalLogger',
      options: { title: 'Logger', headerShown: false },
    },
    Login: {
      screen: LoginPage,
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

export default Navigation;
