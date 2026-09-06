import { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  children: ReactNode;
};

export default function SafeContainer({ children }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flex: 1,
        // paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
    >
      {children}
    </View>
  );
}
