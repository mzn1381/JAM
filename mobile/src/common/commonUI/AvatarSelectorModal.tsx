// src/components/AvatarSelectorModal.tsx
import React, { useEffect, useState } from 'react';
import {
  Modal,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
} from 'react-native';
import { View, Text, Button } from '../../components/index';
import { useStore } from '../../store';

type ProfileType = 'user' | 'pishkar';

interface AvatarSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  profileType?: ProfileType;
}

const AVATARS = [
  'https://i.pravatar.cc/150?img=1',
  'https://i.pravatar.cc/150?img=2',
  'https://i.pravatar.cc/150?img=3',
  'https://i.pravatar.cc/150?img=4',
  'https://i.pravatar.cc/150?img=5',
  'https://i.pravatar.cc/150?img=6',
  'https://i.pravatar.cc/150?img=7',
  'https://i.pravatar.cc/150?img=8',
  'https://i.pravatar.cc/150?img=9',
  'https://i.pravatar.cc/150?img=12',
  'https://i.pravatar.cc/150?img=47',
  'https://i.pravatar.cc/150?img=10',
  'https://i.pravatar.cc/150?img=11',
  'https://i.pravatar.cc/150?img=13',
  'https://i.pravatar.cc/150?img=14',
  'https://i.pravatar.cc/150?img=15',
];

export const AvatarSelectorModal: React.FC<AvatarSelectorModalProps> = ({
  visible,
  onClose,
  profileType = 'pishkar',
}) => {
  const theme = useStore(state => state.currentTheme);
  const isRTL = useStore(state => state.isRTL);
  const user = useStore(state => state.user);
  const pishkarAvatar = useStore(state => state.pishkarAvatar);
  const updateUser = useStore(state => state.updateUser);
  const setPishkarAvatar = useStore(state => state.setPishkarAvatar);

  const currentAvatar =
    profileType === 'user'
      ? user?.avatar || 'https://i.pravatar.cc/150?img=12'
      : pishkarAvatar;

  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar);

  useEffect(() => {
    if (visible) {
      setSelectedAvatar(currentAvatar);
    }
  }, [visible, currentAvatar]);

  const handleSelect = () => {
    if (profileType === 'user') {
      updateUser({ avatar: selectedAvatar });
    } else {
      setPishkarAvatar(selectedAvatar);
    }
    onClose();
  };

  const modalTitle =
    profileType === 'user' ? 'انتخاب نمایه کاربری' : 'انتخاب نمایه دستیار';

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.large,
    },
    modalContent: {
      // flex: 1,
      width: '100%',
      maxWidth: 400,
      backgroundColor: `${theme.colors.surface}CC`,
      borderRadius: theme.borderRadius.medium,
      borderWidth: 1,
      borderColor: `${theme.colors.onPrimary}1A`,
      // overflow: 'hidden',
    },
    header: {
      paddingHorizontal: theme.spacing.xlarge,
      paddingTop: theme.spacing.xlarge,
      paddingBottom: theme.spacing.large,
    },
    title: {
      textAlign: isRTL ? 'left' : 'right',
    },
    gridContainer: {
      paddingHorizontal: theme.spacing.xlarge,
      paddingBottom: theme.spacing.small,
    },
    avatarContainer: {
      width: '33.33%',
      aspectRatio: 1,
      padding: theme.spacing.medium,
    },
    avatarWrapper: {
      width: '100%',
      height: '100%',
      position: 'relative',
    },
    avatar: {
      width: '100%',
      height: '100%',
      borderRadius: 1000,
      borderWidth: 4,
      borderColor: 'transparent',
    },
    avatarSelected: {
      borderColor: theme.colors.primary,
    },
    checkOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: 1000,
      backgroundColor: `${theme.colors.primary}66`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkIcon: {
      fontSize: 40,
      color: theme.colors.onPrimary,
    },
    buttonContainer: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      gap: theme.spacing.medium,
      padding: theme.spacing.xlarge,
      paddingTop: theme.spacing.small,
    },
    button: {
      // flex: 1,
      // height: 48,
      // borderRadius: theme.borderRadius.small,
      // alignItems: 'center',
      // justifyContent: 'center',

      width: '50%',
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text variant="h3" style={styles.title}>
              {modalTitle}
            </Text>
          </View>

          <View style={styles.gridContainer}>
            <FlatList
              data={AVATARS}
              numColumns={3}
              keyExtractor={(item, index) => index.toString()}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.avatarContainer}>
                  <TouchableOpacity
                    style={styles.avatarWrapper}
                    onPress={() => setSelectedAvatar(item)}
                    activeOpacity={0.7}
                  >
                    <Image
                      source={{ uri: item }}
                      style={[
                        styles.avatar,
                        selectedAvatar === item && styles.avatarSelected,
                      ]}
                    />
                    {selectedAvatar === item && (
                      <View style={styles.checkOverlay}>
                        <Text style={styles.checkIcon}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            />
          </View>

          <View style={styles.buttonContainer}>
            <Button
              title="انتخاب"
              style={styles.button}
              onPress={handleSelect}
            />
            <Button
              title="انصراف"
              style={styles.button}
              variant="text"
              onPress={onClose}
            />
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};
