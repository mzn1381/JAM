import { clsx } from 'clsx'
import { Bell, Menu, UserRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { useAuth } from '../../hooks/useAuth'
import LanguageSwitch from '../ui/LanguageSwitch'

type HeaderProps = {
  onOpenSidebar: () => void
}

export default function Header({ onOpenSidebar }: HeaderProps) {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const isRtl = i18n.dir() === 'rtl'
  const mobileIdentifier =
    user?.full_name || user?.phone_number || user?.email || ''

  return (
    <header className="fixed inset-x-0 top-0 z-20 h-[80px] border-b border-admin-border bg-white">
      <div
        className={clsx(
          'mx-auto flex h-full w-full max-w-[1800px] items-center justify-between gap-3 px-5 md:px-8',
          isRtl ? 'lg:pr-[280px]' : 'lg:pl-[280px]',
        )}
      >
        <div className="flex items-center gap-3 lg:hidden">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-admin-border text-admin-ink"
            aria-label={t('common.openMenu')}
          >
            <Menu className="h-5 w-5" />
          </button>
          <LanguageSwitch />
        </div>

        <div className="hidden items-center gap-4 lg:flex">
          <div className="inline-flex h-10 items-center rounded-full border border-admin-border bg-admin-bg px-4 text-xs font-semibold text-admin-ink">
            {t('header.subscription')}
          </div>
          <Bell className="h-5 w-5 text-admin-muted" aria-hidden="true" />
          <div className="h-8 w-px bg-admin-border" aria-hidden="true" />
          <nav className="flex items-center gap-4 text-sm font-medium text-admin-ink">
            <Link to="/docs" className="hover:text-admin-accent">
              {t('header.docs')}
            </Link>
            <button type="button" className="hover:text-admin-accent">
              {t('header.guide')}
            </button>
          </nav>
          <LanguageSwitch />
        </div>

        <div className="flex items-center gap-2 text-admin-ink">
          <div
            className="hidden flex-col text-right lg:flex"
            aria-label={t('header.userInfo')}
          >
            <span className="text-sm font-semibold">
              {mobileIdentifier ? mobileIdentifier : t('header.userName')}
            </span>
            <span className="text-xs font-medium text-admin-muted">
              {t('header.userRole')}
            </span>
          </div>
          <span className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-admin-border bg-admin-bg">
            <UserRound
              className="h-5 w-5 text-admin-muted"
              aria-hidden="true"
            />
          </span>
        </div>
      </div>
    </header>
  )
}
