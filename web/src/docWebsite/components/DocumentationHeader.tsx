import { ArrowLeft, ArrowRight, BookOpen, Menu } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import LanguageSwitch from '../../admin/components/ui/LanguageSwitch'

type DocumentationHeaderProps = {
  onOpenSidebar: () => void
}

export default function DocumentationHeader({
  onOpenSidebar,
}: DocumentationHeaderProps) {
  const { t, i18n } = useTranslation()
  const isRtl = i18n.dir() === 'rtl'
  const BackIcon = isRtl ? ArrowRight : ArrowLeft

  return (
    <header className="fixed inset-x-0 top-0 z-30 h-[72px] border-b border-admin-border bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-full w-full max-w-[1800px] items-center justify-between gap-4 px-4 md:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-admin-border text-admin-ink lg:hidden"
            aria-label={t('documentation.openNavigation')}
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>

          <Link to="/docs" className="flex min-w-0 items-center gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-admin-sidebar text-admin-accent-light">
              <BookOpen className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-base font-bold text-admin-ink">
                {t('app.name')}
              </span>
              <span className="block truncate text-xs font-medium text-admin-muted">
                {t('documentation.title')}
              </span>
            </span>
          </Link>
        </div>

        <div className="flex shrink-0 items-center gap-2 md:gap-4">
          <Link
            to="/"
            className="inline-flex h-10 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-admin-muted transition hover:bg-admin-bg hover:text-admin-ink md:px-3"
          >
            <BackIcon className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">
              {t('documentation.backToApp')}
            </span>
          </Link>
          <LanguageSwitch />
        </div>
      </div>
    </header>
  )
}