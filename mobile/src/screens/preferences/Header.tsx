import { StyleSheet, TouchableOpacity } from 'react-native';
import { View, Text } from '../../components';
import { useStore } from '../../store';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '../../navigation/Routes';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcon from '../../components/MaterialIcon';

export default function CustomPreferencesSelectionHeader() {
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
      width: 48,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 24,
    },
    moreButton: {
      width: 48,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 24,
    },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
    },
    spacer: {
      width: 40,
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
      <Text variant="h5" style={styles.headerTitle}>
        علایق و ترجیحات
      </Text>
      <View style={styles.spacer} />
    </SafeAreaView>
  );
}
