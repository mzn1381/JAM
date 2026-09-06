// src/screens/personalVault.tsx
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  // Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { View, Text, Button } from '../../components';
import { useStore } from '../../store';
import { NavigationProp } from '../../navigation/Routes';
import MaterialIcon from '../../components/MaterialIcon';
import { useFetchCurrentUser } from '../../services/APIs/user/useFetchCurrentUser';

interface AccordionSection {
  id: 'profile' | 'preferences' | 'addresses'; // | 'banking';
  title: string;
  expanded: boolean;
}

export default function PersonalVault() {
  const navigation = useNavigation<NavigationProp>();
  const theme = useStore(state => state.currentTheme);
  const isRTL = useStore(state => state.isRTL);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    birthDate: '',
    test: '',
    favColor: '',
  });

  const handleChange = (key: string, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const [sections, setSections] = useState<AccordionSection[]>([
    { id: 'profile', title: 'پروفایل شخصی', expanded: true },
    { id: 'preferences', title: 'علایق و ترجیحات', expanded: true },
    { id: 'addresses', title: 'آدرس‌های من', expanded: false },
    // { id: 'banking', title: 'اطلاعات بانکی', expanded: false },
  ]);

  const [storageOption, setStorageOption] = useState<'local' | 'cloud'>(
    'local',
  );

  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');

  const toggleSection = (id: string) => {
    setSections(
      sections.map(section =>
        section.id === id
          ? { ...section, expanded: !section.expanded }
          : section,
      ),
    );
  };

  const handleSave = () => {
    console.log('Saving encrypted data:', {
      form,
      cardNumber,
      expiryDate,
      cvv,
      storageOption,
    });
    // alert('اطلاعات به صورت امن ذخیره شد');
  };

  // const { data: users, isLoading, isError, error } = useFetchCurrentUser();
  // useEffect(() => {
  //   console.log('Fetched users:', users, isLoading, isError, error);
  // });

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      // flex: 1,
      paddingHorizontal: theme.spacing.large,
      // paddingBottom: 300,
    },
    privacyCard: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderWidth: 1,
      borderRadius: theme.borderRadius.medium,
      padding: theme.spacing.xlarge,
      marginTop: theme.spacing.large,
      alignItems: 'center',
      gap: theme.spacing.large,
    },
    privacyIcon: {
      paddingTop: 20,
      width: 60,
      height: 60,
    },
    privacyTitle: {
      textAlign: 'center',
      lineHeight: 30,
    },

    privacyButtonText: {
      ...theme.typography.small,
      color: theme.colors.onPrimary,
      fontFamily: theme.typography.fontFamily,
      fontWeight: '500',
    },
    accordionsContainer: {
      marginTop: theme.spacing.xlarge,
      gap: theme.spacing.medium,
    },
    accordion: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.medium,
      borderWidth: 1,
      borderColor: theme.colors.border,
      overflow: 'hidden',
    },
    accordionHeader: {
      flexDirection: isRTL ? 'row' : 'row-reverse',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: theme.spacing.large,
    },
    accordionTitle: {
      width: '50%',
    },
    accordionContent: {
      padding: theme.spacing.large,
      // paddingTop: 0,
      gap: theme.spacing.large,
    },
    accordionDescription: {
      marginTop: theme.spacing.large,
      textAlign: isRTL ? 'left' : 'right',
    },
    inputLabel: {
      marginBottom: theme.spacing.small,
      textAlign: isRTL ? 'left' : 'right',
    },
    input: {
      ...theme.typography.body,
      color: theme.colors.textPrimary,
      fontFamily: theme.typography.fontFamily,
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.small,
      borderWidth: 1,
      borderColor: `${theme.colors.primary}40`,
      padding: theme.spacing.large,
      textAlign: isRTL ? 'right' : 'left',
      height: 56,
    },
    inputRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      gap: theme.spacing.large,
    },
    inputHalf: {
      flex: 1,
    },
    storageSettings: {
      paddingBottom: 150,
      marginTop: theme.spacing.xlarge,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.medium,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: theme.spacing.large,
      gap: theme.spacing.large,
    },
    storageTitle: {
      textAlign: isRTL ? 'left' : 'right',
    },
    radioOption: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.small,
      padding: theme.spacing.large,
      gap: theme.spacing.large,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    radioOptionSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.inputColor,
    },
    radio: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: theme.colors.textSecondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioSelected: {
      borderColor: theme.colors.primary,
    },
    radioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: theme.colors.primary,
    },
    radioText: {
      flex: 1,
      gap: 4,
      backgroundColor: theme.colors.surface,
    },
    radioLabel: {
      textAlign: isRTL ? 'left' : 'right',
    },
    radioSubtext: {
      textAlign: isRTL ? 'left' : 'right',
    },
    bottomBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: theme.spacing.large,
      paddingBottom: theme.spacing.xlarge,
      backgroundColor: theme.colors.background,
    },
    saveButton: {
      elevation: 8,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
  });

  return (
    <View style={styles.container}>
      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Privacy Notice Card */}
        <View style={styles.privacyCard}>
          <Text style={styles.privacyIcon}>
            <MaterialIcon
              name="verified_user"
              size={50}
              color={theme.colors.primary}
            />
          </Text>

          <Text variant="h4" style={styles.privacyTitle}>
            اطلاعات شما به صورت رمزگذاری شده و فقط در دستگاه شما ذخیره می‌شود.
            ما به حریم خصوصی شما متعهدیم.
          </Text>

          <Button
            title="سیاست حفظ حریم خصوصی"
            size="small"
            variant="secondary"
          />
        </View>

        {/* Accordions */}
        <View style={styles.accordionsContainer}>
          {/* Profile */}
          <View
            style={[
              styles.accordion,
              sections.find(s => s.id === 'profile')?.expanded && {
                backgroundColor: theme.colors.inputColor,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.accordionHeader}
              onPress={() => toggleSection('profile')}
            >
              <Text variant="body" style={styles.accordionTitle}>
                پروفایل شخصی
              </Text>
              <Text
                style={{
                  transform: [
                    {
                      rotate: sections.find(s => s.id === 'profile')?.expanded
                        ? '180deg'
                        : '0deg',
                    },
                  ],
                }}
              >
                <MaterialIcon
                  name="expand_more"
                  size={24}
                  color={theme.colors.textPrimary}
                />
              </Text>
            </TouchableOpacity>
            {sections.find(s => s.id === 'profile')?.expanded && (
              <View style={styles.accordionContent}>
                <View>
                  <Text variant="small" style={styles.inputLabel}>
                    نام
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="ارشیا"
                    placeholderTextColor={theme.colors.placeholderTextColor}
                    value={form.name}
                    onChangeText={text => handleChange('name', text)}
                    keyboardType="default"
                    maxLength={30}
                  />
                </View>
                <View>
                  <Text variant="small" style={styles.inputLabel}>
                    ایمیل
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="moj@gmail.com"
                    placeholderTextColor={theme.colors.placeholderTextColor}
                    value={form.email}
                    onChangeText={text => handleChange('email', text)}
                    keyboardType="email-address"
                  />
                </View>
                <View>
                  <Text variant="small" style={styles.inputLabel}>
                    شماره موبایل
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="09123456790"
                    placeholderTextColor={theme.colors.placeholderTextColor}
                    value={form.phone}
                    onChangeText={text => handleChange('phone', text)}
                    keyboardType="number-pad"
                  />
                </View>
                <View>
                  <Text variant="small" style={styles.inputLabel}>
                    تاریخ تولد
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="۱۳۷۳/۳/۳۱"
                    placeholderTextColor={theme.colors.placeholderTextColor}
                    value={form.birthDate}
                    onChangeText={text => handleChange('birthDate', text)}
                    keyboardType="decimal-pad"
                    maxLength={10}
                  />
                </View>
                <View>
                  <Text variant="small" style={styles.inputLabel}>
                    هرچی (موقت و برای تست)
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="..."
                    placeholderTextColor={theme.colors.placeholderTextColor}
                    value={form.test}
                    onChangeText={text => handleChange('test', text)}
                    keyboardType="default"
                    maxLength={10}
                  />
                </View>
              </View>
            )}
          </View>

          {/* Preferences */}
          <View
            style={[
              styles.accordion,
              sections.find(s => s.id === 'preferences')?.expanded && {
                backgroundColor: theme.colors.inputColor,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.accordionHeader}
              onPress={() => toggleSection('preferences')}
            >
              <Text variant="body" style={styles.accordionTitle}>
                علایق و ترجیحات
              </Text>
              <Text
                style={{
                  transform: [
                    {
                      rotate: sections.find(s => s.id === 'preferences')
                        ?.expanded
                        ? '180deg'
                        : '0deg',
                    },
                  ],
                }}
              >
                <MaterialIcon
                  name="expand_more"
                  size={24}
                  color={theme.colors.textPrimary}
                />
              </Text>
            </TouchableOpacity>
            {sections.find(s => s.id === 'preferences')?.expanded && (
              <View style={styles.accordionContent}>
                <View>
                  <Text variant="small" style={styles.inputLabel}>
                    رنگ مورد علاقه
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="صورتی"
                    placeholderTextColor={theme.colors.placeholderTextColor}
                    value={form.favColor}
                    onChangeText={text => handleChange('favColor', text)}
                    keyboardType="default"
                    maxLength={10}
                  />
                </View>
              </View>
            )}
          </View>

          {/* Addresses */}
          <View
            style={[
              styles.accordion,
              sections.find(s => s.id === 'addresses')?.expanded && {
                backgroundColor: theme.colors.inputColor,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.accordionHeader}
              onPress={() => toggleSection('addresses')}
            >
              <Text variant="body" style={styles.accordionTitle}>
                آدرس های من
              </Text>
              <Text
                style={{
                  transform: [
                    {
                      rotate: sections.find(s => s.id === 'addresses')?.expanded
                        ? '180deg'
                        : '0deg',
                    },
                  ],
                }}
              >
                <MaterialIcon
                  name="expand_more"
                  size={24}
                  color={theme.colors.textPrimary}
                />
              </Text>
            </TouchableOpacity>
            {sections.find(s => s.id === 'addresses')?.expanded && (
              <View variant="surface" style={styles.accordionContent}>
                <Text
                  variant="x_small"
                  color="secondary"
                  style={styles.accordionDescription}
                >
                  در اینجا فیلدهای ورودی برای آدرس‌ها نمایش داده خواهد شد.
                </Text>
              </View>
            )}
          </View>

          {/* Banking Info */}
          {/* <View
            style={[
              styles.accordion,
              sections.find(s => s.id === 'banking')?.expanded && {
                backgroundColor: theme.colors.inputColor,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.accordionHeader}
              onPress={() => toggleSection('banking')}
            >
              <Text style={styles.accordionTitle}>اطلاعات بانکی</Text>
              <Text
                style={{
                  transform: [
                    {
                      rotate: sections.find(s => s.id === 'banking')?.expanded
                        ? '180deg'
                        : '0deg',
                    },
                  ],
                }}
              >
                <MaterialIcon
                  name="expand_more"
                  size={24}
                  color={theme.colors.textPrimary}
                />
              </Text>
            </TouchableOpacity>
            {sections.find(s => s.id === 'banking')?.expanded && (
              <View style={styles.accordionContent}>
                <View>
                  <Text variant="small" style={styles.inputLabel}>
                    شماره کارت
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="xxxx-xxxx-xxxx-xxxx"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={cardNumber}
                    onChangeText={setCardNumber}
                    keyboardType="number-pad"
                    maxLength={19}
                  />
                </View>

                <View style={styles.inputRow}>
                  <View style={styles.inputHalf}>
                    <Text variant="x_small" style={styles.inputLabel}>
                      تاریخ انقضا (YY/MM)
                    </Text>
                    <TextInput
                      style={styles.input}
                      placeholder="۰۴/۰۲"
                      placeholderTextColor={theme.colors.textSecondary}
                      value={expiryDate}
                      onChangeText={setExpiryDate}
                      keyboardType="number-pad"
                      maxLength={5}
                    />
                  </View>

                  <View style={styles.inputHalf}>
                    <Text style={styles.inputLabel}>CVV2</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="۱۲۳"
                      placeholderTextColor={theme.colors.textSecondary}
                      value={cvv}
                      onChangeText={setCvv}
                      keyboardType="number-pad"
                      maxLength={4}
                      secureTextEntry
                    />
                  </View>
                </View>
              </View>
            )}
          </View> */}
        </View>

        {/* Storage Settings */}
        <View style={styles.storageSettings}>
          <Text style={styles.storageTitle}>تنظیمات ذخیره‌سازی</Text>

          <TouchableOpacity
            style={[
              styles.radioOption,
              storageOption === 'local' && styles.radioOptionSelected,
            ]}
            onPress={() => setStorageOption('local')}
          >
            <View
              style={[
                styles.radioText,
                storageOption === 'local' && styles.radioOptionSelected,
              ]}
            >
              <Text variant="small" style={styles.radioLabel}>
                فقط روی این دستگاه ذخیره شود
              </Text>
              <Text
                variant="x_small"
                color="secondary"
                style={styles.radioSubtext}
              >
                (بالاترین امنیت)
              </Text>
            </View>
            <View
              style={[
                styles.radio,
                storageOption === 'local' && styles.radioSelected,
              ]}
            >
              {storageOption === 'local' && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.radioOption,
              storageOption === 'cloud' && styles.radioOptionSelected,
            ]}
            onPress={() => setStorageOption('cloud')}
          >
            <View
              style={[
                styles.radioText,
                storageOption === 'cloud' && styles.radioOptionSelected,
              ]}
            >
              <Text variant="small" style={styles.radioLabel}>
                همگام‌سازی ابری
              </Text>
              <Text
                variant="x_small"
                color="secondary"
                style={styles.radioSubtext}
              >
                (رمزگذاری شده)
              </Text>
            </View>

            <View
              style={[
                styles.radio,
                storageOption === 'cloud' && styles.radioSelected,
              ]}
            >
              {storageOption === 'cloud' && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Save Button */}
      <View style={styles.bottomBar}>
        <Button
          title="ذخیره امن اطلاعات"
          variant="primary"
          size="medium"
          onPress={handleSave}
          style={styles.saveButton}
        />
      </View>
    </View>
  );
}
