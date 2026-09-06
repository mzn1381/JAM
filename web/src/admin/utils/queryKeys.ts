export const authQueryKeys = {
  identityUserInfo: ['auth', 'identity-user-info'] as const,
}

export const apiKeysQueryKeys = {
  all: ['usage', 'api-keys'] as const,
  list: (organizationId: string, page: number, pageSize: number) =>
    [...apiKeysQueryKeys.all, organizationId, page, pageSize] as const,
}

export const dashboardQueryKeys = {
  all: ['usage', 'dashboard'] as const,
  detail: (userId: string, organizationId: string) =>
    [...dashboardQueryKeys.all, userId, organizationId] as const,
}
