// import { Message, ListOptionItem, ConfirmOption } from '../../../types/Chat';
import { View, Text } from '../../../components';
import MaterialIcon from '../../../components/MaterialIcon';
import {
  Image,
  Platform,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { formatTime } from '../../../utils/DateTimeUtils';
import { useStore } from '../../../store';
import {
  CardViewPayload,
  ConfirmOption,
  ListOptionItem,
  Message,
} from '../../../types/Chat';
import { OtpInput } from './OtpInput';
import { getDisplayText } from '../../../utils/handlers';
interface ChatMessageProps {
  message: Message;
  onConfirm?: (messageId: string, option: ConfirmOption) => void;
  onSelectOption?: (messageId: string, option: ListOptionItem) => void;
  onCardAction?: (messageId: string, payload: CardViewPayload) => void;
  onOtpComplete?: (messageId: string, code: string) => void;
}

export const ChatMessage = ({
  message,
  onConfirm,
  onSelectOption,
  onCardAction,
  onOtpComplete,
}: ChatMessageProps) => {
  const { width: viewportWidth } = useWindowDimensions();
  const theme = useStore(state => state.currentTheme);
  const isRTL = useStore(state => state.isRTL);
  const user = useStore(state => state.user);
  const pishkarAvatar = useStore(state => state.pishkarAvatar);

  const isUser = message.isUser;
  const assistantWebMaxWidth =
    viewportWidth >= 1440
      ? viewportWidth * 0.44
      : viewportWidth >= 1100
      ? viewportWidth * 0.52
      : viewportWidth >= 800
      ? viewportWidth * 0.62
      : viewportWidth * 0.78;
  const avatarAssistant = pishkarAvatar;
  const avatarUser = user?.avatar || 'https://i.pravatar.cc/150?img=12';

  const isRemoteImage = (image?: string) =>
    !!image && /^(https?:\/\/|data:image\/)/.test(image);

  const isMediumOnLeft = (Platform.OS === 'web') !== isRTL;

  const styles = StyleSheet.create({
    messageContainer: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'flex-end',
      gap: theme.spacing.medium,
      marginBottom: theme.spacing.xlarge,
    },
    messageContainerUser: {
      flexDirection: isRTL ? 'row' : 'row-reverse',
      justifyContent: 'flex-start',
    },
    smallAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
    },
    messageContent: {
      flexDirection: 'column',
      gap: theme.spacing.xsmall,
      maxWidth: '85%',
      minWidth: '75%',
    },
    messageContentUser: { alignItems: isRTL ? 'flex-start' : 'flex-end' },
    messageBubble: {
      paddingHorizontal: theme.spacing.large,
      paddingVertical: theme.spacing.medium,
      borderRadius: theme.borderRadius.medium,
    },
    messageBubbleAssistant: {
      backgroundColor: theme.colors.messageBubble,
      borderBottomLeftRadius: isMediumOnLeft ? theme.borderRadius.medium : 4,
      borderBottomRightRadius: isMediumOnLeft ? 4 : theme.borderRadius.medium,
    },
    messageBubbleTemporary: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: theme.colors.primary + '4D',
      opacity: 0.92,
    },
    messageBubbleUser: {
      backgroundColor: theme.colors.primary,
      borderBottomLeftRadius: isMediumOnLeft ? 4 : theme.borderRadius.medium,
      borderBottomRightRadius: isMediumOnLeft ? theme.borderRadius.medium : 4,
    },
    messageText: { textAlign: isRTL ? 'left' : 'right', lineHeight: 24 },
    messageTextUser: { color: theme.colors.onPrimary },
    messageTextTemporary: {
      color: theme.colors.textSecondary,
      fontStyle: 'italic',
    },
    statusText: {
      fontSize: 12,
      paddingHorizontal: theme.spacing.small,
      textAlign: isRTL ? 'right' : 'left',
    },
    statusTextCompleted: {
      color: theme.colors.success,
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 4,
    },
    // CONFIRM
    confirmActionsRow: {
      flexDirection: isRTL ? 'row' : 'row-reverse',
      gap: theme.spacing.medium,
      width: '100%',
      marginTop: theme.spacing.small,
    },
    confirmButton: {
      flex: 1,
      height: 48,
      borderRadius: theme.borderRadius.medium,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: isRTL ? 'row-reverse' : 'row',
      gap: theme.spacing.small,
    },
    confirmButtonPrimary: { backgroundColor: theme.colors.primary },
    confirmButtonSecondary: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border + '1A',
    },
    securityNoteRow: {
      flexDirection: isRTL ? 'row' : 'row-reverse',
      alignItems: 'center',
      gap: theme.spacing.xsmall,
      opacity: 0.4,
      marginTop: theme.spacing.small,
    },
    // LIST_OPTION
    optionsContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.medium,
      borderWidth: 1,
      borderColor: theme.colors.border + '4D',
      padding: theme.spacing.small,
      gap: theme.spacing.small,
      width: '100%',
    },
    optionRow: {
      flexDirection: isRTL ? 'row' : 'row-reverse',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.small,
      paddingHorizontal: theme.spacing.medium,
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.small ?? 8,
    },
    optionRowSelected: {
      backgroundColor: theme.colors.primary + '1A',
      borderWidth: 1,
      borderColor: theme.colors.primary + '66',
    },
    optionLeft: {
      flexDirection: isRTL ? 'row' : 'row-reverse',
      alignItems: 'center',
      gap: theme.spacing.medium,
      backgroundColor: 'transparent',
    },
    optionIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    optionTextCol: {
      flexDirection: 'column',
      alignItems: isRTL ? 'flex-start' : 'flex-end',
      backgroundColor: 'transparent',
    },
    simpleOptionsContainer: {
      gap: theme.spacing.medium,
      width: Platform.OS === 'web' ? '100%' : '115%',
      marginStart: Platform.OS === 'web' ? 0 : -25,
    },
    simpleOptionCard: {
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.small,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: theme.spacing.medium,
      shadowColor: '#000000',
      shadowOpacity: 0.08,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: 2,
    },
    simpleOptionCardSelected: {
      borderColor: theme.colors.primary + '80',
      backgroundColor: theme.colors.primary + '08',
    },
    simpleOptionCardInner: {
      flexDirection: isRTL ? 'row' : 'row-reverse',
      gap: theme.spacing.medium,
    },
    simpleOptionImageWrap: {
      width: 86,
      height: 86,
      borderRadius: theme.borderRadius.small,
      overflow: 'hidden',
      backgroundColor: theme.colors.border + '66',
      alignItems: 'center',
      justifyContent: 'center',
    },
    simpleOptionImage: {
      width: '100%',
      height: '100%',
    },
    simpleOptionRatingBadge: {
      position: 'absolute',
      [isRTL ? 'left' : 'right']: 6,
      bottom: 6,
      flexDirection: isRTL ? 'row' : 'row-reverse',
      alignItems: 'center',
      gap: 2,
      paddingHorizontal: theme.spacing.xsmall,
      borderRadius: theme.borderRadius.small,
      backgroundColor: theme.colors.success,
    },
    simpleOptionRatingText: {
      color: theme.colors.onPrimary,
      lineHeight: 16,
    },
    simpleOptionInfo: {
      flex: 1,
      justifyContent: 'space-between',
      alignItems: isRTL ? 'flex-end' : 'flex-start',
      backgroundColor: 'transparent',
    },
    simpleOptionTextGroup: {
      width: '100%',
      alignItems: isRTL ? 'flex-start' : 'flex-end',
      backgroundColor: 'transparent',
    },
    simpleOptionTitle: {
      textAlign: isRTL ? 'right' : 'left',
      lineHeight: 26,
    },
    simpleOptionSubtitle: {
      textAlign: isRTL ? 'right' : 'left',
    },
    simpleOptionMetaRow: {
      flexDirection: isRTL ? 'row' : 'row-reverse',
      alignItems: 'center',
      gap: theme.spacing.xsmall,
      marginTop: theme.spacing.xsmall,
      backgroundColor: 'transparent',
    },
    simpleOptionMetaText: {
      flexShrink: 1,
      color: theme.colors.textSecondary,
      textAlign: isRTL ? 'right' : 'left',
    },
    simpleOptionButton: {
      width: '100%',
      marginTop: theme.spacing.small,
      paddingVertical: theme.spacing.small,
      borderRadius: theme.borderRadius.small,
      backgroundColor: theme.colors.primary + '14',
      alignItems: 'center',
      justifyContent: 'center',
    },
    simpleOptionButtonSelected: {
      backgroundColor: theme.colors.primary,
    },
    simpleOptionButtonText: {
      color: theme.colors.primary,
    },
    simpleOptionButtonTextSelected: {
      color: theme.colors.onPrimary,
    },
    // CARD_VIEW
    cardViewContainer: {
      width: '100%',
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.medium,
      borderWidth: 1,
      borderColor: theme.colors.primary + '11',
      padding: theme.spacing.large,
      shadowColor: '#000000',
      shadowOpacity: 0.14,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: 1,
    },
    cardViewHeader: {
      flexDirection: isRTL ? 'row' : 'row-reverse',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: theme.spacing.medium,
      backgroundColor: 'transparent',
      marginBottom: theme.spacing.medium,
    },
    cardViewTitleGroup: {
      flex: 1,
      alignItems: isRTL ? 'flex-start' : 'flex-end',
      backgroundColor: 'transparent',
    },
    cardViewTitle: {
      color: theme.colors.textPrimary,
      textAlign: isRTL ? 'left' : 'right',
      lineHeight: 32,
    },
    cardViewSubtitle: {
      color: theme.colors.primary,
      textAlign: isRTL ? 'left' : 'right',
    },
    cardViewRatingBadge: {
      flexDirection: isRTL ? 'row' : 'row-reverse',
      alignItems: 'center',
      gap: theme.spacing.xsmall,
      paddingHorizontal: theme.spacing.small - 1,
      paddingVertical: theme.spacing.xsmall - 2,
      borderRadius: theme.borderRadius.small,
      backgroundColor: theme.colors.success,
    },
    cardViewRatingText: {
      color: theme.colors.onPrimary,
      lineHeight: 20,
    },
    cardViewMetricGrid: {
      flexDirection: isRTL ? 'row' : 'row-reverse',
      gap: theme.spacing.small,
      backgroundColor: 'transparent',
      marginBottom: theme.spacing.large,
    },
    cardViewMetricBox: {
      flex: 1,
      borderRadius: theme.borderRadius.small,
      borderWidth: 1,
      borderColor: theme.colors.border + '66',
      backgroundColor: theme.colors.inputColor,
      paddingHorizontal: theme.spacing.small,
      paddingVertical: theme.spacing.small,
      alignItems: isRTL ? 'flex-start' : 'flex-end',
    },
    cardViewMetricLabel: {
      color: theme.colors.textSecondary,
      textAlign: isRTL ? 'left' : 'right',
    },
    cardViewMetricValue: {
      color: theme.colors.textPrimary,
      textAlign: isRTL ? 'left' : 'right',
      lineHeight: 28,
    },
    cardViewLocationRow: {
      flexDirection: isRTL ? 'row' : 'row-reverse',
      alignItems: 'flex-start',
      gap: theme.spacing.xsmall,
      backgroundColor: 'transparent',
      marginBottom: theme.spacing.large,
    },
    cardViewLocationText: {
      flex: 1,
      color: theme.colors.textPrimary,
      textAlign: isRTL ? 'left' : 'right',
      lineHeight: 24,
    },

    // Shared completed-selection chip shown after OTP / CONFIRMATION / LIST_OPTION
    completedSelection: {
      flexDirection: isRTL ? 'row' : 'row-reverse',
      alignItems: 'center',
      gap: theme.spacing.small,
      paddingHorizontal: theme.spacing.medium,
      paddingVertical: theme.spacing.small,
      backgroundColor: theme.colors.success + '1A',
      borderRadius: theme.borderRadius.small,
      borderWidth: 1,
      borderColor: theme.colors.success + '4D',
      marginTop: theme.spacing.small,
    },
    completedSelectionText: {
      color: theme.colors.success,
      textAlign: isRTL ? 'left' : 'right',
      flexShrink: 1,
    },
    temporaryBadge: {
      flexDirection: isRTL ? 'row' : 'row-reverse',
      alignItems: 'center',
      gap: theme.spacing.xsmall,
      alignSelf: isRTL ? 'flex-start' : 'flex-end',
      marginBottom: theme.spacing.xsmall,
      paddingHorizontal: theme.spacing.small,
      paddingVertical: 4,
      borderRadius: theme.borderRadius.small,
      backgroundColor: theme.colors.primary + '14',
    },
    temporaryBadgeText: {
      color: theme.colors.primary,
      textAlign: isRTL ? 'left' : 'right',
    },
  });

  const renderBubbleContent = () => {
    let subBubbleContent = null;
    switch (message.toolType) {
      case 'OTP':
        subBubbleContent =
          message.status === 'completed' ? (
            <View style={styles.completedSelection}>
              <MaterialIcon
                name="check_circle"
                size={16}
                color={theme.colors.success}
              />
              <Text variant="small" style={styles.completedSelectionText}>
                کد وارد شده: {message.selectedMessage}
              </Text>
            </View>
          ) : message?.otpPayload?.length ? (
            <OtpInput
              length={message.otpPayload.length}
              resendLabel={message.otpPayload.resendLabel}
              onComplete={code => onOtpComplete?.(message.id, code)}
            />
          ) : null;
        break;

      case 'CONFIRMATION':
        subBubbleContent =
          message.status === 'completed' ? (
            <View style={styles.completedSelection}>
              <MaterialIcon
                name="check_circle"
                size={16}
                color={theme.colors.success}
              />
              <Text variant="small" style={styles.completedSelectionText}>
                {message.selectedMessage}
              </Text>
            </View>
          ) : (
            <View style={styles.confirmActionsRow}>
              {message?.confirmationPayload?.options.map(option => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.confirmButton,
                    option.variant === 'primary'
                      ? styles.confirmButtonPrimary
                      : styles.confirmButtonSecondary,
                  ]}
                  onPress={() => onConfirm?.(message.id, option)}
                >
                  <MaterialIcon
                    name={option.icon}
                    size={20}
                    color={
                      option.variant === 'primary'
                        ? theme.colors.onPrimary
                        : theme.colors.textPrimary
                    }
                  />
                  <Text variant="body" color={option.variant}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          );
        break;

      case 'LIST_OPTION':
        subBubbleContent =
          message.status === 'completed' ? (
            <View style={styles.completedSelection}>
              <MaterialIcon
                name="check_circle"
                size={16}
                color={theme.colors.success}
              />
              <Text variant="small" style={styles.completedSelectionText}>
                {getDisplayText(message.selectedMessage ?? '')}
              </Text>
            </View>
          ) : message?.listOptionsPayload?.optionType === 'DEFAULT' ? (
            <View style={styles.simpleOptionsContainer}>
              {message.listOptionsPayload.options.map(option => {
                const isSelected =
                  message.listOptionsPayload?.defaultOptionId === option.id;
                const actionLabel = option.actionLabel ?? 'مشاهده پروفایل';

                option.rating = option.rating ?? '۴.۹'; // Default rating if not provided
                return (
                  <TouchableOpacity
                    key={option.id}
                    activeOpacity={0.82}
                    style={[
                      styles.simpleOptionCard,
                      isSelected && styles.simpleOptionCardSelected,
                    ]}
                    onPress={() => onSelectOption?.(message.id, option)}
                  >
                    <View style={styles.simpleOptionCardInner}>
                      <View style={styles.simpleOptionImageWrap}>
                        {isRemoteImage(option.image) ? (
                          <Image
                            source={{ uri: option.image }}
                            style={styles.simpleOptionImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <MaterialIcon
                            name="person"
                            size={34}
                            color={theme.colors.textSecondary}
                          />
                        )}
                        {!!option.rating && (
                          <View style={styles.simpleOptionRatingBadge}>
                            <Text
                              variant="xx_small"
                              style={styles.simpleOptionRatingText}
                            >
                              ★
                            </Text>
                            <Text
                              variant="xx_small"
                              style={styles.simpleOptionRatingText}
                            >
                              {option.rating}
                            </Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.simpleOptionInfo}>
                        <View style={styles.simpleOptionTextGroup}>
                          <Text
                            variant="body"
                            numberOfLines={1}
                            ellipsizeMode="tail"
                            style={styles.simpleOptionTitle}
                          >
                            {option.title}
                          </Text>
                          {!!option.subtitle && (
                            <Text
                              variant="xx_small"
                              numberOfLines={1}
                              ellipsizeMode="tail"
                              style={styles.simpleOptionSubtitle}
                            >
                              {option.subtitle}
                            </Text>
                          )}
                          {!!option.subtitle2 && (
                            <View style={styles.simpleOptionMetaRow}>
                              <MaterialIcon
                                name="location_on"
                                size={14}
                                color={theme.colors.textSecondary}
                              />
                              <Text
                                variant="xx_small"
                                numberOfLines={1}
                                ellipsizeMode="tail"
                                style={styles.simpleOptionMetaText}
                              >
                                {option.subtitle2}
                              </Text>
                            </View>
                          )}
                        </View>

                        <View
                          style={[
                            styles.simpleOptionButton,
                            isSelected && styles.simpleOptionButtonSelected,
                          ]}
                        >
                          <Text
                            variant="x_small"
                            style={[
                              styles.simpleOptionButtonText,
                              isSelected &&
                                styles.simpleOptionButtonTextSelected,
                            ]}
                          >
                            {actionLabel}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.optionsContainer}>
              {message?.listOptionsPayload?.options.map(option => {
                const isSelected =
                  message?.listOptionsPayload?.defaultOptionId === option.id;
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.optionRow,
                      isSelected && styles.optionRowSelected,
                    ]}
                    onPress={() => onSelectOption?.(message.id, option)}
                  >
                    <View style={styles.optionLeft}>
                      <View style={styles.optionIconWrap}>
                        <MaterialIcon
                          name={'task_alt'}
                          size={18}
                          color={theme.colors.primary}
                        />
                      </View>
                      <View style={styles.optionTextCol}>
                        <Text
                          numberOfLines={1}
                          ellipsizeMode="tail"
                          variant="body"
                          color="primary"
                        >
                          {option.title}
                        </Text>
                        {option.subtitle && (
                          <Text
                            variant="xx_small"
                            color="secondary"
                            numberOfLines={1}
                            ellipsizeMode="tail"
                            style={{ width: 150 }}
                          >
                            {option.subtitle}
                          </Text>
                        )}
                      </View>
                    </View>
                    <MaterialIcon
                      name={'chevron_left'}
                      size={18}
                      color={theme.colors.textPrimary}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        break;

      case 'CARD_VIEW': {
        const payload = message.cardViewPayload;
        if (!payload) break;

        const primaryMetric = payload.primaryMetric ?? {
          label: 'سابقه فعالیت',
          value: '۱۲ سال',
        };
        const secondaryMetric = payload.secondaryMetric ?? {
          label: 'بیماران موفق',
          value: '+۲۰۰۰ نفر',
        };
        const actionLabel = payload.actionLabel ?? 'رزرو نوبت آنلاین';

        subBubbleContent = (
          <View style={styles.cardViewContainer}>
            <View style={styles.cardViewHeader}>
              <View style={styles.cardViewTitleGroup}>
                <Text
                  variant="h4"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={styles.cardViewTitle}
                >
                  {payload.title}
                </Text>
                {!!payload.subtitle && (
                  <Text
                    variant="x_small"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={styles.cardViewSubtitle}
                  >
                    {payload.subtitle}
                  </Text>
                )}
              </View>

              {!!payload.rating && (
                <View style={styles.cardViewRatingBadge}>
                  <Text variant="xx_small" style={styles.cardViewRatingText}>
                    ★ {payload.rating}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.cardViewMetricGrid}>
              <View style={styles.cardViewMetricBox}>
                <Text variant="xx_small" style={styles.cardViewMetricLabel}>
                  {primaryMetric.label}
                </Text>
                <Text variant="body" style={styles.cardViewMetricValue}>
                  {primaryMetric.value}
                </Text>
              </View>
              <View style={styles.cardViewMetricBox}>
                <Text variant="xx_small" style={styles.cardViewMetricLabel}>
                  {secondaryMetric.label}
                </Text>
                <Text variant="body" style={styles.cardViewMetricValue}>
                  {secondaryMetric.value}
                </Text>
              </View>
            </View>

            {!!payload.location && (
              <View style={styles.cardViewLocationRow}>
                <MaterialIcon
                  name="location_on"
                  size={18}
                  color={theme.colors.primary}
                />
                <Text
                  variant="xx_small"
                  color="secondary"
                  style={styles.cardViewLocationText}
                >
                  {payload.location}
                </Text>
              </View>
            )}

            <TouchableOpacity
              activeOpacity={0.86}
              accessibilityRole="button"
              accessibilityLabel={actionLabel}
              style={styles.simpleOptionButton}
              onPress={() => onCardAction?.(message.id, payload)}
            >
              <Text variant="small" style={styles.simpleOptionButtonText}>
                {actionLabel}
              </Text>
            </TouchableOpacity>
          </View>
        );
        break;
      }

      case 'TEXT':
      default:
        break;
    }

    const shouldRenderMessageBubble =
      message.toolType !== 'CARD_VIEW' || !!message.text?.trim();

    return (
      <>
        {shouldRenderMessageBubble && (
          <View
            style={[
              styles.messageBubble,
              isUser ? styles.messageBubbleUser : styles.messageBubbleAssistant,
              message.isTemporary && styles.messageBubbleTemporary,
            ]}
          >
            {!isUser && message.isTemporary && (
              <View style={styles.temporaryBadge}>
                <MaterialIcon
                  name="auto_awesome"
                  size={14}
                  color={theme.colors.primary}
                />
                <Text variant="x_small" style={styles.temporaryBadgeText}>
                  پاسخ در حال آماده‌سازی
                </Text>
              </View>
            )}
            <Text
              selectable
              variant="x_small"
              color="primary"
              style={[
                styles.messageText,
                isUser && styles.messageTextUser,
                message.isTemporary && styles.messageTextTemporary,
              ]}
            >
              {getDisplayText(message.text)}
            </Text>
          </View>
        )}
        {subBubbleContent}
      </>
    );
  };

  return (
    <View
      style={[styles.messageContainer, isUser && styles.messageContainerUser]}
    >
      <Image
        source={{ uri: isUser ? avatarUser : avatarAssistant }}
        style={styles.smallAvatar}
      />
      <View
        style={[
          styles.messageContent,
          isUser && styles.messageContentUser,
          !isUser &&
            Platform.OS === 'web' && {
              // Keep web line length comfortable and let whitespace grow on wide screens.
              maxWidth: assistantWebMaxWidth,
              minWidth: 0,
            },
        ]}
      >
        {renderBubbleContent()}
        {message.timestamp && !message.isTemporary && (
          <View
            style={message.status === 'completed' && styles.statusTextCompleted}
          >
            <Text
              variant="small"
              color="secondary"
              style={[
                styles.statusText,
                message.status === 'completed' && {
                  color: theme.colors.success,
                },
              ]}
            >
              {formatTime(new Date(message?.timestamp).getTime())}
            </Text>
            {message.status === 'completed' && (
              <MaterialIcon
                name="check"
                size={14}
                color={theme.colors.success}
              />
            )}
          </View>
        )}
      </View>
    </View>
  );
};
