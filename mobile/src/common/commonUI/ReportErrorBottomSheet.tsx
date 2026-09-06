// src/components/ReportErrorBottomSheet.tsx
import React, { useState } from 'react';
import { Modal, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { View, Text, Button } from '../../components/index';
import { useStore } from '../../store';
import { APP_PERSIAN_NAME } from '../../utils/constants';

interface ReportErrorBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onReport: () => void;
}

export const ReportErrorBottomSheet: React.FC<ReportErrorBottomSheetProps> = ({
  visible,
  onClose,
  onReport,
}) => {
  const theme = useStore(state => state.currentTheme);
  const isRTL = useStore(state => state.isRTL);

  const [shakeToReport, setShakeToReport] = useState(true);

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    bottomSheet: {
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: theme.borderRadius.medium,
      borderTopRightRadius: theme.borderRadius.medium,
      paddingBottom: 24,
    },
    handle: {
      width: '100%',
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 12,
    },
    handleBar: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: '#2f6a64',
    },
    title: {
      textAlign: 'center',
      paddingHorizontal: theme.spacing.large,
      paddingTop: 20,
      paddingBottom: theme.spacing.small,
    },
    description: {
      textAlign: 'center',
      paddingHorizontal: theme.spacing.large,
      paddingTop: theme.spacing.xsmall,
      paddingBottom: theme.spacing.medium,
    },
    buttonContainer: {
      paddingHorizontal: theme.spacing.large,
      paddingVertical: theme.spacing.medium,
    },

    toggleContainer: {
      paddingHorizontal: theme.spacing.large,
      paddingTop: theme.spacing.small,
      paddingBottom: theme.spacing.xlarge,
    },
    toggleCard: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.large,
      borderRadius: theme.borderRadius.small,
      borderWidth: 1,
      borderColor: '#2f6a64',
      backgroundColor: theme.colors.background,
      padding: 20,
    },
    toggleText: {
      flex: 1,
      textAlign: isRTL ? 'left' : 'right',
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity activeOpacity={1} onPress={e => e.stopPropagation()}>
          <View style={styles.bottomSheet}>
            <TouchableOpacity style={styles.handle} onPress={onClose}>
              <View style={styles.handleBar} />
            </TouchableOpacity>

            <Text variant="h3" style={styles.title}>
              آیا خطایی وجود دارد؟
            </Text>

            <Text variant="small" color="secondary" style={styles.description}>
              با گزارشات خود باعث ارتقای {APP_PERSIAN_NAME} شوید
            </Text>

            <View style={styles.buttonContainer}>
              <Button
                title="گزارش مشکل"
                onPress={() => {
                  onReport();
                  onClose();
                }}
              />
            </View>

            <View style={styles.toggleContainer}>
              <View style={styles.toggleCard}>
                <Switch
                  value={shakeToReport}
                  onValueChange={setShakeToReport}
                  trackColor={{
                    false: '#214a46',
                    true: theme.colors.primary,
                  }}
                  thumbColor={theme.colors.onPrimary}
                  ios_backgroundColor="#214a46"
                />

                <Text variant="small" style={styles.toggleText}>
                  با تکان دادن گوشی خود مشکل را گزارش کنید.
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};
