import { Platform } from 'react-native';
import {
  check,
  checkMultiple,
  request,
  requestMultiple,
  PERMISSIONS,
  RESULTS,
  Permission,
} from 'react-native-permissions';

// Action types
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

// Permission status enum
export enum PermissionStatus {
  GRANTED = 'granted',
  DENIED = 'denied',
  BLOCKED = 'blocked',
  UNAVAILABLE = 'unavailable',
  GRANTED_LIMITED = 'grantedLimited',
}

// Response interface
export interface PermissionResponse {
  status: PermissionStatus;
  isGranted: boolean;
  action: PermissionAction;
  platform: 'android' | 'ios';
}

// Batch check response
export interface BatchPermissionResponse {
  allGranted: boolean;
  partiallyGranted: boolean;
  results: PermissionResponse[];
}

// Map actions to required permissions per platform
class PermissionMap {
  private static actionPermissionMap: Record<
    PermissionAction,
    {
      android: Permission[];
      ios: Permission[];
    }
  > = {
    SET_ALARM: {
      android: ['android.permission.SCHEDULE_EXACT_ALARM' as any],
      ios: [], // iOS doesn't require permission for alarms
    },
    SEND_SMS: {
      // Composing via `sms:` Linking does NOT require SEND_SMS at runtime.
      // We only need READ_CONTACTS to resolve contactName → phone number.
      android: [PERMISSIONS.ANDROID.READ_CONTACTS],
      ios: [], // iOS doesn't have explicit SMS permission
    },
    ADD_CALENDAR_EVENT: {
      android: [
        PERMISSIONS.ANDROID.READ_CALENDAR,
        PERMISSIONS.ANDROID.WRITE_CALENDAR,
      ],
      ios: [],
    },
    LOG: {
      android: [],
      ios: [],
    },
    NOTIFY_USER: {
      android: ['android.permission.POST_NOTIFICATIONS' as any],
      ios: [], // iOS handles notifications through system settings
    },
    MAKING_CALL: {
      // `tel:` Linking does not require CALL_PHONE at runtime; only
      // READ_CONTACTS is needed to resolve contact → number.
      android: [PERMISSIONS.ANDROID.READ_CONTACTS],
      ios: [],
    },
    SEND_EMAIL_WITH_LINKING: {
      android: [],
      ios: [],
    },
    CONTACTS: {
      android: [PERMISSIONS.ANDROID.READ_CONTACTS],
      ios: [],
    },
    MESSAGE_TO_USER: {
      android: [],
      ios: [],
    },
  };

  static getPermissionsForAction(action: PermissionAction): Permission[] {
    const platform = Platform.OS as 'android' | 'ios';
    return this.actionPermissionMap[action]?.[platform] ?? [];
  }

  static getAllPermissionsForAction(action: PermissionAction): {
    android: Permission[];
    ios: Permission[];
  } {
    return this.actionPermissionMap[action];
  }
}

// Main Permission Manager class
export class PermissionManager {
  /**
   * Convert react-native-permissions RESULTS to our PermissionStatus
   */
  private static mapResultToStatus(
    result: (typeof RESULTS)[keyof typeof RESULTS],
  ): PermissionStatus {
    switch (result) {
      case RESULTS.GRANTED:
        return PermissionStatus.GRANTED;
      case RESULTS.DENIED:
        return PermissionStatus.DENIED;
      case RESULTS.BLOCKED:
        return PermissionStatus.BLOCKED;
      case RESULTS.UNAVAILABLE:
        return PermissionStatus.UNAVAILABLE;
      //   case RESULTS.GRANTED_LIMITED:
      //     return PermissionStatus.GRANTED_LIMITED;
      default:
        return PermissionStatus.DENIED;
    }
  }

  /**
   * Check if a specific permission is granted
   */
  static async checkPermission(
    permission: Permission,
  ): Promise<PermissionStatus> {
    try {
      const result = await check(permission);
      return this.mapResultToStatus(result);
    } catch (error) {
      console.error(`Error checking permission: ${permission}`, error);
      return PermissionStatus.DENIED;
    }
  }

