'use client'

import { usePathname } from 'next/navigation'
import { AppProviders } from '@/app/providers'
import { Navbar, Footer } from '@/components/layout'
import { PageTransition } from '@/components/layout/page-transition'
import type { ReactNode } from 'react'

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isDashboard = pathname.startsWith('/dashboard')
  const isEmployerDashboard = pathname.startsWith('/dashboard/employer')
  const showChrome = !isEmployerDashboard

  return (
    <AppProviders>
      {showChrome && <Navbar />}
      <main className={isEmployerDashboard ? '' : 'flex-1'}>
        {isEmployerDashboard ? children : <PageTransition>{children}</PageTransition>}
      </main>
      {showChrome && <Footer />}
    </AppProviders>
  )
}
