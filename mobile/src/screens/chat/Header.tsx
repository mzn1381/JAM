import { StyleSheet, Image, TouchableOpacity } from 'react-native';
import { View, Text } from '../../components';
import { useStore } from '../../store';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '../../navigation/Routes';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcon from '../../components/MaterialIcon';

export default function CustomChatHeader() {
  const navigation = useNavigation<NavigationProp>();
  const theme = useStore(state => state.currentTheme);
  const isRTL = useStore(state => state.isRTL);
  const pishkarAvatar = useStore(state => state.pishkarAvatar);

  const styles = StyleSheet.create({
    container: {
      flexDirection: isRTL ? 'row' : 'row-reverse',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.large,
      paddingVertical: theme.spacing.medium,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },

    backButton: {
      padding: theme.spacing.small,
    },
    headerCenter: {
      flex: 1,
      flexDirection: isRTL ? 'row' : 'row-reverse',
      alignItems: 'center',
      gap: theme.spacing.medium,
      paddingHorizontal: theme.spacing.small,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
    },
    iconButton: {
      width: 35,
      height: 35,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 20,
    },
    headerTitle: {},
    moreButton: {
      padding: theme.spacing.small,
    },
    chatBody: {
      flex: 1,
      paddingHorizontal: theme.spacing.large,
      paddingVertical: theme.spacing.large,
    },
  });
  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <MaterialIcon
          name="arrow_forward"
          size={24}
          color={theme.colors.textPrimary}
        />
      </TouchableOpacity>

      <View style={styles.headerCenter}>
        <Image source={{ uri: pishkarAvatar }} style={styles.avatar} />
        <Text variant="h4" style={styles.headerTitle}>
          دستیار شخصی
        </Text>
      </View>

      <TouchableOpacity
        style={styles.iconButton}
        onPress={() => navigation.navigate('TerminalLogger')}
      >
        <MaterialIcon name="bug" size={24} color={theme.colors.textSecondary} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.moreButton}>
        <MaterialIcon
          name="more_vert"
          size={24}
          color={theme.colors.textPrimary}
        />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
