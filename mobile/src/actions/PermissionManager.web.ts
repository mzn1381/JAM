/**
 * Web fallback for PermissionManager (native uses react-native-permissions).
 *
 * The browser has no equivalent runtime-permission model — individual web APIs
 * prompt on demand (e.g. Notifications, Contact Picker). So on web every action
 * is reported as GRANTED and callers proceed to the corresponding web tool,
 * which itself degrades gracefully if the underlying capability is missing.
 *
 * The public API (types + PermissionManager methods used across the app)
 * matches ./PermissionManager (native) so shared code compiles unchanged.
 */

// Action types (kept in sync with ./PermissionManager)
export type PermissionAction =
  | 'SET_ALARM'
  | 'SEND_SMS'
  | 'ADD_CALENDAR_EVENT'
  | 'MAKING_CALL'
  | 'SEND_EMAIL_WITH_LINKING'
  | 'LOG'
  | 'NOTIFY_USER'
  | 'CONTACTS'
  | 'MESSAGE_TO_USER';

export enum PermissionStatus {
  GRANTED = 'granted',
  DENIED = 'denied',
  BLOCKED = 'blocked',
  UNAVAILABLE = 'unavailable',
  GRANTED_LIMITED = 'grantedLimited',
}

export interface PermissionResponse {
  status: PermissionStatus;
  isGranted: boolean;
  action: PermissionAction;
  platform: 'android' | 'ios' | 'web';
}

export interface BatchPermissionResponse {
  allGranted: boolean;
  partiallyGranted: boolean;
  results: PermissionResponse[];
}

const grantedResponse = (action: PermissionAction): PermissionResponse => ({
  status: PermissionStatus.GRANTED,
  isGranted: true,
  action,
  platform: 'web',
});

export class PermissionManager {
  static async checkPermission(): Promise<PermissionStatus> {
    return PermissionStatus.GRANTED;
  }

  static async requestPermission(): Promise<PermissionStatus> {
    return PermissionStatus.GRANTED;
  }

  static async checkActionPermission(
    action: PermissionAction,
  ): Promise<PermissionResponse> {
    return grantedResponse(action);
  }

  static async requestActionPermissions(
    action: PermissionAction,
  ): Promise<PermissionResponse> {
    return grantedResponse(action);
  }

  static async checkMultipleActions(
    actions: PermissionAction[],
  ): Promise<BatchPermissionResponse> {
    return {
      allGranted: true,
      partiallyGranted: false,
      results: actions.map(grantedResponse),
    };
  }

  static async requestMultipleActions(
    actions: PermissionAction[],
  ): Promise<BatchPermissionResponse> {
    return {
      allGranted: true,
      partiallyGranted: false,
      results: actions.map(grantedResponse),
    };
  }

  static async ensurePermission(_action: PermissionAction): Promise<boolean> {
    // Always allow on web; the target tool handles graceful degradation.
    return true;
  }

  static async getPermissionDetails(action: PermissionAction): Promise<{
    action: PermissionAction;
    android: {
      permissions: string[];
      status: Record<string, PermissionStatus>;
    };
    ios: { permissions: string[]; status: Record<string, PermissionStatus> };
  }> {
    return {
      action,
      android: { permissions: [], status: {} },
      ios: { permissions: [], status: {} },
    };
  }
}
