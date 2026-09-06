import React, { useCallback, useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { View } from '../../../components';

const WAVE_SEGMENT_WIDTH = 240;
const WAVE_VIEWBOX_HEIGHT = 64;

const createWavePath = (
  amplitude: number,
  frequency: number,
  phase: number,
) => {
  const points: string[] = [];
  for (let x = 0; x <= WAVE_SEGMENT_WIDTH * 2; x += 4) {
    const segmentX = x % WAVE_SEGMENT_WIDTH;
    const normalizedX = (segmentX / WAVE_SEGMENT_WIDTH) * Math.PI * 2;
    const envelope = Math.sin((segmentX / WAVE_SEGMENT_WIDTH) * Math.PI);
    const y =
      WAVE_VIEWBOX_HEIGHT / 2 +
      Math.sin(normalizedX * frequency + phase) * amplitude * envelope +
      Math.sin(normalizedX * (frequency + 1.5) - phase) * amplitude * 0.32;
    points.push(`${x === 0 ? 'M' : 'L'} ${x} ${y.toFixed(2)}`);
  }
  return points.join(' ');
};

const WAVE_PATHS = [
  createWavePath(13, 2.3, 0),
  createWavePath(9, 3.1, Math.PI / 2),
  createWavePath(6, 1.7, Math.PI),
];

const VoiceVisualization = (
  props: import('../../../types/Chat').VoiceVisualizationProps,
) => {
  const { active, color, backgroundColor } = props;
  const phase = useRef(new Animated.Value(0)).current;
  const amplitude = useRef(new Animated.Value(0)).current;
  const phaseAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const amplitudeAnimationRef = useRef<Animated.CompositeAnimation | null>(
    null,
  );
  const isAnimatingRef = useRef(false);

  const stopAnimation = useCallback(() => {
    if (
      !isAnimatingRef.current &&
      !phaseAnimationRef.current &&
      !amplitudeAnimationRef.current
    ) {
      return;
    }

    phaseAnimationRef.current?.stop();
    amplitudeAnimationRef.current?.stop();
    phaseAnimationRef.current = null;
    amplitudeAnimationRef.current = null;
    isAnimatingRef.current = false;
    phase.stopAnimation();
    amplitude.stopAnimation();
  }, [amplitude, phase]);

  const startAnimation = useCallback(() => {
    if (isAnimatingRef.current) return;

    stopAnimation();
    phase.setValue(0);
    amplitude.setValue(0);

    const phaseAnimation = Animated.loop(
      Animated.timing(phase, {
        toValue: 1,
        duration: 2200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      { iterations: -1 },
    );
    const amplitudeAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(amplitude, {
          toValue: 1,
          duration: 460,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(amplitude, {
          toValue: 0,
          duration: 620,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
      { iterations: -1 },
    );

    phaseAnimationRef.current = phaseAnimation;
    amplitudeAnimationRef.current = amplitudeAnimation;
    isAnimatingRef.current = true;
    phaseAnimation.start();
    amplitudeAnimation.start();
  }, [amplitude, phase, stopAnimation]);

  useEffect(() => {
    if (active) {
      startAnimation();
    } else {
      stopAnimation();
    }
  }, [active, startAnimation, stopAnimation]);

  useEffect(() => stopAnimation, [stopAnimation]);

  const translateX = phase.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -WAVE_SEGMENT_WIDTH],
  });
  const scaleY = amplitude.interpolate({
    inputRange: [0, 1],
    outputRange: [0.72, 1],
  });

  return (
    <View
      style={[visualizationStyles.container, { backgroundColor }]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={active ? 'نمایش زنده صدا' : 'نمایش صدا متوقف شده'}
    >
      <View
        style={[visualizationStyles.centerLine, { backgroundColor: color }]}
      />
      <Animated.View
        style={[
          visualizationStyles.waveTrack,
          { transform: [{ translateX }, { scaleY }] },
        ]}
      >
        <Svg
          width={WAVE_SEGMENT_WIDTH * 2}
          height="100%"
          viewBox={`0 0 ${WAVE_SEGMENT_WIDTH * 2} ${WAVE_VIEWBOX_HEIGHT}`}
          preserveAspectRatio="none"
        >
          <Path
            d={WAVE_PATHS[0]}
            stroke={color}
            strokeWidth={8}
            opacity={0.1}
            fill="none"
          />
          <Path
            d={WAVE_PATHS[0]}
            stroke={color}
            strokeWidth={2.4}
            opacity={0.95}
            fill="none"
          />
          <Path
            d={WAVE_PATHS[1]}
            stroke={color}
            strokeWidth={1.5}
            opacity={0.58}
            fill="none"
          />
          <Path
            d={WAVE_PATHS[2]}
            stroke={color}
            strokeWidth={1}
            opacity={0.34}
            fill="none"
          />
        </Svg>
      </Animated.View>
    </View>
  );
};

const visualizationStyles = StyleSheet.create({
  container: {
    flex: 1,
    height: 64,
    minWidth: 72,
    maxWidth: 420,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 179, 166, 0.34)',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  centerLine: {
    position: 'absolute',
    left: 10,
    right: 10,
    height: 1,
    opacity: 0.12,
  },
  waveTrack: {
    width: WAVE_SEGMENT_WIDTH * 2,
    height: '100%',
  },
});
export default VoiceVisualization;