  /**
   * Request a specific permission
   */
  static async requestPermission(
    permission: Permission,
  ): Promise<PermissionStatus> {
    try {
      const result = await request(permission);
      return this.mapResultToStatus(result);
    } catch (error) {
      console.error(`Error requesting permission: ${permission}`, error);
      return PermissionStatus.DENIED;
    }
  }

  /**
   * Aggregate an object of per-permission statuses into a single response.
   * Uses "most restrictive wins" so the caller sees
   * BLOCKED > DENIED > UNAVAILABLE > GRANTED_LIMITED > GRANTED.
   */
  private static aggregateStatuses(
    action: PermissionAction,
    perPermission: Record<string, PermissionStatus>,
  ): PermissionResponse {
    const platform = Platform.OS as 'android' | 'ios';
    const statuses = Object.values(perPermission);

    const isGranted =
      statuses.length > 0 &&
      statuses.every(
        s =>
          s === PermissionStatus.GRANTED ||
          s === PermissionStatus.GRANTED_LIMITED,
      );

    const status = statuses.includes(PermissionStatus.BLOCKED)
      ? PermissionStatus.BLOCKED
      : statuses.includes(PermissionStatus.DENIED)
      ? PermissionStatus.DENIED
      : statuses.includes(PermissionStatus.UNAVAILABLE)
      ? PermissionStatus.UNAVAILABLE
      : statuses.some(s => s === PermissionStatus.GRANTED_LIMITED)
      ? PermissionStatus.GRANTED_LIMITED
      : PermissionStatus.GRANTED;

    return { status, isGranted, action, platform };
  }

  /**
   * Check permission status for an action.
   *
   * Uses `checkMultiple` so all permissions are queried in a single native
   * call — no parallel promises, no race conditions.
   */
  static async checkActionPermission(
    action: PermissionAction,
  ): Promise<PermissionResponse> {
    const permissions = PermissionMap.getPermissionsForAction(action);
    const platform = Platform.OS as 'android' | 'ios';

    // Handle actions without platform-specific permissions
    if (permissions.length === 0) {
      return {
        status: PermissionStatus.GRANTED,
        isGranted: true,
        action,
        platform,
      };
    }

    try {
      const raw = await checkMultiple(permissions);
      const mapped: Record<string, PermissionStatus> = {};
      for (const perm of permissions) {
        mapped[perm] = this.mapResultToStatus(raw[perm]);
      }
      return this.aggregateStatuses(action, mapped);
    } catch (error) {
      console.error(`Error checking action permission for ${action}:`, error);
      return {
        status: PermissionStatus.DENIED,
        isGranted: false,
        action,
        platform,
      };
    }
  }

  /**
   * Request all permissions for an action.
   *
   * IMPORTANT: Uses `requestMultiple` which delegates to a SINGLE native
   * `ActivityCompat.requestPermissions` call with one request code. This is
   * the only race-free way to request multiple runtime permissions on
   * Android. Prior implementations that used `Promise.all(perms.map(request))`
   * caused an infinite-loading bug on the first-time grant because one of
   * the parallel native calls could get its result dropped and its promise
   * would never resolve — leaving the caller (and the chat's loading
   * indicator) hanging forever until the screen was recreated.
   */
  static async requestActionPermissions(
    action: PermissionAction,
  ): Promise<PermissionResponse> {
    const permissions = PermissionMap.getPermissionsForAction(action);
    const platform = Platform.OS as 'android' | 'ios';

    // Handle actions without platform-specific permissions
    if (permissions.length === 0) {
      return {
        status: PermissionStatus.GRANTED,
        isGranted: true,
        action,
        platform,
      };
    }

    try {
      const raw = await requestMultiple(permissions);
      const mapped: Record<string, PermissionStatus> = {};
      for (const perm of permissions) {
        mapped[perm] = this.mapResultToStatus(raw[perm]);
      }
      return this.aggregateStatuses(action, mapped);
    } catch (error) {
      console.error(
        `Error requesting action permissions for ${action}:`,
        error,
      );
      return {
        status: PermissionStatus.DENIED,
        isGranted: false,
        action,
        platform,
      };
    }
  }

