import { StyleSheet, TouchableOpacity } from 'react-native';
import { View, Text } from '../../components';
import { useStore } from '../../store';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '../../navigation/Routes';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcon from '../../components/MaterialIcon';
import { APP_PERSIAN_NAME } from '../../utils/constants';
import { Platform } from 'react-native';

export default function CustomHomeHeader() {
  const navigation = useNavigation<NavigationProp>();
  const theme = useStore(state => state.currentTheme);
  const isRTL = useStore(state => state.isRTL);

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
    iconButton: {
      width: 35,
      height: 35,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 20,
    },
    aiButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 20,
      backgroundColor: `${theme.colors.primary}33`,
    },
    title: {},
  });

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <TouchableOpacity
        style={styles.iconButton}
        disabled={Platform.OS === 'web'}
        onPress={() => navigation.navigate('Settings')}
      >
        {Platform.OS !== 'web' && (
          <MaterialIcon
            name="settings"
            size={24}
            color={theme.colors.textSecondary}
          />
        )}
      </TouchableOpacity>

      <Text variant="h3">{APP_PERSIAN_NAME}</Text>

      <View style={{ flexDirection: isRTL ? 'row' : 'row-reverse', gap: 5 }}>
        {Platform.OS !== 'web' && (
          <>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigation.navigate('TerminalLogger')}
            >
              <MaterialIcon
                name="bug"
                size={24}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigation.navigate('PersonalVault')}
            >
              <MaterialIcon
                name="lock"
                size={24}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
