// src/components/Spinner.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Easing, Platform } from 'react-native';
import { View } from '../index';
import { useStore } from '../../store';

interface SpinnerProps {
  size?: number;
  color?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 40, color }) => {
  const theme = useStore(state => state.currentTheme);
  const spinValue = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  const finalColor = color || theme.colors.primary;

  useEffect(() => {
    let isCancelled = false;

    const createSpinTiming = () =>
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: Platform.OS !== 'web',
      });

    const startWebLoop = () => {
      const run = () => {
        if (isCancelled) return;
        spinValue.setValue(0);
        const animation = createSpinTiming();
        animationRef.current = animation;
        animation.start(({ finished }) => {
          if (!isCancelled && finished) {
            run();
          }
        });
      };
      run();
    };

    const startNativeLoop = () => {
      spinValue.setValue(0);
      const animation = Animated.loop(createSpinTiming());
      animationRef.current = animation;
      animation.start();
    };

    if (Platform.OS === 'web') {
      startWebLoop();
    } else {
      startNativeLoop();
    }

    return () => {
      isCancelled = true;
      animationRef.current?.stop();
      animationRef.current = null;
      spinValue.stopAnimation();
      spinValue.setValue(0);
    };
  }, [spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const styles = StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    spinner: {
      width: size,
      height: size,
      borderRadius: size / 2,
      borderWidth: size / 8,
      borderColor: `${finalColor}30`,
      borderTopColor: finalColor,
    },
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.spinner,
          {
            transform: [{ rotate: spin }],
          },
        ]}
      />
    </View>
  );
};

export default Spinner;
