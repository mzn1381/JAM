import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

import Button from '../components/ui/Button'
import DashboardLayout from '../components/layout/DashboardLayout'
import Input from '../components/ui/Input'
import { useAuth } from '../hooks/useAuth'
import { useApiKeysQuery } from '../hooks/useApiKeysQuery'
import { useCreateApiKeyMutation } from '../hooks/useCreateApiKeyMutation'
import { useDeleteApiKeyMutation } from '../hooks/useDeleteApiKeyMutation'
import {
  formatBackendDateTime,
  isBackendDateTimeExpired,
} from '../utils/dateTime'
import { getErrorMessage } from '../utils/httpError'
import type { ApiKey } from '../types/apiKeys'

type CreateApiKeyFormValues = {
  name: string
}

const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 20

type ApiKeyStatus = 'active' | 'revoked' | 'expired'

function getApiKeyStatus(key: ApiKey): ApiKeyStatus {
  if (key.revoked_at) {
    return 'revoked'
  }

  if (key.expires_at) {
    const isExpired = isBackendDateTimeExpired(key.expires_at)

    if (isExpired) {
      return 'expired'
    }
  }

  return 'active'
}

function getStatusClassName(status: ApiKeyStatus): string {
  if (status === 'revoked') {
    return 'bg-red-100 text-red-700'
  }

  if (status === 'expired') {
    return 'bg-amber-100 text-amber-700'
  }

  return 'bg-emerald-100 text-emerald-700'
}

