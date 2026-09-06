import { clsx } from 'clsx'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet } from 'react-router-dom'

import DocumentationHeader from '../components/DocumentationHeader'
import DocumentationSidebar from '../components/DocumentationSidebar'

export default function DocumentationLayout() {
  const [isSidebarOpen, setSidebarOpen] = useState(false)
  const { i18n } = useTranslation()
  const isRtl = i18n.dir() === 'rtl'

  return (
    <div className="min-h-screen bg-white text-admin-ink">
      <DocumentationHeader onOpenSidebar={() => setSidebarOpen(true)} />
      <DocumentationSidebar
        isMobileOpen={isSidebarOpen}
        onCloseMobile={() => setSidebarOpen(false)}
      />

      <main
        className={clsx(
          'min-h-screen pt-[72px]',
          isRtl ? 'lg:pr-[280px]' : 'lg:pl-[280px]',
        )}
      >
        <div className="px-5 py-8 md:px-10 md:py-12 xl:px-16">
          <Outlet />
        </div>
      </main>
    </div>
  )
}