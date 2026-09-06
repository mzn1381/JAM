import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar,
} from 'react-native';
import { useStore } from '../../store'; // Your main store
import { getLevelColor, getLevelIcon } from './helper';
import { formatDateTimeLocale } from '../../utils/DateTimeUtils';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '../../navigation/Routes';
import Clipboard from '@react-native-clipboard/clipboard';
import MaterialIcon from '../../components/MaterialIcon';
import { colors } from '../../theme';
import Toast from 'react-native-toast-message';

// Terminal Logger Component
export function TerminalLogger() {
  const navigation = useNavigation<NavigationProp>();

  // Use your store instead of separate store
  const logs = useStore(state => state.logs);
  const filterLevel = useStore(state => state.filterLevel);
  const setFilterLevel = useStore(state => state.setFilterLevel);
  const clearLogs = useStore(state => state.clearLogs);

  const scrollViewRef = useRef<ScrollView>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);

  const copyToClipboard = (text: string) => {
    Clipboard.setString(text);
    Toast.show({ type: 'info', text1: 'کپی شد!' });
  };

  // Auto scroll to bottom
  useEffect(() => {
    if (autoScroll) {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  }, [logs, autoScroll]);

  // Filter logs
  const filteredLogs = logs.filter(log => {
    const matchesFilter = filterLevel === 'all' || log.level === filterLevel;
    const matchesSearch =
      searchQuery === '' ||
      log.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Terminal Logger</Text>
        <Text style={styles.logCount}>{filteredLogs.length} logs</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search logs..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filter Buttons */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
      >
        {(['all', 'info', 'warn', 'error', 'success', 'network'] as const).map(
          level => (
            <TouchableOpacity
              key={level}
              style={[
                styles.filterButton,
                filterLevel === level && styles.filterButtonActive,
              ]}
              onPress={() => setFilterLevel(level)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filterLevel === level && styles.filterButtonTextActive,
                ]}
              >
                {level.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ),
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setAutoScroll(!autoScroll)}
        >
          <Text style={styles.actionButtonText}>
            Auto-scroll: {autoScroll ? 'ON' : 'OFF'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.clearButton]}
          onPress={clearLogs}
        >
          <Text style={styles.actionButtonText}>Clear</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton]}
          onPress={() => {
            navigation.goBack();
          }}
        >
          <Text style={styles.actionButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>

      {/* Terminal Output */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.terminalContainer}
        contentContainerStyle={styles.terminalContent}
        showsVerticalScrollIndicator={true}
      >
        {filteredLogs.map(log => (
          <View key={log.id} style={styles.logEntry}>
            <View style={styles.logHeader}>
              <Text style={styles.logTimestamp}>
                {formatDateTimeLocale(Number(log.timestamp), true)}
              </Text>
              <Text
                style={[styles.logLevel, { color: getLevelColor(log.level) }]}
              >
                {getLevelIcon(log.level)} {log.level.toUpperCase()}
              </Text>
            </View>
            <Text selectable style={styles.logMessage}>
              {log.message}
            </Text>
            {log.details && (
              <Text selectable style={styles.logDetails}>
                {JSON.stringify(log.details, null, 2)}
              </Text>
            )}

            {log.details && (
              <TouchableOpacity
                onPress={() =>
                  copyToClipboard(JSON.stringify(log.details, null, 2))
                }
              >
                <MaterialIcon
                  name="copy"
                  size={16}
                  color={colors.dark.onPrimary}
                />
              </TouchableOpacity>
            )}
          </View>
        ))}

        {filteredLogs.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No logs to display</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    paddingTop: 50,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    color: '#00ff00',
    fontSize: 20,
    fontWeight: 'bold',
    // fontFamily: 'Courier New',
  },
  logCount: {
    color: '#666',
    fontSize: 12,
    textAlign: 'left',
    // fontFamily: 'Courier New',
  },
  searchContainer: {
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  searchInput: {
    backgroundColor: '#0a0a0a',
    color: '#fff',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#333',
    // fontFamily: 'Courier New',
    fontSize: 14,
  },
  filterContainer: {
    maxHeight: 60,
    backgroundColor: '#1a1a1a',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 6,
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#333',
  },
  filterButtonActive: {
    backgroundColor: '#00ff00',
    borderColor: '#00ff00',
  },
  filterButtonText: {
    color: '#666',
    fontSize: 12,
    fontWeight: 'bold',
    // fontFamily: 'Courier New',
  },
  filterButtonTextActive: {
    color: '#0a0a0a',
  },
  actionContainer: {
    flexDirection: 'row-reverse',
    backgroundColor: '#1a1a1a',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 6,
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#333',
  },
  clearButton: {
    borderColor: '#f44336',
  },
  actionButtonText: {
    color: '#00ff00',
    fontSize: 12,
    fontWeight: 'bold',
    // fontFamily: 'Courier New',
  },
  terminalContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  terminalContent: {
    padding: 12,
  },
  logEntry: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 6,
    borderRightWidth: 3,
    borderRightColor: '#00ff00',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  logTimestamp: {
    color: '#666',
    fontSize: 11,
    textAlign: 'left',
    // fontFamily: 'Courier New',
  },
  logLevel: {
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'right',
    // fontFamily: 'Courier New',
  },
  logMessage: {
    color: '#fff',
    fontSize: 13,
    // fontFamily: 'Courier New',
    lineHeight: 20,
    textAlign: 'right',
    // writingDirection: 'rtl',
  },
  logDetails: {
    color: '#888',
    fontSize: 11,
    // fontFamily: 'Courier New',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#333',
    textAlign: 'right',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'Courier New',
  },
});
