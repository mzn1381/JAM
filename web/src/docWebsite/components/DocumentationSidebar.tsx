import { clsx } from 'clsx'
import { BookText, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'

import { documentationEntries } from '../utils/documentationRegistry'

type DocumentationSidebarProps = {
  isMobileOpen: boolean
  onCloseMobile: () => void
}

function DocumentationNavigation({
  onNavigate,
}: {
  onNavigate: () => void
}) {
  const { t } = useTranslation()

  return (
    <nav aria-label={t('documentation.navigation')}>
      <p className="mb-3 px-3 text-xs font-bold uppercase text-admin-muted">
        {t('documentation.navigation')}
      </p>
      <ul className="space-y-1">
        {documentationEntries.map((document) => (
          <li key={document.slug}>
            <NavLink
              to={`/docs/${document.slug}`}
              onClick={onNavigate}
              className={({ isActive }) =>
                clsx(
                  'flex items-start gap-3 rounded-lg px-3 py-3 text-sm font-semibold leading-6 transition',
                  isActive
                    ? 'bg-admin-accent/10 text-admin-accent'
                    : 'text-admin-muted hover:bg-admin-bg hover:text-admin-ink',
                )
              }
            >
              <BookText className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{t(document.labelKey)}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default function DocumentationSidebar({
  isMobileOpen,
  onCloseMobile,
}: DocumentationSidebarProps) {
  const { t, i18n } = useTranslation()
  const isRtl = i18n.dir() === 'rtl'

  return (
    <>
      <aside
        className={clsx(
          'fixed bottom-0 top-[72px] z-20 hidden w-[280px] border-admin-border bg-white px-4 py-7 lg:block',
          isRtl ? 'right-0 border-l' : 'left-0 border-r',
        )}
      >
        <DocumentationNavigation onNavigate={onCloseMobile} />
      </aside>

      <div
        className={clsx(
          'fixed inset-0 z-40 bg-black/40 transition lg:hidden',
          isMobileOpen ? 'visible opacity-100' : 'invisible opacity-0',
        )}
        onClick={onCloseMobile}
        aria-hidden={!isMobileOpen}
      >
        <aside
          className={clsx(
            'absolute inset-y-0 w-[min(320px,85vw)] bg-white px-4 py-5 shadow-xl transition-transform',
            isRtl ? 'right-0' : 'left-0',
            isMobileOpen
              ? 'translate-x-0'
              : isRtl
                ? 'translate-x-full'
                : '-translate-x-full',
          )}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mb-6 flex items-center justify-between gap-4 border-b border-admin-border pb-4">
            <p className="font-bold text-admin-ink">
              {t('documentation.navigation')}
            </p>
            <button
              type="button"
              onClick={onCloseMobile}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-admin-muted hover:bg-admin-bg hover:text-admin-ink"
              aria-label={t('documentation.closeNavigation')}
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <DocumentationNavigation onNavigate={onCloseMobile} />
        </aside>
      </div>
    </>
  )
}