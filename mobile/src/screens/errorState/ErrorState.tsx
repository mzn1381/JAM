// src/components/ErrorStateScreen.tsx
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Button, Text, View } from '../../components';
import { useStore } from '../../store';
import MaterialIcon from '../../components/MaterialIcon';

export default function ErrorStateScreen() {
  const theme = useStore(state => state.currentTheme);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xlarge,
    },
    content: {
      width: '100%',
      maxWidth: 400,
      alignItems: 'center',
      gap: theme.spacing.xlarge,
    },
    iconContainer: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    icon: {
      // color: '#CF6679',
    },
    textContainer: {
      alignItems: 'center',
      gap: theme.spacing.small,
    },
    title: {
      textAlign: 'center',
      marginBottom: 18,
    },
    description: {
      textAlign: 'center',
      lineHeight: 24,
    },
    retryButton: {
      width: '100%',
    },
  });

  function onRetry() {
    console.log('Retry...');
  }
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <MaterialIcon
            name="cloud_error"
            color={theme.colors.accent}
            style={styles.icon}
            size={70}
          />
        </View>

        <View style={styles.textContainer}>
          <Text variant="h2" style={styles.title}>
            مشکلی پیش آمد :(
          </Text>
          <Text variant="body" color="secondary" style={styles.description}>
            نتوانستیم اطلاعات را بارگذاری کنیم. لطفاً اتصال اینترنت خود را بررسی
            کرده و دوباره تلاش کنید.
          </Text>
        </View>

        <Button
          title="تلاش مجدد"
          onPress={onRetry}
          style={styles.retryButton}
        />
      </View>
    </View>
  );
}
