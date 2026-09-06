import Toast from 'react-native-toast-message';
import {
  ChatbotTask,
  internalProcessor,
} from '../../modules/internal_processor';
import { PermissionAction, PermissionManager } from './PermissionManager';
import { setAlarm } from './tools/alarm';
import { addCalendarEvent } from './tools/calendar';
import { Logger, useStore } from '../store';
import { sendSMSWithLinking } from './tools/SMS';
import { makeCallWithLinking } from './tools/call';
import { sendEmailWithLinking } from './tools/email';
import { getByName } from './tools/contact';
import { typography } from '../theme';
import { Message, ToolResponse } from '../types/Chat';

// ---------------------------------------------------------------------------
// Assistant-message helpers
// ---------------------------------------------------------------------------

/**
 * Emit a plain TEXT assistant message into the current task. Every ON_DEVICE
 * branch — including error/invalid-payload branches — MUST end with an
 * assistant message so the chat's temporary "processing" bubble is replaced
 * with a real response and the loading indicator clears deterministically.
 */
function addAssistantText(taskId: string, text: string): void {
  const { addMessage } = useStore.getState();
  const message: Message = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    taskId,
    text,
    isUser: false,
    toolType: 'TEXT',
    timestamp: new Date().toISOString(),
  };
  addMessage(taskId, message);
}

// ---------------------------------------------------------------------------
// handleChatbotMessage
// ---------------------------------------------------------------------------

/**
 * Sends the user's message through the internal processor and normalises the
 * server response into typed fields consumed by the tools handler.
 *
 * Returns:
 *  - toolResponse  – the first ToolResponse from the server (Message + extras)
 *  - actionPayload – JSON-parsed responseMessage (populated for ON_DEVICE only)
 */
