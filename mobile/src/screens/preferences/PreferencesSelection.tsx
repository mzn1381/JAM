// src/screens/PreferencesSelection.tsx
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';

import { View, Text, Button, ScrollView } from '../../components';
import { Logger, useStore } from '../../store';
import { preferences, PreferenceType } from '../../utils/constants';
import { useUpdateUserContext } from '../../services/APIs/user/useUpdateUserContext';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '../../navigation/Routes';

export default function PreferencesSelection() {
  const theme = useStore(state => state.currentTheme);
  const isRTL = useStore(state => state.isRTL);
  const completeSelectedPreferences = useStore(
    state => state.completeSelectedPreferences,
  );
  const navigation = useNavigation<NavigationProp>();

  const { mutate, isPending } = useUpdateUserContext();

  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);

  const togglePreference = (name: string) => {
    setSelectedPreferences(prev =>
      prev.includes(name) ? prev.filter(p => p !== name) : [...prev, name],
    );
  };

  const handleConfirm = () => {
    if (selectedPreferences.length === 0) {
      Logger.error('selectedPreferences.length === 0', { selectedPreferences });
      return;
    }
    // We map over the master list to ensure ALL keys (even unselected ones) are present
    const preferencesItems = preferences.reduce((acc, item) => {
      // Check if this item's name is inside your selected list
      const isSelected = selectedPreferences.includes(item.name);

      // Assign true if found, false if not
      acc[item.name] = isSelected;

      return acc;
    }, {} as Record<string, boolean>);

    // Execute the mutation with the full object
    mutate(
      { preferencesItems },
      {
        onSuccess: () => {
          completeSelectedPreferences();

          navigation.navigate('Home');
        },
      },
    );

    Logger.info('Payload sent to API:', preferencesItems);
  };

  const isSelected = (name: string) => selectedPreferences.includes(name);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      // backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
    },
    titleSection: {
      paddingHorizontal: theme.spacing.medium,
      paddingTop: theme.spacing.medium,
      paddingBottom: theme.spacing.xsmall,
    },
    title: {
      textAlign: isRTL ? 'left' : 'right',
      marginBottom: theme.spacing.small,
    },
    subtitle: {
      textAlign: isRTL ? 'left' : 'right',
    },
    grid: {
      paddingHorizontal: theme.spacing.small,
      paddingTop: theme.spacing.large,
      gap: theme.spacing.small,
      marginBottom: 100,
    },
    gridRow: {
      flexDirection: isRTL ? 'row' : 'row-reverse',
      gap: theme.spacing.small,
      // marginBottom: theme.spacing.xsmall,
    },
    cardWrapper: {
      flex: 1,
      aspectRatio: 16 / 9,
    },
    card: {
      flex: 1,
      borderRadius: theme.borderRadius.medium,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: theme.elevation.small,
    },
    cardImage: {
      flex: 1,
      width: '100%',
      height: '100%',
    },
    cardOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardOverlaySelected: {
      backgroundColor: `${theme.colors.primary}33`,
    },
    cardLabel: {
      paddingHorizontal: theme.spacing.medium,
      paddingVertical: theme.spacing.small,
      borderRadius: theme.borderRadius.small,
      backgroundColor: 'rgba(0, 0, 0, 0)',
    },
    cardLabelLight: {
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      // backdropFilter: 'blur(4px)',
    },
    cardLabelText: {
      textAlign: 'center',
    },
    cardLabelTextLight: {
      color: '#111818',
    },
    cardLabelTextDark: {
      color: '#FFFFFF',
    },
    bottomBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: theme.spacing.large,
      paddingBottom: theme.spacing.xlarge,
      backgroundColor: `${theme.colors.background}E6`,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    confirmButton: {
      height: 56,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: theme.elevation.large,
    },
    confirmButtonDisabled: {
      opacity: 0.5,
    },
  });

  // Split preferences into rows of 2
  const preferenceRows: PreferenceType[][] = [];
  for (let i = 0; i < preferences.length; i += 2) {
    preferenceRows.push(preferences.slice(i, i + 2));
  }

  return (
    <View style={styles.container}>
      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text variant="h5" style={styles.title}>
            موضوعات مورد علاقه خود را انتخاب کنید.
          </Text>
          <Text variant="x_small" color="secondary" style={styles.subtitle}>
            حداقل سه مورد را برای ادامه انتخاب کنید.
          </Text>
        </View>

        {/* Grid */}
        <View style={styles.grid}>
          {preferenceRows.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.gridRow}>
              {row.map(pref => {
                const selected = isSelected(pref.name);

                return (
                  <TouchableOpacity
                    key={pref.name}
                    style={styles.cardWrapper}
                    onPress={() => togglePreference(pref.name)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.card}>
                      <ImageBackground
                        source={{ uri: pref.image }}
                        style={styles.cardImage}
                        imageStyle={{
                          opacity: selected ? 0.4 : 1,
                        }}
                      >
                        <View
                          style={[
                            styles.cardOverlay,
                            selected && styles.cardOverlaySelected,
                          ]}
                        >
                          <View style={styles.cardLabel}>
                            <Text
                              variant="body"
                              style={[
                                styles.cardLabelText,
                                styles.cardLabelTextDark,
                              ]}
                            >
                              {pref.faName}
                            </Text>
                          </View>
                        </View>
                      </ImageBackground>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <Button
          title={
            isPending
              ? 'لطفا صبر کنید...'
              : `ذخیره و ادامه${
                  selectedPreferences.length > 0
                    ? ` (${selectedPreferences.length})`
                    : ''
                }`
          }
          variant="primary"
          size="medium"
          onPress={handleConfirm}
          disabled={selectedPreferences.length < 3 || isPending}
          style={[
            styles.confirmButton,
            selectedPreferences.length === 0 && styles.confirmButtonDisabled,
          ]}
        />
      </View>
    </View>
  );
}
