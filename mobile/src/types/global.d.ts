declare global {
  interface Window {
    __APP_CONFIG__?: {
      API_BASE_URL?: string;
      BASE_SENTRY_DNS?: string;
      FF_SHOW_VOICE_BUTTON?: boolean;
    };
  }
}

export {};
