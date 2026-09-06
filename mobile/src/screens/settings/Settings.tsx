// src/screens/settings.tsx
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Modal,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { View, Text, Button } from '../../components';
import { useStore } from '../../store';
import { NavigationProp } from '../../navigation/Routes';
import MaterialIcon from '../../components/MaterialIcon';
import { APP_PERSIAN_NAME } from '../../utils/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLogout } from '../../services/APIs/auth/useLogout';
import { AuthContext } from '../../common/providers/AuthProvider';
import { AvatarSelectorModal } from '../../common/commonUI/AvatarSelectorModal';

interface SettingsItem {
  id: string;
  icon: string;
  title: string;
  type: 'navigation' | 'toggle' | 'button' | 'info';
  iconColor?: string;
  iconSize?: number;
  iconBg?: string;
  value?: boolean | string;
  onPress?: () => void;
  buttonText?: string;
  buttonColor?: string;
  isHidden?: boolean;
}

interface SettingsSection {
  title: string;
  items: SettingsItem[];
}

const INITIAL_DELETE_COUNTDOWN = 7;

export default function Settings() {
  const navigation = useNavigation<NavigationProp>();
  const { checkAuth, isLoading: isLoadingUser } = useContext(AuthContext);

  const theme = useStore(state => state.currentTheme);
  const isRTL = useStore(state => state.isRTL);
  const themeMode = useStore(state => state.themeMode);
  const setThemeMode = useStore(state => state.setThemeMode);
  const activeBiometric = useStore(state => state.activeBiometric);
  // const isLockEnabled = useStore(state => state.isLockEnabled);
  const isAuthenticated = useStore(state => state.isAuthenticated);
  const user = useStore(state => state.user);
  const pishkarAvatar = useStore(state => state.pishkarAvatar);

  const setLoginModalVisibility = useStore(
    state => state.setLoginModalVisibility,
  );
  const { mutate: apiLogout, isPending: isLogoutPending } = useLogout();

  // activeBiometric
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(themeMode === 'dark');
  const [isLargeText, setIsLargeText] = useState(false);
  const [deleteCountdown, setDeleteCountdown] = useState<number>(
    INITIAL_DELETE_COUNTDOWN,
  );
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [avatarProfileType, setAvatarProfileType] = useState<
    'user' | 'pishkar'
  >('pishkar');

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const toggleDarkMode = (value: boolean) => {
    setIsDarkMode(value);
    setThemeMode(value ? 'dark' : 'light');
  };

  const handleDeleteData = () => {
    setShowDeleteModal(true);
    setDeleteCountdown(INITIAL_DELETE_COUNTDOWN);
  };

  const confirmDeleteData = () => {
    setShowDeleteModal(false);
    AsyncStorage.clear();
    Alert.alert('موفق', 'داده‌های محلی پاک شدند');
  };

  const onRefresh = useCallback(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (showDeleteModal) {
      intervalRef.current = setInterval(() => {
        setDeleteCountdown(prev => {
          if (prev <= 1) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [showDeleteModal]);

  const sections: SettingsSection[] = [
    {
      title: 'حساب کاربری',
      items: [
        {
          id: 'user_avatar',
          icon: 'account_circle',
          title: 'تصویر پروفایل من',
          type: 'navigation',
          iconColor: theme.colors.primary,
          iconBg: `${theme.colors.primary}33`,
          onPress: () => {
            setAvatarProfileType('user');
            setAvatarModalVisible(true);
          },
          isHidden: !isAuthenticated,
        },
        {
          id: 'pishkar_avatar',
          icon: 'smart_toy',
          title: 'تصویر نمایه دستیار',
          type: 'navigation',
          iconColor: theme.colors.primary,
          iconBg: `${theme.colors.primary}33`,
          onPress: () => {
            setAvatarProfileType('pishkar');
            setAvatarModalVisible(true);
          },
        },
        {
          id: 'profile',
          icon: 'person',
          title: 'نام و اطلاعات کاربری',
          type: 'navigation',
          iconColor: theme.colors.primary,
          iconBg: `${theme.colors.primary}33`,
          onPress: () => {},
          isHidden: !isAuthenticated,
        },
        {
          id: 'login',
          icon: 'lock',
          title: 'ورود به حساب کاربری',
          type: 'navigation',
          iconSize: 25,
          iconColor: theme.colors.primary,
          iconBg: `${theme.colors.primary}33`,
          onPress: () => {
            setLoginModalVisibility(true);
          },
          isHidden: isAuthenticated,
        },
        {
          id: 'logout',
          icon: 'lock',
          title: 'خروج',
          type: 'navigation',
          iconSize: 25,
          iconColor: theme.colors.primary,
          iconBg: '#ff3b3033',
          onPress: () => {
            setShowLogoutModal(true);
          },
          isHidden: !isAuthenticated,
        },
      ],
    },
    {
      title: 'حریم خصوصی و داده‌ها',
      items: [
        {
          id: 'delete',
          icon: 'delete',
          title: 'پاک کردن داده‌های محلی',
          type: 'button',
          iconColor: theme.colors.error,
          iconBg: '#ff3b3033',
          buttonText: 'پاک کردن',
          buttonColor: theme.colors.error,
          onPress: handleDeleteData,
        },
        {
          id: 'permissions',
          icon: 'shield_key',
          title: 'مدیریت مجوزها',
          type: 'navigation',
          iconSize: 28,
          iconColor: theme.colors.primary,
          iconBg: `${theme.colors.primary}33`,
          onPress: () => {
            navigation.navigate('PermissionsManager');
          },
        },
        {
          id: 'preferencesSelection',
          icon: 'auto_awesome',
          title: 'مدیریت علاقه مندی ها',
          type: 'navigation',
          iconSize: 22,
          iconColor: theme.colors.primary,
          iconBg: `${theme.colors.primary}33`,
          onPress: () => {
            navigation.navigate('PreferencesSelection');
          },
        },
      ],
    },

    // {
    //   title: 'صدا و لحن دستیار',
    //   items: [
    //     {
    //       id: 'voice',
    //       icon: 'record_voice_over',
    //       title: 'انتخاب صدا',
    //       type: 'navigation',
    //       iconColor: theme.colors.primary,
    //       iconBg: `${theme.colors.primary}33`,
    //       onPress: () => {},
    //     },
    //     {
    //       id: 'speed',
    //       icon: 'speed',
    //       title: 'سرعت گفتار',
    //       type: 'navigation',
    //       iconColor: theme.colors.primary,
    //       iconBg: `${theme.colors.primary}33`,
    //       onPress: () => {},
    //     },
    //   ],
    // },
    {
      title: 'ظاهر',
      items: [
        {
          id: 'dark_mode',
          icon: 'dark_mode',
          title: 'حالت تاریک',
          type: 'toggle',
          iconColor: theme.colors.primary,
          iconBg: `${theme.colors.primary}33`,
          value: isDarkMode,
        },
        {
          id: 'large_text',
          icon: 'format_size',
          title: 'بزرگ‌نمایی متن',
          type: 'toggle',
          iconColor: theme.colors.primary,
          iconBg: `${theme.colors.primary}33`,
          value: isLargeText,
        },
      ],
    },
    {
      title: 'تنظیمات عمومی',
      items: [
        {
          id: 'bug_logger',
          icon: 'bug',
          title: 'ترمینال لاگ ها',
          type: 'navigation',
          iconColor: theme.colors.primary,
          iconBg: `${theme.colors.primary}33`,
          onPress: () => {
            navigation.navigate('TerminalLogger');
          },
        },
      ],
    },
    {
      title: 'درباره ما',
      items: [
        {
          id: 'version',
          icon: 'info',
          title: 'نسخه برنامه',
          type: 'info',
          iconColor: theme.colors.primary,
          iconBg: `${theme.colors.primary}33`,
          value: '1.0.0',
        },
        {
          id: 'terms',
          icon: 'gavel',
          title: 'شرایط خدمات',
          type: 'navigation',
          iconColor: theme.colors.primary,
          iconBg: `${theme.colors.primary}33`,
          onPress: () => {},
        },
        {
          id: 'privacy',
          icon: 'privacy_tip',
          title: 'سیاست حفظ حریم خصوصی',
          type: 'navigation',
          iconColor: theme.colors.primary,
          iconBg: `${theme.colors.primary}33`,
          onPress: () => {},
        },
      ],
    },
  ];
  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      // flex: 1,
      paddingHorizontal: theme.spacing.large,
    },
    sectionTitle: {
      paddingHorizontal: theme.spacing.large,
      paddingTop: theme.spacing.xlarge,
      paddingBottom: theme.spacing.small,
      textAlign: isRTL ? 'left' : 'right',
    },
    settingsItem: {
      flexDirection: isRTL ? 'row' : 'row-reverse',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.small,
      paddingHorizontal: theme.spacing.large,
      minHeight: 56,
      borderRadius: theme.borderRadius.small,
    },
    settingsLeft: {
      flexDirection: isRTL ? 'row' : 'row-reverse',
      alignItems: 'center',
      gap: theme.spacing.large,
      flex: 1,
    },
    iconContainer: {
      width: 42,
      height: 42,
      borderRadius: theme.borderRadius.small,
      alignItems: 'center',
      justifyContent: 'center',
    },
    itemTitle: {
      flex: 1,
      textAlign: isRTL ? 'left' : 'right',
    },
    itemRight: {
      flexDirection: isRTL ? 'row' : 'row-reverse',
      alignItems: 'center',
    },
    chevron: {
      width: 28,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonText: {
      paddingHorizontal: theme.spacing.medium,
      paddingVertical: 6,
      borderRadius: 6,
    },
    versionText: {},
    footer: {
      paddingHorizontal: theme.spacing.large,
      paddingVertical: theme.spacing.xxlarge,
      alignItems: 'center',
    },
    footerText: {
      textAlign: 'center',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xlarge,
    },
    modalContent: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.medium,
      padding: theme.spacing.xlarge,
      width: '100%',
      maxWidth: 400,
      alignItems: 'center',
      gap: theme.spacing.medium,
    },
    modalIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: '#ff3b3033',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.small,
    },
    modalTitle: {
      textAlign: 'center',
    },
    modalSubTitle: {
      textAlign: 'center',
      paddingStart: 4,
      marginBottom: theme.spacing.large,
    },

    modalDescription: {
      marginBottom: theme.spacing.medium,
      textAlign: 'center',
    },
    modalButtons: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      gap: theme.spacing.medium,
      width: '100%',
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.3)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 999,
    },
    avatarPreview: {
      width: 36,
      height: 36,
      borderRadius: 18,
      marginHorizontal: theme.spacing.small,
      borderWidth: 2,
      borderColor: theme.colors.border,
    },
  });

  const renderSettingsItem = (item: SettingsItem) => {
    const showAvatarPreview =
      item.id === 'user_avatar' || item.id === 'pishkar_avatar';
    const avatarUri =
      item.id === 'user_avatar'
        ? user?.avatar || 'https://i.pravatar.cc/150?img=12'
        : pishkarAvatar;

    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.settingsItem,
          { display: item.isHidden ? 'none' : 'flex' },
        ]}
        onPress={item.onPress}
        disabled={item.type === 'toggle' || item.type === 'info'}
        activeOpacity={item.type === 'navigation' ? 0.7 : 1}
      >
        <View style={styles.settingsLeft}>
          <View
            style={[styles.iconContainer, { backgroundColor: item.iconBg }]}
          >
            <MaterialIcon
              name={item.icon}
              size={item.iconSize ?? 22}
              color={item.iconColor}
            />
          </View>
          <Text variant="small" style={styles.itemTitle}>
            {item.title}
          </Text>
        </View>

        <View style={styles.itemRight}>
          {showAvatarPreview && (
            <Image source={{ uri: avatarUri }} style={styles.avatarPreview} />
          )}

          {item.type === 'navigation' && (
            <View style={styles.chevron}>
              <MaterialIcon
                name="chevron_left"
                size={20}
                color={theme.colors.textSecondary}
              />
            </View>
          )}

          {item.type === 'toggle' && (
            <Switch
              value={item.value as boolean}
              onValueChange={value => {
                if (item.id === 'dark_mode') {
                  toggleDarkMode(value);
                } else if (item.id === 'large_text') {
                  setIsLargeText(value);
                } else if (item.id === 'active_fingerprint') {
                  activeBiometric(value);
                }
              }}
              trackColor={{
                false: theme.colors.surface,
                true: theme.colors.primary,
              }}
              thumbColor={theme.colors.onPrimary}
            />
          )}

          {item.type === 'button' && (
            <TouchableOpacity onPress={item.onPress}>
              <Text
                variant="small"
                style={[styles.buttonText, { color: item?.buttonColor }]}
              >
                {item.buttonText}
              </Text>
            </TouchableOpacity>
          )}

          {item.type === 'info' && (
            <Text
              variant="x_small"
              color="secondary"
              style={styles.versionText}
            >
              {item.value as string}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {isLogoutPending ||
        (isLoadingUser && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={theme.colors.textPrimary} />
          </View>
        ))}
      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={isLoadingUser} onRefresh={onRefresh} />
        }
      >
        {sections.map((section, index) => (
          <View key={index}>
            <Text
              variant="x_small"
              color="secondary"
              style={styles.sectionTitle}
            >
              {section.title}
            </Text>
            {section.items.map(renderSettingsItem)}
          </View>
        ))}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text variant="x_small" color="secondary" style={styles.footerText}>
          داده‌ها فقط روی دستگاه ذخیره می‌شوند
        </Text>
      </View>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDeleteModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={e => e.stopPropagation()}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalIcon}>
                <MaterialIcon
                  name="delete_forever"
                  size={32}
                  color={theme.colors.error}
                />
              </View>

              <Text variant="h3" style={styles.modalTitle}>
                حذف همه‌ی داده‌های محلی !
              </Text>
              <Text
                variant="small"
                color="secondary"
                style={styles.modalDescription}
              >
                {`با حذف داده‌های محلی، تمام اطلاعات شخصی، تنظیمات، تاریخچه‌ی کارها و مدل شخصی‌سازی‌شده‌ی ${APP_PERSIAN_NAME} برای همیشه پاک می‌شود.`}
              </Text>
              <Text
                variant="small"
                color="secondary"
                style={styles.modalDescription}
              >
                {`این کار قابل بازگردانی نیست و ممکن است تجربه‌ی شما با ${APP_PERSIAN_NAME} تا مدتی کاهش دقت پیدا کند. اگر قبل از حذف می‌خواهید نسخه‌ای از داده‌های خود داشته باشید، می‌توانید از بخش تنظیمات → «پشتیبان‌گیری» یک فایل رمزنگاری‌شده روی دستگاه یا فضای ابری دلخواه ذخیره کنید.`}
              </Text>

              <Text variant="h5" style={styles.modalSubTitle}>
                {'آیا مطمئن هستید که می‌خواهید ادامه دهید؟'}
              </Text>

              <View variant="surface" style={styles.modalButtons}>
                <Button
                  title="انصراف"
                  variant="text"
                  size="medium"
                  onPress={() => setShowDeleteModal(false)}
                  style={{ flex: 1 }}
                />
                <Button
                  title={`حذف (${deleteCountdown})`}
                  disabled={deleteCountdown === 0 ? false : true}
                  variant="primary"
                  size="medium"
                  onPress={confirmDeleteData}
                  style={{ flex: 1, backgroundColor: theme.colors.error }}
                />
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLogoutModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={e => e.stopPropagation()}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalIcon}>
                <MaterialIcon
                  name="notification_important"
                  size={32}
                  color={theme.colors.error}
                />
              </View>

              <Text variant="h3" style={styles.modalTitle}>
                خروج از حساب کاربری
              </Text>

              <Text
                variant="small"
                color="secondary"
                style={styles.modalDescription}
              >
                آیا مطمئن هستید که می‌خواهید از حساب خود خارج شوید؟
              </Text>

              <View style={styles.modalButtons}>
                <Button
                  title="انصراف"
                  variant="text"
                  size="medium"
                  onPress={() => setShowLogoutModal(false)}
                  style={{ flex: 1 }}
                />

                <Button
                  title="خروج"
                  variant="primary"
                  size="medium"
                  onPress={() =>
                    apiLogout(undefined, {
                      onSuccess: () => {
                        setShowLogoutModal(false);
                      },
                    })
                  }
                  style={{ flex: 1, backgroundColor: theme.colors.error }}
                />
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Avatar Selector Modal */}
      <AvatarSelectorModal
        visible={avatarModalVisible}
        onClose={() => setAvatarModalVisible(false)}
        profileType={avatarProfileType}
      />
    </View>
  );
}
