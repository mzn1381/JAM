// src/components/LoadingScreen.tsx
import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated, Easing } from 'react-native';
import { View, Text } from '../../components';
import { useStore } from '../../store';
import { APP_PERSIAN_NAME } from '../../utils/constants';

export const LoadingScreen: React.FC = () => {
  const theme = useStore(state => state.currentTheme);

  // Animation values
  const spinValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(0.8)).current;
  const fadeValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Spin animation
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();

    // Scale animation
    Animated.spring(scaleValue, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();

    // Fade in animation
    Animated.timing(fadeValue, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1.1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  });

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xlarge,
    },
    logoContainer: {
      marginBottom: theme.spacing.xxxlarge,
    },
    outerCircle: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: `${theme.colors.primary}15`,
      justifyContent: 'center',
      alignItems: 'center',
    },
    middleCircle: {
      width: 90,
      height: 90,
      borderRadius: 45,
      backgroundColor: `${theme.colors.primary}30`,
      justifyContent: 'center',
      alignItems: 'center',
    },
    innerCircle: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    spinnerContainer: {
      position: 'absolute',
      width: 120,
      height: 120,
      borderRadius: 60,
      borderWidth: 4,
      borderColor: 'transparent',
      borderTopColor: theme.colors.primary,
      borderRightColor: theme.colors.primary,
    },
    icon: {
      fontSize: 32,
      color: theme.colors.onPrimary,
    },
    textContainer: {
      alignItems: 'center',
      gap: theme.spacing.medium,
    },
    title: {
      fontSize: 36,
      textAlign: 'center',
    },
    subtitle: {
      textAlign: 'center',
      marginTop: theme.spacing.small,
    },
    dotsContainer: {
      flexDirection: 'row',
      gap: theme.spacing.small,
      marginTop: theme.spacing.xlarge,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.primary,
    },
    footer: {
      position: 'absolute',
      bottom: theme.spacing.xxxlarge,
      alignItems: 'center',
    },
    footerText: {
      textAlign: 'center',
    },
  });

  return (
    <View style={styles.container}>
      {/* Animated Logo */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            transform: [{ scale: scaleValue }],
            opacity: fadeValue,
          },
        ]}
      >
        {/* Spinning border */}
        <Animated.View
          style={[
            styles.spinnerContainer,
            {
              transform: [{ rotate: spin }],
            },
          ]}
        />

        {/* Pulsing circles */}
        <Animated.View
          style={[
            styles.outerCircle,
            {
              transform: [{ scale: pulseValue }],
            },
          ]}
        >
          <View style={styles.middleCircle}>
            <View style={styles.innerCircle}>
              <Text style={styles.icon}>✨</Text>
            </View>
          </View>
        </Animated.View>
      </Animated.View>

      {/* Text Content */}
      <Animated.View
        style={[
          styles.textContainer,
          {
            opacity: fadeValue,
          },
        ]}
      >
        <Text variant="h1" style={styles.title}>
          {APP_PERSIAN_NAME}
        </Text>
        <Text variant="body" color="secondary" style={styles.subtitle}>
          دستیار هوشمند شخصی شما
        </Text>

        {/* Loading Dots */}
        <View style={styles.dotsContainer}>
          {[0, 1, 2].map(index => (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  opacity: fadeValue,
                  transform: [
                    {
                      translateY: fadeValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -5],
                      }),
                    },
                  ],
                },
              ]}
            />
          ))}
        </View>
      </Animated.View>

      {/* Footer */}
      <Animated.View
        style={[
          styles.footer,
          {
            opacity: fadeValue,
          },
        ]}
      >
        <Text variant="x_small" color="secondary" style={styles.footerText}>
          در حال بارگذاری...
        </Text>
        <Text
          variant="x_small"
          color="secondary"
          style={[styles.footerText, { marginTop: 4 }]}
        >
          داده‌ها فقط روی دستگاه ذخیره می‌شوند
        </Text>
      </Animated.View>
    </View>
  );
};

export default LoadingScreen;
