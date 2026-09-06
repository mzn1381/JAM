import { clsx } from 'clsx'
import { LifeBuoy, LogOut } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router-dom'

import { sidebarMenuItems } from '../../utils/dashboardData'

type SidebarProps = {
  isMobileOpen: boolean
  onCloseMobile: () => void
  onLogout: () => void
}

type SidebarContentProps = Omit<SidebarProps, 'isMobileOpen'> & {
  compact?: boolean
}
/* ... existing imports ... */

function SidebarContent({
  onCloseMobile,
  onLogout,
  compact,
}: SidebarContentProps) {
  const { pathname } = useLocation()
  const { t, i18n } = useTranslation()
  const isRtl = i18n.dir() === 'rtl'

  return (
    <div className="flex h-full flex-col bg-admin-sidebar text-admin-sidebar-foreground">
      <div className="border-b border-white/10 px-5 py-6">
        <div
          className={clsx(
            'flex items-center gap-3',
            // Remove flex-row-reverse here
            !compact && isRtl && 'text-right',
            compact && 'justify-center',
          )}
        >
          {!compact ? (
            <div className={clsx(isRtl && 'text-right')}>
              <p className="text-[25px] font-extrabold leading-none text-admin-accent-light">
                {t('app.name')}
              </p>
              <p className="mt-1 text-sm text-admin-sidebar-foreground/70">
                {t('app.panel')}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <nav className="px-3 py-4">
        <ul className="space-y-1.5">
          {sidebarMenuItems.map((item) => {
            const Icon = item.icon
            const isActive = item.path ? pathname === item.path : false

            if (!item.path) {
              return (
                <li key={item.key}>
                  <button
                    type="button"
                    className={clsx(
                      'flex h-12 w-full cursor-not-allowed items-center gap-3 rounded-lg px-4 text-sm font-semibold text-admin-sidebar-foreground/80 transition hover:bg-white/5',
                      // Remove flex-row-reverse here
                      !compact && isRtl && 'text-right',
                      compact && 'justify-center px-2',
                    )}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                    {!compact ? t(item.labelKey) : null}
                  </button>
                </li>
              )
            }

            return (
              <li key={item.key}>
                <Link
                  to={item.path}
                  onClick={onCloseMobile}
                  className={clsx(
                    'relative flex h-12 items-center gap-3 rounded-lg px-4 text-sm font-semibold transition',
                    // Remove flex-row-reverse here
                    !compact && isRtl && 'text-right',
                    compact && 'justify-center px-2',
                    isActive
                      ? 'bg-admin-accent/20 text-admin-accent-light'
                      : 'text-admin-sidebar-foreground/80 hover:bg-white/5',
                  )}
                >
                  {/* ... active indicator ... */}
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  {!compact ? t(item.labelKey) : null}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="mt-auto border-t border-white/10 p-5">
        {/* ... upgrade button ... */}
        <Link
          to="/support"
          onClick={onCloseMobile}
          className={clsx(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-admin-sidebar-foreground/80 hover:bg-white/5',
            // Remove flex-row-reverse here
            !compact && isRtl && 'text-right',
            compact && 'justify-center px-1',
            pathname === '/support' &&
              'bg-admin-accent/20 text-admin-accent-light',
          )}
        >
          <LifeBuoy className="h-4 w-4" aria-hidden="true" />
          {!compact ? t('dashboard.support') : null}
        </Link>
        <button
          type="button"
          onClick={onLogout}
          className={clsx(
            'mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-red-500 hover:bg-white/5',
            // Remove flex-row-reverse here
            !compact && isRtl && 'text-right',
            compact && 'justify-center px-1',
          )}
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          {!compact ? t('dashboard.logout') : null}
        </button>
      </div>
    </div>
  )
}
/* ... Sidebar export ... */
export default function Sidebar({
  isMobileOpen,
  onCloseMobile,
  onLogout,
}: SidebarProps) {
  const { i18n } = useTranslation()
  const isRtl = i18n.dir() === 'rtl'

  return (
    <>
      <aside
        className={clsx(
          'fixed inset-y-0 z-30 hidden w-[280px] lg:block',
          isRtl ? 'right-0' : 'left-0',
        )}
      >
        <SidebarContent onCloseMobile={onCloseMobile} onLogout={onLogout} />
      </aside>

      <div
        className={clsx(
          'fixed inset-0 z-40 flex bg-black/40 transition lg:hidden',
          isRtl ? 'justify-end' : 'justify-start',
          isMobileOpen ? 'visible opacity-100' : 'invisible opacity-0',
        )}
        onClick={onCloseMobile}
        aria-hidden="true"
      >
        <aside
          className={clsx(
            'h-full w-[280px] transition-transform',
            isMobileOpen
              ? 'translate-x-0'
              : isRtl
                ? 'translate-x-full'
                : '-translate-x-full',
          )}
          onClick={(event) => event.stopPropagation()}
        >
          <SidebarContent onCloseMobile={onCloseMobile} onLogout={onLogout} />
        </aside>
      </div>
    </>
  )
}