export default function ApiKeysPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { organizationId } = useAuth()
  const [isAddKeyModalOpen, setIsAddKeyModalOpen] = useState(false)
  const [apiKeyPreview, setApiKeyPreview] = useState('')
  const [keyToDelete, setKeyToDelete] = useState<ApiKey | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateApiKeyFormValues>({
    defaultValues: {
      name: '',
    },
  })

  const apiKeysQuery = useApiKeysQuery({
    organizationId,
    page: DEFAULT_PAGE,
    pageSize: DEFAULT_PAGE_SIZE,
    enabled: Boolean(organizationId),
  })

  const createApiKeyMutation = useCreateApiKeyMutation({
    organizationId,
    onSuccess(response) {
      setIsAddKeyModalOpen(false)
      reset({ name: '' })
      setApiKeyPreview(response.data.api_key)
    },
  })

  const deleteApiKeyMutation = useDeleteApiKeyMutation({
    organizationId,
    onSuccess() {
      setKeyToDelete(null)
      toast.success(t('apiKeys.deleteSuccess'))
    },
  })

  const onSubmit = (values: CreateApiKeyFormValues) => {
    createApiKeyMutation.mutate({ name: values.name.trim() })
  }

  const handleCloseCreateModal = () => {
    setIsAddKeyModalOpen(false)
    reset({ name: '' })
  }

  const handleCopyApiKey = async () => {
    try {
      await navigator.clipboard.writeText(apiKeyPreview)
      toast.success(t('apiKeys.copied'))
    } catch {
      toast.error(t('apiKeys.copyFailed'))
    }
  }

  const formatDate = (value: string | null, fallbackKey: string) => {
    if (!value) {
      return t(fallbackKey)
    }

    const formatted = formatBackendDateTime(value, i18n.language)

    if (!formatted) {
      return t('apiKeys.unknownDate')
    }

    return formatted
  }

  const items = apiKeysQuery.data?.data.items ?? []
  const hasItems = items.length > 0
  const hasOrganizationId = Boolean(organizationId)

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-[28px] font-extrabold leading-none tracking-tight text-gray-600">
            {t('apiKeys.title')}
          </h1>
          <Button onClick={() => setIsAddKeyModalOpen(true)}>
            {t('apiKeys.addNewKey')}
          </Button>
        </div>

        <div className="rounded-xl bg-white p-5">
          {/* <h2 className="mb-4 text-xl font-bold text-admin-ink">
            {t('apiKeys.yourApiKeys')}
          </h2> */}

          {!hasOrganizationId ? (
            <div className="flex flex-wrap items-center justify-between space-y-3 rounded-xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm text-cyan-700">
              <p>{t('apiKeys.organizationError')}</p>
              <Button
                onClick={() => navigate('/support')}
                className="h-9"
                variant="secondary"
              >
                {t('support.contact')}
              </Button>
            </div>
          ) : null}

          {hasOrganizationId && apiKeysQuery.isPending ? (
            <div className="rounded-xl border border-admin-border px-4 py-8 text-center text-admin-muted">
              {t('apiKeys.initialLoading')}
            </div>
          ) : null}

          {hasOrganizationId && apiKeysQuery.isError ? (
            <div className="flex flex-wrap justify-between space-y-3 rounded-xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm text-cyan-700 sm:flex-nowrap sm:items-center sm:gap-3">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-cyan-700">
                  {t('apiKeys.errorTitle')}
                </p>
                <p className="text-sm text-cyan-700">
                  {getErrorMessage(apiKeysQuery.error)}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => apiKeysQuery.refetch()}
                  className="h-9"
                  variant="secondary"
                >
                  {t('apiKeys.retry')}
                </Button>
              </div>
            </div>
          ) : null}

          {hasOrganizationId && apiKeysQuery.isSuccess && !hasItems ? (
            <div className="rounded-xl border border-dashed border-admin-border px-4 py-8 text-center text-admin-muted">
              {t('apiKeys.emptyState')}
            </div>
          ) : null}

          {hasOrganizationId && apiKeysQuery.isSuccess && hasItems ? (
            <div className="overflow-x-auto rounded-xl border border-admin-border">
              <table className="min-w-full divide-y divide-admin-border text-sm">
                <thead className="bg-admin-bg">
                  <tr className="text-right text-admin-muted">
                    <th className="px-4 py-3 font-semibold">
                      {t('apiKeys.name')}
                    </th>
                    <th className="px-4 py-3 font-semibold">
                      {t('apiKeys.createdAt')}
                    </th>
                    <th className="px-4 py-3 font-semibold">
                      {t('apiKeys.lastUsed')}
                    </th>
                    <th className="px-4 py-3 font-semibold">
                      {t('apiKeys.expiration')}
                    </th>
                    <th className="px-4 py-3 font-semibold">
                      {t('apiKeys.status')}
                    </th>
                    <th className="px-4 py-3 font-semibold">
                      {t('apiKeys.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-admin-border bg-white text-admin-ink">
                  {items.map((key) => {
                    const status = getApiKeyStatus(key)

                    return (
                      <tr key={key.id}>
                        <td className="px-4 py-3 font-semibold">{key.name}</td>
                        <td className="px-4 py-3">
                          {formatDate(key.created_at, 'apiKeys.unknownDate')}
                        </td>
                        <td className="px-4 py-3">
                          {formatDate(key.last_used_at, 'apiKeys.neverUsed')}
                        </td>
                        <td className="px-4 py-3">
                          {formatDate(key.expires_at, 'apiKeys.noExpiration')}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClassName(status)}`}
                          >
                            {t(`apiKeys.statusValues.${status}`)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => setKeyToDelete(key)}
                            className="text-sm font-semibold text-red-600 transition hover:text-red-700"
                            disabled={deleteApiKeyMutation.isPending}
                          >
                            {t('apiKeys.delete')}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>

        {isAddKeyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-lg">
              <h2 className="mb-4 text-xl font-bold text-gray-600">
                {t('apiKeys.addNewKey')}
              </h2>

              <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                <Input
                  label={t('apiKeys.keyName')}
                  placeholder={t('apiKeys.enterKeyName')}
                  error={errors.name?.message}
                  disabled={createApiKeyMutation.isPending}
                  {...register('name', {
                    required: t('apiKeys.createKeyRequired'),
                    validate: (value) =>
                      value.trim().length > 0 || t('apiKeys.createKeyRequired'),
                  })}
                />

                {createApiKeyMutation.isError ? (
                  <div className="space-y-3 rounded-xl border border-cyan-100 bg-cyan-50 px-4 py-3">
                    <p className="text-sm text-cyan-700">
                      {getErrorMessage(createApiKeyMutation.error)}
                    </p>
                    <Button
                      type="button"
                      onClick={() => navigate('/support')}
                      className="h-9"
                      variant="secondary"
                    >
                      {t('support.contact')}
                    </Button>
                  </div>
                ) : null}

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCloseCreateModal}
                    className="inline-flex h-12 items-center justify-center rounded-xl border border-admin-border px-4 text-sm font-semibold text-admin-ink transition hover:bg-admin-bg"
                    disabled={createApiKeyMutation.isPending}
                  >
                    {t('apiKeys.cancel')}
                  </button>

                  <Button
                    type="submit"
                    disabled={createApiKeyMutation.isPending}
                  >
                    {createApiKeyMutation.isPending
                      ? t('apiKeys.creating')
                      : t('apiKeys.createKey')}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {apiKeyPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-lg">
              <h2 className="mb-3 text-xl font-bold text-gray-600">
                {t('apiKeys.createSuccessTitle')}
              </h2>
              <p className="mb-4 text-sm text-admin-muted">
                {t('apiKeys.createSuccessDescription')}
              </p>
              <div className="rounded-xl border border-admin-border bg-admin-bg p-3">
                <p className="mb-2 text-xs font-semibold text-admin-muted">
                  {t('apiKeys.apiKeyValue')}
                </p>
                <p className="break-all text-sm font-semibold text-admin-ink">
                  {apiKeyPreview}
                </p>
              </div>
              <div className="mt-5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setApiKeyPreview('')}
                  className="inline-flex h-12 items-center justify-center rounded-xl border border-admin-border px-4 text-sm font-semibold text-admin-ink transition hover:bg-admin-bg"
                >
                  {t('apiKeys.close')}
                </button>
                <Button onClick={handleCopyApiKey}>
                  {t('apiKeys.copyKey')}
                </Button>
              </div>
            </div>
          </div>
        )}

        {keyToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
              <h2 className="mb-3 text-xl font-bold text-gray-600">
                {t('apiKeys.deleteDialogTitle')}
              </h2>
              <p className="text-sm text-admin-muted">
                {t('apiKeys.deleteDialogMessage', { name: keyToDelete.name })}
              </p>
              {deleteApiKeyMutation.isError ? (
                <div className="mt-4 space-y-3 rounded-xl border border-cyan-100 bg-cyan-50 px-4 py-3">
                  <p className="text-sm text-cyan-700">
                    {getErrorMessage(deleteApiKeyMutation.error)}
                  </p>
                  <Button
                    type="button"
                    onClick={() => navigate('/support')}
                    className="h-9"
                    variant="secondary"
                  >
                    {t('support.contact')}
                  </Button>
                </div>
              ) : null}
              <div className="mt-5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setKeyToDelete(null)}
                  className="inline-flex h-12 items-center justify-center rounded-xl border border-admin-border px-4 text-sm font-semibold text-admin-ink transition hover:bg-admin-bg"
                  disabled={deleteApiKeyMutation.isPending}
                >
                  {t('apiKeys.cancel')}
                </button>
                <button
                  type="button"
                  onClick={() => deleteApiKeyMutation.mutate(keyToDelete.id)}
                  className="inline-flex h-12 items-center justify-center rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={deleteApiKeyMutation.isPending}
                >
                  {deleteApiKeyMutation.isPending
                    ? t('apiKeys.deleting')
                    : t('apiKeys.delete')}
                </button>
              </div>
            </div>
          </div>
        )}

        <footer className="pb-1 text-center text-xs font-medium text-admin-muted">
          {t('dashboard.footer')}
        </footer>
      </div>
    </DashboardLayout>
  )
}
