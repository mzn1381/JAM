export interface Message {
  id: string;
  taskId: string;
  isUser: boolean;
  toolType: MessageType;
  text: string;
  status?: 'pending' | 'completed';
  isTemporary?: boolean;
  timestamp?: string;
  otpPayload?: OtpPayload;
  selectedMessage?: string;
  confirmationPayload?: ConfirmPayload;
  listOptionsPayload?: ListOptionPayload;
  cardViewPayload?: CardViewPayload;
  ondevicePayload?: {
    invocationJson: string;
  };
}

export type MessageType =
  | 'TEXT'
  | 'OTP'
  | 'CONFIRMATION'
  | 'LIST_OPTION'
  | 'CARD_VIEW'
  | 'ON_DEVICE';

// --- OTP (doc 3: resend code, configurable digit count) ---
export interface OtpPayload {
  length: number; // e.g. 5, matches the 5 boxes in the mockup
  resendLabel?: string; // "ارسال مجدد کد"
  expiresInSeconds?: number; // optional countdown before resend is enabled
  text?: string; // optional message to display above the OTP boxes
}

export interface ConfirmPayload {
  options: ConfirmOption[]; // typically exactly 2, but kept flexible
  text?: string; // optional message to display above the options
}

// --- CONFIRM (doc 2: بلی / خیر with security signal) ---
export interface ConfirmOption {
  id: string;
  label: string; // "بلی" | "خیر"
  icon: string; // MaterialIcon name e.g. "check_circle" | "cancel"
  variant: 'primary' | 'secondary'; // styling intent
}
export interface ListOptionPayload {
  text?: string; // "لطفاً بانک مورد نظر خود را انتخاب کنید:" (can also just use message.text)
  optionType: 'DEFAULT' | 'SIMPLE';
  options: ListOptionItem[];
  defaultOptionId?: string; // tracks user's selection once made
}

// --- LIST_OPTION (doc 4: bank selection list) ---
export interface ListOptionItem {
  id: string;
  title: string; // "بانک سامان - ۳۴۲"
  subtitle?: string; // "حساب جاری دیجیتال"
  subtitle2?: string; // "2حساب جاری دیجیتال"
  image?: string; // "account_balance",
  rating?: string; // optional SIMPLE card badge, e.g. "۴.۹"
  actionLabel?: string; // optional SIMPLE card CTA, e.g. مشاهده پروفایل
}

// --- CARD_VIEW (doctor profile / appointment card) ---
export interface CardMetric {
  label: string; // "سابقه فعالیت"
  value: string; // "۱۲ سال"
}

export interface CardViewPayload {
  id: string;
  type: 'DOCTOR_PROFILE';
  title: string; // "دکتر سارا احمدی"
  text?: string; // "متخصص پوست و مو"
  subtitle?: string; // "متخصص پوست و مو"
  rating?: string; // "۴.۸"
  image?: string;
  primaryMetric?: CardMetric; // e.g. experience
  secondaryMetric?: CardMetric; // e.g. successful patients
  description?: string;
  location?: string;
  actionLabel?: string; // "رزرو نوبت آنلاین"
  actionValue?: string; // optional command/url/id to send on tap
}

export interface NewMessage {
  chatId: string;
  tasks: [
    {
      chatId: string;
      message: string; //"set alarm at 10 am",
      intent: null;
      confidence: number;
      user_language: 'fa' | 'en' | 'ar';
    },
  ];
}
export interface ToolResponse extends Message {
  responseMessage: string;
  toolName: 'string';
}
/**
 * @property  responseMessage => note: it's a stringified JSON
 */
export interface MessageResponse {
  data: {
    tools: ToolResponse[];
    totalTokensUsed: number;
    totalDurationMs: number;
  };
  success: boolean;
  message: string;
  traceId?: string;
}

export type VoiceRecordingState =
  | 'idle'
  | 'recording'
  | 'paused'
  | 'processing'
  | 'ready'
  | 'sending'
  | 'error';

export type RecordedAudio =
  | {
      kind: 'file';
      uri: string;
      mimeType: 'audio/mp4';
      durationMs: number;
      platform: 'android' | 'ios';
    }
  | {
      kind: 'blob';
      uri: string;
      mimeType: string;
      durationMs: number;
      platform: 'web';
      blob: Blob;
    };

export interface VoiceRecordingDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSend: (transcription: string) => void | Promise<void>;
  onAudioRecorded?: (audio: RecordedAudio | null) => void;
  maxRecordingDuration?: number;
}

export interface VoiceVisualizationProps {
  active: boolean;
  color: string;
  backgroundColor: string;
}