export const handleChatbotMessage = async (
  taskId: string,
  userMessage: string,
) => {
  try {
    const task: ChatbotTask = {
      rawPrompt: userMessage,
      taskId,
    };

    const result = await internalProcessor.process(task);
    const { data, message, success } = result?.response || {};

    Logger.info('Internal Processor response received', {
      ...result?.response,
    });

    if (result.error) {
      Toast.show({
        type: 'error',
        text1: 'خطا در ارتباط با Internal Processor',
        text2: result.error,
        autoHide: false,
      });

      Logger.error('Internal Processor error', {
        taskId,
        error: result.error,
        text: userMessage.substring(0, 50),
      });
    }

    // Extract the full typed tool response from the server
    const toolResponse = (data?.tools?.[0] ?? null) as ToolResponse | null;

    // Parse actionPayload for backward compatibility with old server responses
    // that embed the intent inside responseMessage rather than ondevicePayload.
    let actionPayload: any = null;
    try {
      // Prefer the new structured path; fall back to legacy responseMessage.
      const raw =
        toolResponse?.ondevicePayload?.invocationJson ??
        toolResponse?.responseMessage;
      if (raw) actionPayload = JSON.parse(raw);
    } catch (err) {
      Logger.error('Failed to parse actionPayload (backward compat)', {
        error: err,
      });
    }

    return {
      toolResponse,
      actionPayload,
      message,
      success: Boolean(success),
      status: result.status,
      error: result.error || null,
    };
  } catch (error: any) {
    Logger.error('Failed to Process request via internal processor: ', {
      error,
    });
    return {
      toolResponse: null,
      actionPayload: null,
      message: error?.message || 'Unexpected error',
      success: false,
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// ---------------------------------------------------------------------------
// Permission helpers
// ---------------------------------------------------------------------------

/** Maps ON_DEVICE intents to the PermissionAction they require. */
const ACTION_TO_INTENT_MAP: Readonly<Record<string, PermissionAction>> = {
  set_alarm: 'SET_ALARM',
  set_calendar: 'ADD_CALENDAR_EVENT',
  send_sms: 'SEND_SMS',
  make_call: 'MAKING_CALL',
  send_email: 'SEND_EMAIL_WITH_LINKING',
} as const;

/**
 * Checks and, if necessary, requests the permission required by the given
 * ON_DEVICE action payload. Non-device intents (no mapping) are silently
 * allowed to proceed.
 *
 * Returns:
 *  - true if permission is granted (or not required)
 *  - false if permission is denied, blocked, or the request errored
 *
 * `PermissionManager.ensurePermission` already performs a check-first,
 * request-if-missing flow internally, so callers should NOT do their own
 * pre-check — doing so used to cause a subtle race where two concurrent
 * checks would each trigger a request.
 */
export async function checkAndEnsurePermission(actionPayload: {
  intent?: string;
}): Promise<boolean> {
  const actionKey = actionPayload?.intent as string;
  const requiredIntent = ACTION_TO_INTENT_MAP[actionKey] as
    | PermissionAction
    | undefined;

  if (!requiredIntent) {
    Logger.warn(
      `Unknown or non-device intent: ${actionKey}. Skipping permission check.`,
      { actionKey },
    );
    return true; // No permission required, proceed
  }

  const granted = await PermissionManager.ensurePermission(requiredIntent);

  if (!granted) {
    Logger.warn(
      `Permission denied for ${requiredIntent}. Cannot execute ${actionKey}.`,
      { actionKey, requiredIntent },
    );
  }

  return granted;
}

// ---------------------------------------------------------------------------
// handelActions  (note: intentional spelling – do not rename)
// ---------------------------------------------------------------------------

/**
 * Routes a server ToolResponse to the correct handler based on its toolType.
 *
 * - TEXT / OTP / CONFIRMATION / LIST_OPTION / CARD_VIEW → write a bot message to the store
 * - ON_DEVICE → parse the action payload and execute the device-level action
 */
export async function handelActions(
  toolResponse: ToolResponse,
  taskId: string,
): Promise<void> {
  if (!toolResponse) {
    Logger.error('Invalid toolResponse passed to handelActions:', {
      toolResponse,
    });
    return;
  }

  switch (toolResponse.toolType) {
    /**
     * ===========================
     * TEXT
     * ===========================
     */
    case 'TEXT': {
      const text = toolResponse.text ?? '';
      if (!text) {
        Logger.error('TEXT tool response has no content', { toolResponse });
        break;
      }

      Logger.info('Dispatching TEXT message to user', {
        taskId,
        preview: text.substring(0, 50),
      });

      const { addMessage } = useStore.getState();
      const textMessage: Message = {
        id: Date.now().toString(),
        taskId,
        text,
        isUser: false,
        toolType: 'TEXT',
        timestamp: new Date().toISOString(),
      };
      addMessage(taskId, textMessage);

      Logger.success('TEXT message added to conversation', { taskId });
      break;
    }

    /**
     * ===========================
     * OTP
     * ===========================
     */
    case 'OTP': {
      if (!toolResponse.otpPayload) {
        Logger.error('OTP tool response missing otpPayload', { toolResponse });
        break;
      }

      const { addMessage } = useStore.getState();
      const otpMessage: Message = {
        id: Date.now().toString(),
        taskId,
        text: toolResponse.otpPayload.text ?? '',
        isUser: false,
        toolType: 'OTP',
        otpPayload: toolResponse.otpPayload,
        timestamp: new Date().toISOString(),
      };
      addMessage(taskId, otpMessage);

      Logger.success('OTP message added to conversation', { taskId });
      break;
    }

    /**
     * ===========================
     * CONFIRMATION
     * ===========================
     */
    case 'CONFIRMATION': {
      if (!toolResponse.confirmationPayload) {
        Logger.error('CONFIRMATION tool response missing confirmationPayload', {
          toolResponse,
        });
        break;
      }

      const { addMessage } = useStore.getState();
      const confirmMessage: Message = {
        id: Date.now().toString(),
        taskId,
        text: toolResponse.confirmationPayload.text ?? '',
        isUser: false,
        toolType: 'CONFIRMATION',
        confirmationPayload: toolResponse.confirmationPayload,
        timestamp: new Date().toISOString(),
      };
      addMessage(taskId, confirmMessage);

      Logger.success('CONFIRMATION message added to conversation', { taskId });
      break;
    }

    /**
     * ===========================
     * LIST_OPTION
     * ===========================
     */
    case 'LIST_OPTION': {
      if (!toolResponse.listOptionsPayload) {
        Logger.error('LIST_OPTION tool response missing listOptionPayload', {
          toolResponse,
        });
        break;
      }

      const { addMessage } = useStore.getState();
      const listMessage: Message = {
        id: Date.now().toString(),
        taskId,
        text: toolResponse.listOptionsPayload.text ?? '',
        isUser: false,
        toolType: 'LIST_OPTION',
        listOptionsPayload: toolResponse.listOptionsPayload,
        timestamp: new Date().toISOString(),
      };
      addMessage(taskId, listMessage);

      Logger.success('LIST_OPTION message added to conversation', { taskId });
      break;
    }

    /**
     * ===========================
     * CARD_VIEW
     * ===========================
     */
    case 'CARD_VIEW': {
      if (!toolResponse.cardViewPayload) {
        Logger.error('CARD_VIEW tool response missing cardViewPayload', {
          toolResponse,
        });
        break;
      }

      const { addMessage } = useStore.getState();
      const cardMessage: Message = {
        id: Date.now().toString(),
        taskId,
        text: toolResponse.text ?? '',
        isUser: false,
        toolType: 'CARD_VIEW',
        cardViewPayload: toolResponse.cardViewPayload,
        timestamp: new Date().toISOString(),
      };
      addMessage(taskId, cardMessage);

      Logger.success('CARD_VIEW message added to conversation', { taskId });
      break;
    }

    /**
     * ===========================
     * ON_DEVICE
     * ===========================
     */
    case 'ON_DEVICE': {
      // New version: payload is in ondevicePayload.invocationJson.
      if (!toolResponse.ondevicePayload?.invocationJson) {
        Logger.error(
          'ON_DEVICE tool response missing ondevicePayload.invocationJson',
          { toolResponse },
        );
        addAssistantText(
          taskId,
          'پاسخ سرویس نامعتبر بود. لطفاً دوباره تلاش کنید.',
        );
        break;
      }

      let onDevicePayload: any = null;
      try {
        onDevicePayload = JSON.parse(
          toolResponse.ondevicePayload.invocationJson,
        );
      } catch (err) {
        Logger.error('Failed to parse ondevicePayload.invocationJson', {
          error: err,
        });
        addAssistantText(
          taskId,
          'پاسخ سرویس قابل پردازش نبود. لطفاً دوباره تلاش کنید.',
        );
        break;
      }

      if (!onDevicePayload?.intent) {
        Logger.error('ON_DEVICE invocationJson has no intent', {
          toolResponse,
        });
        addAssistantText(
          taskId,
          'پاسخ سرویس نامعتبر بود. لطفاً دوباره تلاش کنید.',
        );
        break;
      }

      // Check and request permission - only proceed if granted
      const permissionGranted = await checkAndEnsurePermission(onDevicePayload);

      if (!permissionGranted) {
        // Permission denied / blocked - inform the user and clear the
        // loading bubble by emitting an assistant message.
        Logger.error('Permission denied for ON_DEVICE action', {
          intent: onDevicePayload.intent,
          taskId,
        });

        addAssistantText(
          taskId,
          'دسترسی لازم برای انجام این عملیات داده نشد. لطفاً دسترسی‌ها را در تنظیمات بررسی کنید.',
        );

        Toast.show({
          type: 'error',
          text1: 'دسترسی رد شد',
          text2: 'برای انجام این عملیات نیاز به دسترسی دارید.',
          text2Style: {
            fontFamily: typography.fontFamily,
            fontSize: 14,
          },
          visibilityTime: 3000,
        });
        break;
      }

      // Permission granted - execute the action
      await _dispatchOnDeviceAction(onDevicePayload, taskId);
      break;
    }

    /**
     * ===========================
     * DEFAULT
     * ===========================
     */
    default:
      Logger.warn('Unhandled toolType in handelActions:', {
        toolType: toolResponse.toolType,
      });
      break;
  }
}

// ---------------------------------------------------------------------------
// _dispatchOnDeviceAction  (module-private)
// ---------------------------------------------------------------------------

/**
 * Executes a device-level action by inspecting the `intent` field of the
 * parsed ON_DEVICE payload.  Called exclusively from the ON_DEVICE case above.
 */
async function _dispatchOnDeviceAction(
  payload: any,
  taskId: string,
): Promise<void> {
  switch (payload.intent) {
    /**
     * ===========================
     * SET ALARM
     * ===========================
     */
    case 'set_alarm': {
      const { hour, minutes, message = '' } = payload.alarm || {};
      if (payload.alarm && hour !== null && minutes !== null) {
        setAlarm(Number(hour), Number(minutes), message, false);
        Logger.success('Valid data in set_alarm event:', { payload });

        const confirmationText = `هشدار برای ساعت ${hour}:${minutes
          .toString()
          .padStart(2, '0')} تنظیم شد.`;
        addAssistantText(taskId, confirmationText);
      } else {
        Logger.error('Invalid data in set_alarm event:', { payload });
        addAssistantText(
          taskId,
          'اطلاعات هشدار نامعتبر است. لطفاً دوباره تلاش کنید.',
        );
      }
      break;
    }

    /**
     * ===========================
     * CREATE CALENDAR EVENT
     * ===========================
     */
    case 'set_calendar': {
      const { startDate, title } = payload.event || {};
      if (!payload.event || !startDate) {
        Logger.error('Invalid calendar event data:', { payload });
        addAssistantText(
          taskId,
          'اطلاعات رویداد نامعتبر است. لطفاً دوباره تلاش کنید.',
        );
        break;
      }

      Logger.success('Valid calendar event data:', { payload });
      try {
        await addCalendarEvent(payload.event);
      } catch (err) {
        Logger.error('addCalendarEvent failed', { error: err });
        addAssistantText(
          taskId,
          'در ثبت رویداد مشکلی پیش آمد. لطفاً دوباره تلاش کنید.',
        );
        break;
      }

      const confirmationText = title
        ? `رویداد "${title}" به تقویم اضافه شد.`
        : 'رویداد به تقویم اضافه شد.';
      addAssistantText(taskId, confirmationText);
      break;
    }

    /**
     * ===========================
     * SEND SMS
     * ===========================
     */
    case 'send_sms': {
      let { phoneNumber, message, contactName } = payload || {};
      if (!payload || !message || (!phoneNumber && !contactName)) {
        Logger.error('Invalid SMS data:', { payload });
        addAssistantText(
          taskId,
          'اطلاعات پیامک نامعتبر است. لطفاً دوباره تلاش کنید.',
        );
        break;
      }

      // Resolve contactName → phoneNumber when needed.
      // Contacts permission is already guaranteed by `checkAndEnsurePermission`
      // for the SEND_SMS action, so we do NOT re-check it here — doing so
      // used to introduce a first-time race where PermissionsAndroid.check
      // could briefly report the permission as missing right after grant.
      if (!phoneNumber && contactName) {
        try {
          const matches = await getByName(contactName);
          if (!matches.length) {
            Toast.show({
              type: 'info',
              text1: `تماس با ${contactName} ممکن نیست. شماره‌ای یافت نشد.`,
              text2Style: {
                fontFamily: typography.fontFamily,
                fontSize: 14,
              },
              visibilityTime: 3000,
            });
            Logger.error(`Contact not found: ${contactName}`);
            addAssistantText(taskId, `مخاطبی با نام مورد نظر پیدا نشد.`);
            break;
          }
          const first = matches[0];
          if (!first.phoneNumbers?.length) {
            Logger.error(`No phone number found for send SMS: ${contactName}`);
            addAssistantText(
              taskId,
              `برای مخاطب مورد نظر شماره‌ای ثبت نشده است.`,
            );
            break;
          }
          phoneNumber = first.phoneNumbers[0].number;
        } catch (error) {
          Logger.error('Failed to look up contact for SMS', { error });
          addAssistantText(taskId, 'در جستجوی مخاطب مشکلی پیش آمد.');
          break;
        }
      }

      if (!phoneNumber) {
        Logger.error('No phone number resolved for SMS', { payload });
        addAssistantText(taskId, 'شماره تلفن مقصد پیدا نشد.');
        break;
      }

      Logger.success('Valid SMS data:', { phoneNumber, message, contactName });
      sendSMSWithLinking(phoneNumber, message);

      const smsConfirmationText = contactName
        ? `پیامک برای ${contactName} آماده ارسال است.`
        : 'پیامک آماده ارسال است.';
      addAssistantText(taskId, smsConfirmationText);
      break;
    }

    /**
     * ===========================
     * MAKE CALL
     * ===========================
     */
    case 'make_call': {
      let { contact, phoneNumber } = payload.call || {};
      if (!payload.call || (!contact && !phoneNumber)) {
        Logger.error('Invalid call data', { payload });
        addAssistantText(
          taskId,
          'اطلاعات تماس نامعتبر است. لطفاً دوباره تلاش کنید.',
        );
        break;
      }

      // Resolve contact → phoneNumber when needed. Contacts permission is
      // already guaranteed upstream by `checkAndEnsurePermission`.
      if (!phoneNumber && contact) {
        try {
          const matches = await getByName(contact);
          if (!matches.length) {
            Toast.show({
              type: 'info',
              text1: `تماس با ${contact} ممکن نیست. شماره‌ای یافت نشد.`,
              text2Style: {
                fontFamily: typography.fontFamily,
                fontSize: 14,
              },
              visibilityTime: 3000,
            });
            Logger.error(`Contact not found: ${contact}`);
            addAssistantText(taskId, `مخاطبی با نام مورد نظر پیدا نشد.`);
            break;
          }
          const first = matches[0];
          if (!first.phoneNumbers?.length) {
            Logger.error(`No phone number found for contact: ${contact}`);
            addAssistantText(
              taskId,
              `برای مخاطب مورد نظر شماره‌ای ثبت نشده است.`,
            );
            break;
          }
          phoneNumber = first.phoneNumbers[0].number;
        } catch (error) {
          Logger.error('Failed to look up contact for call', { error });
          addAssistantText(taskId, 'در جستجوی مخاطب مشکلی پیش آمد.');
          break;
        }
      }

      if (!phoneNumber) {
        Logger.error(`No valid phone number found for call: ${contact}`, {
          payload,
        });
        addAssistantText(taskId, 'شماره تلفن مقصد پیدا نشد.');
        break;
      }

      Logger.success('Valid call data', { phoneNumber, contact });
      makeCallWithLinking(phoneNumber);

      const callConfirmationText = contact
        ? `تماس با ${contact} برقرار می‌شود...`
        : 'تماس برقرار می‌شود...';
      addAssistantText(taskId, callConfirmationText);
      break;
    }

    /**
     * ===========================
     * SEND EMAIL
     * ===========================
     */
    case 'send_email': {
      const { email, subject, body, cc, bcc } = payload || {};
      if (!payload || !email || !body) {
        Logger.error('Invalid email data:', { payload });
        addAssistantText(
          taskId,
          'اطلاعات ایمیل نامعتبر است. لطفاً دوباره تلاش کنید.',
        );
        break;
      }
      Logger.success('Valid email data:', { payload });
      sendEmailWithLinking({ email, subject, body, cc, bcc });

      const emailConfirmationText = subject
        ? `ایمیل با موضوع "${subject}" آماده ارسال است.`
        : 'ایمیل آماده ارسال است.';
      addAssistantText(taskId, emailConfirmationText);
      break;
    }

    /**
     * ===========================
     * MESSAGE TO USER  (backward-compat fallback for legacy server responses)
     * ===========================
     */
    case 'message_to_user': {
      const text = payload.message_to_user ?? payload.message ?? '';
      if (!taskId || !text) {
        Logger.error('Invalid message_to_user data:', { payload });
        break;
      }

      Logger.info('Sending message_to_user via ON_DEVICE fallback', {
        taskId,
        preview: text.substring(0, 50),
      });

      const { addMessage } = useStore.getState();
      const fallbackMessage: Message = {
        id: Date.now().toString(),
        taskId,
        text,
        isUser: false,
        toolType: 'TEXT',
        timestamp: new Date().toISOString(),
      };
      addMessage(taskId, fallbackMessage);
      break;
    }

    /**
     * ===========================
     * DEFAULT
     * ===========================
     */
    default:
      Logger.warn('Unhandled ON_DEVICE intent:', { payload });
      break;
  }
}
