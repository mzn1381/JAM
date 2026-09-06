import React, { useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  // Modal,
  // TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { View, Text } from '../../components';
import {
  Logger,
  useCreateMessageDirectly,
  useRemoveTaskAndMessages,
  useStore,
} from '../../store';
import { NavigationProp } from '../../navigation/Routes';
import MaterialIcon from '../../components/MaterialIcon';
import { Task } from '../../types/Tasks';
import { formatDateTimeLocale } from '../../utils/DateTimeUtils';
import Toast from 'react-native-toast-message';
import { Platform } from 'react-native';
import { getAppMode } from '../../utils/useAppMode';

export default function TaskList() {
  const navigation = useNavigation<NavigationProp>();
  const theme = useStore(state => state.currentTheme);
  const isRTL = useStore(state => state.isRTL);
  const tasks = useStore(state => state.tasks).reverse(); // Reverse the tasks to show the most recent first

  // This line is to fix the issue of text alignment in RTL mode for web platform
  const align = (Platform.OS === 'web') === isRTL ? 'right' : 'left';

  // const toggleTaskCompletion = useStore(state => state.toggleTaskCompletion);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },

    content: {
      // flex: 1,
      paddingHorizontal: theme.spacing.large,
      paddingTop: theme.spacing.small,
    },
    taskCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.medium,
      padding: theme.spacing.large,
      marginBottom: theme.spacing.large,
      gap: theme.spacing.medium,
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    taskHeader: {
      flexDirection: isRTL ? 'row' : 'row-reverse',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: theme.spacing.large,
      // backgroundColor: 'red',
    },
    taskLeft: {
      flexDirection: isRTL ? 'row' : 'row-reverse',
      alignItems: 'flex-start',
      gap: theme.spacing.large,
      flex: 1,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: theme.colors.textSecondary,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 4,
    },
    checkboxChecked: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    checkmark: {
      color: theme.colors.onPrimary,
      fontSize: 14,
      fontWeight: 'bold',
      marginBottom: -2,
      bottom: 4,
    },
    taskContent: {
      flex: 1,
      gap: 4,
    },
    taskTitle: {
      textAlign: align,
      paddingEnd: 20,
    },
    taskTitleCompleted: {
      color: theme.colors.textSecondary,
      textDecorationLine: 'line-through',
    },
    taskFooter: {
      flexDirection: isRTL ? 'row' : 'row-reverse',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: theme.spacing.large,
      marginStart: 14,
      // backgroundColor: 'red',
    },
    taskDatetime: {
      textAlign: isRTL ? 'left' : 'right',
    },
    taskDatetimeWrap: {
      flexDirection: isRTL ? 'row' : 'row-reverse',
      alignItems: 'center',
      gap: theme.spacing.xsmall,
    },
    taskDatetimeCompleted: {
      textDecorationLine: 'line-through',
    },
    taskActions: {
      flexDirection: isRTL ? 'row' : 'row-reverse',
      alignItems: 'center',
      gap: theme.spacing.small,
    },
    actionButton: {
      // padding: theme.spacing.small,
      // borderRadius: 20,
      // backgroundColor: 'red',
    },
    categoryTag: {
      paddingHorizontal: theme.spacing.small,
      paddingVertical: 4,
      borderRadius: 11,
      alignSelf: 'flex-end',
    },
    categoryText: {
      // fontSize: 12,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.xxxlarge,
      paddingHorizontal: theme.spacing.xlarge,
      gap: theme.spacing.medium,
    },
    emptyIcon: {
      marginTop: 120,
    },
    emptyTitle: {
      // textAlign: 'center',
    },
    emptyDescription: {
      textAlign: 'center',
    },

    addNewTask: {
      // width: 56,
      flexDirection: isRTL ? 'row' : 'row-reverse',
      paddingHorizontal: theme.spacing.large,
      height: 56,
      borderRadius: 16,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    fab: {
      position: 'absolute',
      bottom: 96,
      [isRTL ? 'right' : 'left']: theme.spacing.large,
      flexDirection: isRTL ? 'row' : 'row-reverse',
      alignItems: 'center',
      gap: theme.spacing.medium,
      paddingVertical: theme.spacing.medium,
      paddingHorizontal: theme.spacing.medium,
      borderRadius: 28,
      backgroundColor: theme.colors.primary,
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    bottomBar: {
      position: 'absolute',
      bottom: 4,
      left: 0,
      right: 0,
      flexDirection: isRTL ? 'row' : 'row-reverse',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.large,
      paddingHorizontal: theme.spacing.large,
      paddingVertical: theme.spacing.medium,
      backgroundColor: `${theme.colors.background}EE`,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    inputContainer: {
      flex: 1,
      height: 48,
      flexDirection: isRTL ? 'row' : 'row-reverse',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.large,
      borderRadius: 24,
      backgroundColor: theme.colors.inputColor,
    },
    inputText: {
      textAlign: isRTL ? 'right' : 'left',
    },
    micButton: {
      width: 48,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 24,
      backgroundColor: theme.colors.primary,
    },
  });
  const createMessageDirectly = useCreateMessageDirectly();
  const removeTaskAndMessages = useRemoveTaskAndMessages();

  const handelCreateMessageDirectly = () => {
    const taskId = createMessageDirectly();
    if (taskId && taskId !== '0') {
      navigation.navigate('Chat', {
        taskId: taskId,
      });
    } else {
      Toast.show({
        type: 'error',
        text1: 'مشگلی در ایجاد تسک',
        text2: 'لطفا با راهبر سامانه تماس بگیرید!',
        autoHide: false,
      });
    }
  };

  useEffect(() => {
    if (Platform.OS === 'web') {
      const appMode = getAppMode();
      Logger.info(`App is running in mode: ${appMode}`);

      if (appMode === 'demo') {
        handelCreateMessageDirectly();
      }
    }
  }, []);

  const renderTask = (task: Task, i: number) => (
    <View key={task.id} variant="surface" style={styles.taskCard}>
      <View variant="surface" style={styles.taskHeader}>
        <View variant="surface" style={styles.taskLeft}>
          {/* <TouchableOpacity
            style={[styles.checkbox, task.completed && styles.checkboxChecked]}
            onPress={() => toggleTaskCompletion(task.id)}
          >
            {task.completed && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity> */}

          <View variant="surface" style={styles.taskContent}>
            <TouchableOpacity
              key={task.id}
              onPress={() =>
                navigation.navigate('Chat', {
                  taskId: task.id,
                })
              }
            >
              <Text
                variant="small"
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[
                  styles.taskTitle,
                  task.completed && styles.taskTitleCompleted,
                ]}
              >
                {task.title.replace(/\s+/g, ' ').trim()}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View variant="surface" style={styles.taskActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              removeTaskAndMessages(task.id);
            }}
          >
            <MaterialIcon
              name="cancel"
              size={15}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View variant="surface" style={styles.taskFooter}>
        <View variant="surface" style={styles.taskDatetimeWrap}>
          <MaterialIcon
            name="alarm"
            size={12}
            color={theme.colors.textSecondary}
          />
          <Text
            variant="xx_small"
            color="secondary"
            style={[
              styles.taskDatetime,
              task.completed && styles.taskDatetimeCompleted,
            ]}
          >
            {formatDateTimeLocale(
              new Date(task.datetime).getTime(),
              false,
              'relative',
            )}
          </Text>
        </View>

        <View
          style={[
            styles.categoryTag,
            {
              backgroundColor: task.completed
                ? `${task.categoryColor}20`
                : `${task.categoryColor}30`,
            },
          ]}
        >
          <Text
            variant="xx_small"
            style={[styles.categoryText, { color: task.categoryColor }]}
          >
            {task.category.trim() === '' ? 'بدون دسته‌بندی' : task.category}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {tasks.length > 0 ? (
          tasks.map(renderTask)
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <MaterialIcon
                name="checklist"
                size={90}
                color={`${theme.colors.textSecondary}`}
                style={{ padding: 10 }}
              />
            </View>

            <Text color="secondary" variant="h2" style={styles.emptyTitle}>
              هنوز کاری ثبت نشده!
            </Text>
            <Text
              variant="body"
              color="secondary"
              style={styles.emptyDescription}
            >
              اولین کار خود را بنویسید ...
            </Text>
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      {/* <TouchableOpacity style={styles.fab} onPress={() => createNewTask()}>
        <MaterialIcon name="add" size={40} color={theme.colors.textPrimary} />
      </TouchableOpacity> */}

      {/* Bottom Input Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.micButton}
          onPress={() => handelCreateMessageDirectly()}
        >
          <MaterialIcon name="send" size={24} color={theme.colors.onPrimary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.inputContainer}
          onPress={() => handelCreateMessageDirectly()}
        >
          <Text variant="body" color="secondary" style={styles.inputText}>
            صحبت کن یا بنویس...
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
