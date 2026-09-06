export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  isOnboarded: boolean;
  roles?: string[];
  status?: 'GUEST' | 'ACTIVE';
}

export interface UserResponse {
  data: User;
  success: boolean;
  message: string;
  errorCode: number;
  traceId?: string;
}

export interface IdentityUserInfoErrorResponse {
  success: false;
  message?:
    | string
    | {
        code?: string;
        message?: string;
      };
  errorCode?: number;
  traceId?: string;
}

// src/types/UserContext.ts
export interface UserContextRequest {
  preferencesItems: Record<string, boolean>;
}

export interface UserContextResponse {
  data: boolean;
  success: boolean;
  message: string;
  traceId?: string;
}
