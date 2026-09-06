const ACCESS_TOKEN_STORAGE_KEY = 'admin_access_token'

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)
}

export function setAccessToken(token: string): void {
  localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token)
}

export function removeAccessToken(): void {
  localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY)
}
