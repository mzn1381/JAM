import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from './Routes';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigateWithRef<RouteName extends keyof RootStackParamList>(
  name: RouteName | any,
  params?: RootStackParamList[RouteName],
) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
}
