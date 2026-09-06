// src/screens/permissionsManager.tsx
import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { View, Text } from '../../components';
import { Logger, useStore } from '../../store';
import { NavigationProp } from '../../navigation/Routes';
import MaterialIcon from '../../components/MaterialIcon';
import { APP_PERSIAN_NAME } from '../../utils/constants';
import {
  PermissionAction,
  PermissionManager,
} from '../../actions/PermissionManager';
import { makeCallWithLinking } from '../../actions/tools/call';
import { sendSMSWithLinking } from '../../actions/tools/SMS';
import { sendEmailWithLinking } from '../../actions/tools/email';

import { setAlarm } from '../../actions/tools/alarm';
import { addCalendarEvent } from '../../actions/tools/calendar';
import Toast from 'react-native-toast-message';
import { runCalendarTests } from '../../actions/test/testCases';
import { getAll } from '../../actions/tools/contact';
// import { runCalendarTests } from '../../actions/test/testCases';
// import { addMeetingToCalendar } from '../../actions/tools/calendar';

interface Permission {
  id: string;
  icon: string;
  title: string;
  description: string;
  granted: boolean;
  onPress?: () => void;
}

export default function PermissionsManager() {
  const theme = useStore(state => state.currentTheme);
  const isRTL = useStore(state => state.isRTL);

  const [permissions, setPermissions] = useState<Permission[]>([
    {
      id: 'microphone',
      icon: 'mic',
      title: 'دسترسی به ارسال پیام',
      description: 'برای اجرای دستورات ارسال پیام',
      granted: true,
      onPress: () => handleCheckPermission('SEND_SMS'),
    },
    {
      id: 'email',
      icon: 'contacts',
      title: 'دسترسی به ایمیل',
      description: 'برای برقراری تماس و ارسال پیام',
      granted: true,
      onPress: () => handleCheckPermission('SEND_EMAIL_WITH_LINKING'),
    },
    {
      id: 'calendar',
      icon: 'calendar_month',
      title: 'دسترسی به تقویم',
      description: 'برای مدیریت رویدادها',
      granted: true,
      onPress: () => handleCheckPermission('ADD_CALENDAR_EVENT'),
    },
    {
      id: 'location',
      icon: 'location_on',
      title: 'دسترسی به تماس',
      description: 'برای برقراری تماس و ارسال پیام',
      granted: false,
      onPress: () => handleCheckPermission('MAKING_CALL'),
    },
    {
      id: 'alarm',
      icon: 'alarm',
      title: 'دسترسی به تنظیم آلارم',
      description: 'برای ست کردن یادآور با گرفتن مجوز از شما',
      granted: true,
      onPress: () => handleCheckPermission('SET_ALARM'),
    },
    {
      id: 'contacts',
      icon: 'contacts',
      title: 'دسترسی مخاطبین',
      description: 'برای دسترسی به مخاطبین دستگاه',
      granted: true,
      onPress: () => handleCheckPermission('CONTACTS'),
    },
  ]);

  const handleRevokePermission = (id: string) => {
    setPermissions(
      permissions.map(p => (p.id === id ? { ...p, granted: false } : p)),
    );
  };

  // Usage
  const handleCheckPermission = async (id: PermissionAction) => {
    const result = await PermissionManager.checkActionPermission(id);

    if (result.isGranted) {
      handelActionsTools(id);
    } else {
      const isGranted = await PermissionManager.ensurePermission(id);
      await handelActionsTools(id);
    }
  };

  const payload: any = {
    intent: 'set_calendar',
    event: {
      title: 'دفاع پایان‌نامه',
      description: 'فایل پاورپوینت فراموش نشود',
      startDate: '2026-01-05T09:00:00.000Z',
      endDate: '2026-01-05T11:00:00.000Z',
      alarms: [
        {
          minutesBefore: 15,
          method: 'popup',
        },
        {
          minutesBefore: 60,
          method: 'popup',
        },
      ],
    },
  };

  const handelActionsTools = async (id: PermissionAction) => {
    switch (id) {
      case 'SET_ALARM':
        setAlarm(8, 30, 'Wake up', false);
        break;
      case 'SEND_SMS':
        sendSMSWithLinking(
          '+989162624976',
          `سلام 
           واریز شد
        ممنونم از شما `,
        );
        break;
      case 'ADD_CALENDAR_EVENT':
        // await runCalendarTests();
        await addCalendarEvent(payload.event);
        await Toast.show({
          type: 'success',
          text1: 'رویداد با موفقیت اضافه شد',
        });
        break;
      case 'MAKING_CALL':
        makeCallWithLinking('09351234567');
        break;
      case 'SEND_EMAIL_WITH_LINKING':
        sendEmailWithLinking({
          email: 'test@example.com',
          subject: 'Hello',
          body: 'This is a test email.',
        });
        break;
      case 'CONTACTS':
        const contact = await getAll();
        Logger.info('Contacts:', { contact });
        break;

      default:
        break;
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      padding: theme.spacing.large,
      gap: theme.spacing.xlarge,
    },
    privacyBanner: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      //   alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: theme.spacing.large,
      borderRadius: theme.borderRadius.medium,
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.large,
    },
    bannerContent: {
      flex: 1,
      gap: theme.spacing.small,
    },
    bannerTitle: {
      textAlign: isRTL ? 'left' : 'right',
    },
    bannerDescription: {
      textAlign: isRTL ? 'left' : 'right',
    },
    bannerIcon: {
      width: 50,
      height: 50,
      borderRadius: theme.borderRadius.large,
      marginTop: 8,
      backgroundColor: `${theme.colors.primary}33`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    permissionsList: {
      gap: theme.spacing.medium,
    },
    permissionItem: {
      flexDirection: isRTL ? 'row' : 'row-reverse',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.large,
      //   backgroundColor: '#1a3835',
      borderRadius: theme.borderRadius.medium,
      paddingHorizontal: theme.spacing.large,
      paddingVertical: theme.spacing.small,
      minHeight: 72,
    },
    permissionLeft: {
      flexDirection: isRTL ? 'row' : 'row-reverse',
      alignItems: 'center',
      gap: theme.spacing.large,
      flex: 1,
    },
    permissionIcon: {
      width: 48,
      height: 48,
      borderRadius: theme.borderRadius.small,
      backgroundColor: `${theme.colors.primary}33`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    permissionContent: {
      flex: 1,
      gap: 4,
    },
    permissionTitle: {
      textAlign: isRTL ? 'left' : 'right',
    },
    permissionDescription: {
      textAlign: isRTL ? 'left' : 'right',
    },
    revokeButton: {},
    revokeButtonText: {
      ...theme.typography.small,
      color: theme.colors.onPrimary,
      fontFamily: theme.typography.fontFamily,
      fontWeight: '500',
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: theme.spacing.xlarge }}
      >
        <View style={styles.privacyBanner}>
          <View variant="surface" style={styles.bannerContent}>
            <Text variant="body" style={styles.bannerTitle}>
              حریم خصوصی شما اولویت ماست.
            </Text>
            <Text
              variant="small"
              color="secondary"
              style={styles.bannerDescription}
            >
              {APP_PERSIAN_NAME} تنها به مجوزهایی که شما صراحتاً اجازه دهید
              دسترسی دارد.
            </Text>
          </View>

          <View style={styles.bannerIcon}>
            <MaterialIcon
              name="shield"
              size={32}
              color={theme.colors.primary}
            />
          </View>
        </View>

        <View style={styles.permissionsList}>
          {permissions.map(permission => (
            <View
              variant="surface"
              key={permission.id}
              style={styles.permissionItem}
            >
              <View variant="surface" style={styles.permissionLeft}>
                <View style={styles.permissionIcon}>
                  <MaterialIcon
                    name={permission.icon}
                    size={24}
                    color={theme.colors.onPrimary}
                  />
                </View>

                <View variant="surface" style={styles.permissionContent}>
                  <Text variant="small" style={styles.permissionTitle}>
                    {permission.title}
                  </Text>
                  <Text
                    variant="x_small"
                    color="secondary"
                    style={styles.permissionDescription}
                  >
                    {permission.description}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.revokeButton}
                onPress={permission.onPress}
              >
                <MaterialIcon
                  name="check"
                  size={20}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>

              {permission.granted && (
                <TouchableOpacity
                  style={styles.revokeButton}
                  onPress={() => handleRevokePermission(permission.id)}
                >
                  <MaterialIcon
                    name="delete_forever"
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
