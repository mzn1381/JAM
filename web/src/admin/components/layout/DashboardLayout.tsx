import { clsx } from 'clsx'
import { useState, type PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'

import { useLogoutMutation } from '../../hooks/useLogoutMutation'
import Header from './Header'
import Sidebar from './Sidebar'

export default function DashboardLayout({ children }: PropsWithChildren) {
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const logoutMutation = useLogoutMutation()
  const { i18n } = useTranslation()
  const isRtl = i18n.dir() === 'rtl'

  const handleLogout = () => {
    logoutMutation.mutate()
  }

  return (
    <div className="flex min-h-screen flex-col bg-admin-bg text-admin-ink">
      <Header onOpenSidebar={() => setMobileSidebarOpen(true)} />

      <Sidebar
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        onLogout={handleLogout}
      />

      <main
        className={clsx(
          'flex-1 pt-[80px]',
          isRtl ? 'lg:pr-[280px]' : 'lg:pl-[280px]',
        )}
      >
        <section className="px-4 py-5 md:px-8 md:py-7">
          <div className="mx-auto w-full max-w-[1800px]">{children}</div>
        </section>
      </main>
    </div>
  )
}
