import type { LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

type StatCardProps = {
  labelKey: string
  value: string
  suffixKey: string
  icon: LucideIcon
}

export default function StatCard({
  labelKey,
  value,
  suffixKey,
  icon: Icon,
}: StatCardProps) {
  const { t } = useTranslation()

  return (
    <article className="rounded-2xl border border-admin-border bg-white px-6 py-5 shadow-admin-card">
      <Icon
        className="mb-6 h-6 w-6 text-admin-border-strong"
        aria-hidden="true"
      />
      <p className="text-sm font-medium text-admin-muted">{t(labelKey)}</p>
      <h3 className="mt-1 text-[42px] font-extrabold leading-none tracking-tight text-admin-ink">
        {value}
      </h3>
      <p className="mt-2 text-sm font-semibold text-admin-accent">
        {t(suffixKey)}
      </p>
    </article>
  )
}
