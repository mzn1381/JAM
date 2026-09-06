import { LifeBuoy, Mail, Phone } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import DashboardLayout from '../components/layout/DashboardLayout'

const SUPPORT_PHONE = '+98 992 105 1782'
const SUPPORT_EMAIL = 'mypishkar.co@gmail.com'

export default function SupportPage() {
  const { t } = useTranslation()

  return (
    <DashboardLayout>
      <div className="flex min-h-[calc(100vh-136px)] items-center justify-center py-6">
        <section className="w-full max-w-2xl rounded-xl border border-admin-border bg-white p-6 text-center shadow-admin-card sm:p-10">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-admin-accent/10 text-admin-accent">
            <LifeBuoy className="h-6 w-6" aria-hidden="true" />
          </div>

          <h1 className="mt-4 text-2xl font-bold text-admin-ink">
            {t('support.title')}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-admin-muted sm:text-base">
            {t('support.description')}
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <a
              href={`tel:${SUPPORT_PHONE.replace(/\s/g, '')}`}
              className="flex min-w-0 items-center justify-center gap-3 rounded-lg border border-admin-border px-4 py-3 text-admin-ink transition hover:border-admin-accent hover:text-admin-accent"
            >
              <Phone className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span className="min-w-0 text-start">
                <span className="block text-xs text-admin-muted">
                  {t('support.phone')}
                </span>
                <span
                  className="mt-1 block break-words text-sm font-semibold"
                  dir="ltr"
                >
                  {SUPPORT_PHONE}
                </span>
              </span>
            </a>

            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="flex min-w-0 items-center justify-center gap-3 rounded-lg border border-admin-border px-4 py-3 text-admin-ink transition hover:border-admin-accent hover:text-admin-accent"
            >
              <Mail className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span className="min-w-0 text-start">
                <span className="block text-xs text-admin-muted">
                  {t('support.email')}
                </span>
                <span
                  className="mt-1 block break-all text-sm font-semibold"
                  dir="ltr"
                >
                  {SUPPORT_EMAIL}
                </span>
              </span>
            </a>
          </div>
        </section>
      </div>
    </DashboardLayout>
  )
}
