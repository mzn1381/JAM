// src/screens/home.tsx
import React from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { View, Text, Button } from '../../components';
import { useCreateMessageDirectly, useStore } from '../../store';
import { NavigationProp } from '../../navigation/Routes';
import { colors } from '../../theme';
import MaterialIcon from '../../components/MaterialIcon';
import { APP_PERSIAN_NAME } from '../../utils/constants';
import Toast from 'react-native-toast-message';
import * as Sentry from '@sentry/react-native';

interface QuickAction {
  icon: string;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
  initialPrompt: string;
}

export default function Home() {
  const navigation = useNavigation<NavigationProp>();
  const theme = useStore(state => state.currentTheme);
  const isRTL = useStore(state => state.isRTL);

  // This line is to fix the issue of text alignment in RTL mode for web platform
  const align = (Platform.OS === 'web') === isRTL ? 'right' : 'left';

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    iconButton: {
      display: 'flex',
      justifyContent: 'space-between',
      flexDirection: 'row',
    },
    privacyBadge: {
      paddingHorizontal: theme.spacing.large,
      paddingVertical: theme.spacing.xsmall,
      textAlign: 'center',
    },
    privacyText: {
      color: theme.colors.success,
      textAlign: 'center',
    },
    content: {
      paddingHorizontal: theme.spacing.large,
    },
    sectionTitle: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: theme.spacing.large,
      marginBottom: theme.spacing.small,
      textAlign: isRTL ? 'left' : 'right',
    },
    viewAllTasksButton: {
      flexDirection: isRTL ? 'row' : 'row-reverse',
      alignItems: 'center',
      gap: theme.spacing.xsmall,
      paddingVertical: theme.spacing.xsmall,
      paddingHorizontal: theme.spacing.small,
      borderRadius: theme.borderRadius.small,
    },
    chipsContainer: {
      flexDirection: isRTL ? 'row' : 'row-reverse',
      gap: theme.spacing.medium,
      marginBottom: theme.spacing.medium,
    },
    chip: {
      flexDirection: isRTL ? 'row' : 'row-reverse',
      alignItems: 'center',
      gap: theme.spacing.small,
      paddingHorizontal: theme.spacing.large,
      paddingVertical: theme.spacing.small,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
    },
    chipText: {
      color: theme.colors.textPrimary,
      fontFamily: theme.typography.fontFamily,
      fontWeight: '500',
    },
    taskCard: {
      flexDirection: isRTL ? 'row' : 'row-reverse',
      alignItems: 'center',
      gap: theme.spacing.large,
      padding: theme.spacing.large,
      borderRadius: theme.borderRadius.medium,
      backgroundColor: theme.colors.surface,
      marginBottom: theme.spacing.medium,
    },
    taskIcon: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 20,
    },
    taskContent: {
      backgroundColor: '#00000001', //Set a full transparent color for a ui error!!
      flex: 1,
    },
    taskTitle: {
      textAlign: align,
    },
    taskSubtitle: {
      fontSize: 12,
      marginTop: 2,
      textAlign: align,
    },
    fab: {
      position: 'absolute',
      bottom: 96,
      [isRTL ? 'right' : 'left']: theme.spacing.large,
      flexDirection: isRTL ? 'row' : 'row-reverse',
      alignItems: 'center',
      gap: theme.spacing.medium,
      paddingVertical: theme.spacing.medium,
      paddingHorizontal: theme.spacing.large,
      borderRadius: 28,
      backgroundColor: theme.colors.primary,
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },

    bottomBar: {
      position: 'absolute',
      bottom: 4,
      left: 0,
      right: 0,
      flexDirection: isRTL ? 'row' : 'row-reverse',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.large,
      paddingHorizontal: theme.spacing.large,
      paddingVertical: theme.spacing.medium,
      backgroundColor: `${theme.colors.background}EE`,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },

    inputContainer: {
      flex: 1,
      height: 48,
      flexDirection: isRTL ? 'row' : 'row-reverse',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.large,
      borderRadius: 24,
      backgroundColor: theme.colors.inputColor,
    },
    inputText: {
      textAlign: isRTL ? 'right' : 'left',
    },
    fabText: {
      color: colors.dark.textPrimary,
    },
    micButton: {
      width: 48,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 24,
      backgroundColor: theme.colors.primary,
    },
  });

  // Quick Actions configuration
  const quickActions = [
    {
      icon: 'bigIcons',
      iconBg: `${theme.colors.primary}33`,
      iconColor: theme.colors.primary,
      title: 'استعلام قبض برق',
      subtitle: 'پرسیدن درباره قبض برق',
      initialPrompt: 'آیا میتونی استعلام قبض برق بگیری؟',
    },
    {
      icon: 'infoIcon',
      iconBg: '#10b98133',
      iconColor: '#10b981',
      title: 'درباره پیشکار',
      subtitle: 'آشنایی با قابلیت‌های پیشکار',
      initialPrompt: 'کی هستی؟ چه کارهایی میتونی بکنی؟',
    },
    {
      icon: 'event_upcoming',
      iconBg: '#fbbf2433',
      iconColor: '#fbbf24',
      title: 'نوبت دکتر',
      subtitle: 'رزرو وقت پزشک',
      initialPrompt: 'آیا میتونی نوبت دکتر بگیری؟',
    },
    {
      icon: 'alarm',
      iconBg: '#8b5cf633',
      iconColor: '#8b5cf6',
      title: 'تنظیم آلارم',
      subtitle: 'ساخت یادآوری جدید',
      initialPrompt: 'میتونی یک آلارم ست کنی؟',
    },
    {
      icon: 'sendEmail',
      iconBg: '#ec489933',
      iconColor: '#ec4899',
      title: 'ارسال ایمیل',
      subtitle: 'نوشتن و ارسال ایمیل',
      initialPrompt: 'یک ایمیل برام بزن',
    },
  ];
  const createMessageDirectly = useCreateMessageDirectly();

  const handelCreateMessageDirectly = () => {
    const taskId = createMessageDirectly();
    if (taskId && taskId !== '0') {
      navigation.navigate('Chat', {
        taskId: taskId,
      });
    } else {
      Toast.show({
        type: 'error',
        text1: 'مشگلی در ایجاد تسک',
        text2: 'لطفا با راهبر سامانه تماس بگیرید!',
        autoHide: false,
      });
    }
  };

  const handleQuickAction = (initialPrompt: string) => {
    const taskId = createMessageDirectly();
    if (taskId && taskId !== '0') {
      navigation.navigate('Chat', {
        taskId: taskId,
        initialPrompt: initialPrompt,
      });
    } else {
      Toast.show({
        type: 'error',
        text1: 'مشگلی در ایجاد تسک',
        text2: 'لطفا با راهبر سامانه تماس بگیرید!',
        autoHide: false,
      });
    }
  };
  return (
    <View style={styles.container}>
      {/* Privacy Badge */}
      <View style={styles.privacyBadge}>
        <Text variant="x_small" style={styles.privacyText}>
          داده‌ها فقط روی دستگاه ذخیره می‌شوند
        </Text>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Quick Actions Section */}
        <View style={[styles.sectionTitle]}>
          <Text variant="h5" color="secondary">
            پیشنهادهای شروع سریع
          </Text>

          <TouchableOpacity
            style={styles.viewAllTasksButton}
            onPress={() => navigation.navigate('TaskList')}
            activeOpacity={0.6}
          >
            <MaterialIcon
              name="filter_list"
              size={12}
              color={theme.colors.textSecondary}
            />
            <Text variant="x_small" color="secondary">
              همه کارها
            </Text>
          </TouchableOpacity>
        </View>

        {quickActions.map((action, index) => (
          <TouchableOpacity
            key={index}
            style={styles.taskCard}
            onPress={() => handleQuickAction(action.initialPrompt)}
          >
            <View style={[styles.taskIcon, { backgroundColor: action.iconBg }]}>
              <MaterialIcon
                name={action.icon}
                size={24}
                color={action.iconColor}
              />
            </View>

            <View variant="surface" style={styles.taskContent}>
              <Text variant="small" color="primary" style={styles.taskTitle}>
                {action.title}
              </Text>
              <Text
                variant="xx_small"
                color="secondary"
                style={styles.taskSubtitle}
              >
                {action.subtitle}
              </Text>
            </View>

            <MaterialIcon
              name="arrow_forward"
              size={24}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => handelCreateMessageDirectly()}
      >
        <MaterialIcon
          name="auto_awesome"
          size={24}
          color={theme.colors.onPrimary}
        />
        <Text variant="small" style={styles.fabText}>
          از {APP_PERSIAN_NAME} بپرس
        </Text>
      </TouchableOpacity>

      {/* Bottom Input Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.micButton}
          onPress={() => handelCreateMessageDirectly()}
        >
          <MaterialIcon name="send" size={24} color={theme.colors.onPrimary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.inputContainer}
          onPress={() => handelCreateMessageDirectly()}
        >
          <Text variant="body" color="secondary" style={styles.inputText}>
            {/* صحبت کن یا بنویس... */}پیام خود را بنویسید...
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
