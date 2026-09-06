// src/screens/onboarding.tsx
import React, { useState, useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  // TouchableOpacity,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { View, Text, Button } from '../../components';
import { useStore } from '../../store';
import { NavigationProp } from '../../navigation/Routes';
import { APP_PERSIAN_NAME } from '../../utils/constants';
// import MaterialIcon from '../../components/MaterialIcon';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingSlide {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  icon?: string;
}

const slides: OnboardingSlide[] = [
  {
    id: 1,
    title: 'یک دستیار واقعا شخصی',
    subtitle: 'دستیار مخصوص تو',
    description: `${APP_PERSIAN_NAME} با توجه به عادت‌ها و نیازهای شما، تجربه‌ای شخصی‌سازی‌شده می‌سازد؛ هر روز باهوش‌تر و دقیق‌تر.`,
    image: 'https://cdn-icons-png.flaticon.com/512/9620/9620864.png', // AI brain icon
    icon: 'OnBoarding',
  },

  {
    id: 2,
    title: 'دستورات سریع، کمک فوری',
    subtitle: 'همین حالا، همین‌جا',
    description:
      'با یک جمله یا یک لمس، کارهایت را انجام بده. سریع، ساده و بدون اتلاف وقت.',
    image: 'https://cdn-icons-png.flaticon.com/512/3094/3094840.png', // Magic wand icon
  },

  {
    id: 3,
    title: 'اطلاعات شما، پیش شما می‌ماند!!!',
    subtitle: 'حریم خصوصی واقعی',
    description:
      'پیام های حساس شخصی روی دستگاه ذخیره می شود و فقط با رمزنگاری منتقل می شود',
    image: 'https://cdn-icons-png.flaticon.com/512/36/36270.png', // Shield icon
  },
];

export default function OnBoarding() {
  const navigation = useNavigation<NavigationProp>();
  const theme = useStore(state => state.currentTheme);
  const isRTL = useStore(state => state.isRTL);
  const completeOnboarding = useStore(state => state.completeOnboarding);

  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    setCurrentIndex(index);
  };

  const handleNext = () => {
    const nextIndex = currentIndex + 1;
    if (currentIndex < slides.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: nextIndex * SCREEN_WIDTH,
        animated: true,
      });
    } else {
      handleStart();
    }
  };

  const handleSkip = () => {
    handleStart();
  };

  const handleStart = () => {
    completeOnboarding();
    navigation.navigate('Home');
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: 100,
    },
    scrollView: {
      flex: 1,
      direction: 'ltr',
    },
    slideContainer: {
      width: SCREEN_WIDTH,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.xlarge,
      paddingVertical: theme.spacing.xxlarge,
    },
    imageContainer: {
      width: SCREEN_WIDTH * 0.7,
      aspectRatio: 1,
      marginBottom: theme.spacing.xxlarge,
      justifyContent: 'center',
      alignItems: 'center',
    },
    image: {
      width: '100%',
      height: '100%',
      resizeMode: 'contain',
      tintColor: theme.colors.primary,
    },
    contentContainer: {
      flex: 1,
      gap: theme.spacing.medium,
      alignItems: 'center',
      maxWidth: 480,
    },
    title: {
      fontSize: 28,
      textAlign: 'center',
      lineHeight: 36,
    },
    subtitle: {
      textAlign: 'center',
      marginTop: theme.spacing.small,
    },
    description: {
      textAlign: 'center',
      lineHeight: 24,
      marginTop: theme.spacing.large,
      maxWidth: 400,
    },
    footer: {
      paddingHorizontal: theme.spacing.xlarge,
      paddingVertical: theme.spacing.large,
      gap: theme.spacing.large,
    },
    indicatorContainer: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: theme.spacing.medium,
      paddingVertical: theme.spacing.medium,
    },
    indicator: {
      height: 10,
      borderRadius: 5,
      backgroundColor: theme.colors.surface,
    },
    indicatorActive: {
      width: 32,
      backgroundColor: theme.colors.primary,
    },
    indicatorInactive: {
      width: 10,
    },
    buttonContainer: {
      flexDirection: isRTL ? 'row' : 'row-reverse',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: theme.spacing.large,
    },
    skipButton: {
      minWidth: 84,
      backgroundColor: 'transparent',
    },
    nextButton: {
      flex: 1,
      maxWidth: 480,
      elevation: 8,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    startButton: {
      flex: 1,
      maxWidth: 480,
      elevation: 8,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
  });

  return (
    <View style={styles.container}>
      {/* Main Content - Carousel */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
        // contentContainerStyle={{ flexDirection: 'row-reverse' }}
      >
        {slides.map(slide => (
          <View key={slide.id} style={styles.slideContainer}>
            {/* Image */}
            <View style={styles.imageContainer}>
              {/* <MaterialIcon
                name="female_assistant"
                size={300}
                color={theme.colors.primary}
              /> */}
              <Image source={{ uri: slide.image }} style={styles.image} />
            </View>

            {/* Content */}
            <View style={styles.contentContainer}>
              <Text variant="h2" color="primary" style={styles.title}>
                {slide.title}
              </Text>
              {/* <Text variant="body" color="secondary" style={styles.subtitle}>
                {slide.subtitle}
              </Text> */}
              <Text variant="body" color="secondary" style={styles.description}>
                {slide.description}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        {/* Page Indicators */}
        <View style={styles.indicatorContainer}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                index === currentIndex
                  ? styles.indicatorActive
                  : styles.indicatorInactive,
              ]}
            />
          ))}
        </View>

        {/* Buttons */}
        {currentIndex < slides.length - 1 ? (
          <View style={styles.buttonContainer}>
            <Button
              title="پرش"
              variant="text"
              onPress={handleSkip}
              style={styles.skipButton}
            />
            <Button
              title="بعدی"
              variant="primary"
              size="large"
              onPress={handleNext}
              style={styles.nextButton}
            />
          </View>
        ) : (
          <View style={styles.buttonContainer}>
            <Button
              title={`شروع ${APP_PERSIAN_NAME}`}
              variant="primary"
              size="large"
              onPress={handleStart}
              style={styles.startButton}
            />
          </View>
        )}
      </View>
    </View>
  );
}
