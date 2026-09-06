import React from 'react';
import { Button, View, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function InternalProcessorSettingScreen() {
  const navigation = useNavigation();

  return (
    <View>
      <Text>InternalProcessorSetting Screen</Text>
      <Button
        title="Go to Tasks"
        // onPress={() => navigation.navigate('Tasks' as never)}
      />
    </View>
  );
}