  /**
   * Batch check multiple actions
   */
  static async checkMultipleActions(
    actions: PermissionAction[],
  ): Promise<BatchPermissionResponse> {
    const results = await Promise.all(
      actions.map(action => this.checkActionPermission(action)),
    );

    const allGranted = results.every(r => r.isGranted);
    const partiallyGranted = results.some(r => r.isGranted) && !allGranted;

    return {
      allGranted,
      partiallyGranted,
      results,
    };
  }

  /**
   * Batch request multiple actions
   */
  static async requestMultipleActions(
    actions: PermissionAction[],
  ): Promise<BatchPermissionResponse> {
    const results = await Promise.all(
      actions.map(action => this.requestActionPermissions(action)),
    );

    const allGranted = results.every(r => r.isGranted);
    const partiallyGranted = results.some(r => r.isGranted) && !allGranted;

    return {
      allGranted,
      partiallyGranted,
      results,
    };
  }

  /**
   * Check and request permissions with fallback logic
   * Returns true only if permission is granted
   */
  static async ensurePermission(action: PermissionAction): Promise<boolean> {
    try {
      // First check if already granted
      const checkResponse = await this.checkActionPermission(action);
      if (checkResponse.isGranted) {
        return true;
      }

      // If blocked, log and return false (user needs to manually enable)
      if (checkResponse.status === PermissionStatus.BLOCKED) {
        console.warn(
          `Permission for ${action} is blocked. User must enable in settings.`,
        );
        return false;
      }

      // If unavailable on this platform
      if (checkResponse.status === PermissionStatus.UNAVAILABLE) {
        console.info(
          `Permission for ${action} is unavailable on this platform.`,
        );
        return true; // Treat as success since it's not applicable
      }

      // Request permission
      const requestResponse = await this.requestActionPermissions(action);
      return requestResponse.isGranted;
    } catch (error) {
      console.error(`Error ensuring permission for ${action}:`, error);
      return false;
    }
  }

  /**
   * Get permission details for debugging
   */
  static async getPermissionDetails(action: PermissionAction): Promise<{
    action: PermissionAction;
    android: {
      permissions: Permission[];
      status: Record<string, PermissionStatus>;
    };
    ios: {
      permissions: Permission[];
      status: Record<string, PermissionStatus>;
    };
  }> {
    const allPerms = PermissionMap.getAllPermissionsForAction(action);

    const androidStatus: Record<string, PermissionStatus> = {};
    for (const perm of allPerms.android) {
      androidStatus[perm] = await this.checkPermission(perm);
    }

    const iosStatus: Record<string, PermissionStatus> = {};
    for (const perm of allPerms.ios) {
      iosStatus[perm] = await this.checkPermission(perm);
    }

    return {
      action,
      android: { permissions: allPerms.android, status: androidStatus },
      ios: { permissions: allPerms.ios, status: iosStatus },
    };
  }
}

// Usage example (not executed):
/*
// Check single action
const result = await PermissionManager.checkActionPermission('SET_ALARM');
if (result.isGranted) {
  // Proceed with alarm
}

// Request with fallback
const isGranted = await PermissionManager.ensurePermission('SEND_SMS');

// Batch operations
const batch = await PermissionManager.requestMultipleActions([
  'SET_ALARM',
  'SEND_SMS',
  'ADD_CALENDAR_EVENT',
]);

if (batch.allGranted) {
  // All permissions granted
} else if (batch.partiallyGranted) {
  // Some permissions granted
}

// Debug
const details = await PermissionManager.getPermissionDetails('ADD_CALENDAR_EVENT');
console.log(details);
*/
