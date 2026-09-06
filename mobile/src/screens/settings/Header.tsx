import { StyleSheet, Image, TouchableOpacity } from 'react-native';
import { View, Text } from '../../components';
import { useStore } from '../../store';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '../../navigation/Routes';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcon from '../../components/MaterialIcon';

export default function CustomSettingsHeader() {
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
    backButton: {
      padding: theme.spacing.small,
    },
    headerTitle: {},
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

      <Text variant="h4" style={styles.headerTitle}>
        تنظیمات
      </Text>

      <View style={{ width: 48 }} />
    </SafeAreaView>
  );
}
