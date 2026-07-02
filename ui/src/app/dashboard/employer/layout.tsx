'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { notificationsApi } from '@/lib/api'
import { useSocket } from '@/providers/socket-provider'
import { useAuth } from '@/providers/auth-provider'
import { EmployerProvider } from '@/providers/employer-provider'
import { useI18n } from '@/hooks/use-i18n'
import { timeAgo } from '@/lib/utils'
import type { Notification } from '@/types'
import {
  Briefcase,
  Building2,
  CalendarDays,
  HelpCircle,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Users,
  Bell,
  Search,
  Plus,
} from 'lucide-react'

function getNavItems(t: (key: string) => string) {
  return [
    { href: '/dashboard/employer', icon: LayoutDashboard, label: t('employer.nav.dashboard') },
    { href: '/dashboard/employer/jobs', icon: Briefcase, label: t('employer.nav.jobs') },
    { href: '/dashboard/employer/applicants', icon: Users, label: t('employer.nav.applicants') },
    { href: '/dashboard/employer/interviews', icon: CalendarDays, label: t('employer.nav.interviews') },
    { href: '/dashboard/employer/company', icon: Building2, label: t('employer.nav.company') },
    { href: '/dashboard/employer/api-keys', icon: KeyRound, label: t('employer.nav.apiKeys') },
  ]
}

function pageTitle(pathname: string, t: (key: string) => string) {
  if (pathname.endsWith('/settings')) return t('employer.nav.settings')
  if (pathname.endsWith('/api-keys')) return t('employer.nav.apiKeys')
  if (pathname.endsWith('/jobs/new')) return t('employer.pages.postJob')
  if (pathname.endsWith('/jobs')) return t('employer.pages.manageJobs')
  if (pathname.endsWith('/company')) return t('employer.pages.companyProfile')
  if (pathname.endsWith('/applicants')) return t('employer.pages.applicantList')
  if (pathname.endsWith('/interviews')) return t('employer.nav.interviews')
  return t('employer.nav.dashboard')
}


export default function EmployerDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const { socket } = useSocket()
  const { t } = useI18n()
  const navItems = getNavItems(t)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    notificationsApi.list().then((res) => setNotifications(res.data.notifications))
  }, [])

  // Real-time notification listener
  useEffect(() => {
    if (!socket) return
    const handleNotification = (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev])
    }
    socket.on('notification', handleNotification)
    return () => { socket.off('notification', handleNotification) }
  }, [socket])


  const unreadCount = notifications.filter((notification) => !notification.is_read).length

  useEffect(() => {
    if (!notificationOpen) return
    const onClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-recruiter-notification]')) setNotificationOpen(false)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [notificationOpen])

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  const title = pageTitle(pathname, t)

  return (
    <EmployerProvider>
      <div className="fixed inset-0 z-[60] flex overflow-hidden bg-background-recruiter text-on-surface">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <button
            type="button"
            aria-label="Tutup menu navigasi"
            className="fixed inset-0 z-20 bg-black/40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar: off-canvas on mobile, fixed on desktop */}
        <aside
          id="recruiter-sidebar"
          className={`fixed left-0 top-0 z-30 flex h-full w-[260px] flex-col bg-sidebar-navy py-6 shadow-2xl transition-transform duration-300 md:z-20 md:translate-x-0 md:shadow-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        >
          <div className="mb-8 flex items-center gap-3 px-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface text-sidebar-navy">
              <Briefcase className="h-5 w-5 fill-current" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold leading-8 text-on-primary">OpenJob</h1>
              <p className="text-[11px] font-bold leading-[14px] text-primary-fixed-dim">Recruiter Dashboard</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-2" aria-label="Navigasi recruiter">
            {navItems.map(({ href, icon: Icon, label }) => {
              const active = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setSidebarOpen(false)}
                  className={active
                    ? 'flex items-center gap-4 rounded-lg bg-primary-container px-4 py-2 text-sm font-bold leading-5 text-secondary-fixed opacity-80 transition-opacity'
                    : 'flex items-center gap-4 rounded-lg px-4 py-2 text-sm font-semibold leading-5 text-on-primary-container transition-colors hover:bg-primary-container'
                  }
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </Link>
              )
            })}
          </nav>

          <div className="mt-auto space-y-1 px-2 pb-6">
            <Link
              href="/dashboard/employer/settings"
              onClick={() => setSidebarOpen(false)}
              className={pathname.endsWith('/settings')
                ? 'flex items-center gap-4 rounded-lg bg-primary-container px-4 py-2 text-sm font-bold leading-5 text-secondary-fixed opacity-80 transition-opacity'
                : 'flex items-center gap-4 rounded-lg px-4 py-2 text-sm font-semibold leading-5 text-on-primary-container transition-colors hover:bg-primary-container'
              }
            >
              <Settings className="h-5 w-5" />
              {t('employer.nav.settings')}
            </Link>
            <button
              onClick={logout}
              className="flex w-full items-center gap-4 rounded-lg px-4 py-2 text-sm font-semibold leading-5 text-on-primary-container transition-colors hover:bg-primary-container"
            >
              <LogOut className="h-5 w-5" />
              {t('employer.nav.logout')}
            </button>
          </div>
        </aside>

        {/* Main content area */}
        <div className="flex min-h-screen flex-1 flex-col md:ml-[260px]">
          <header className="sticky top-0 z-10 flex min-h-16 shrink-0 items-center justify-between gap-3 border-b border-border-subtle bg-surface px-4 py-3 md:h-16 md:px-8 md:py-0">
            <div className="flex min-w-0 items-center gap-3 md:gap-8">
              {/* Hamburger — mobile only */}
              <button
                type="button"
                aria-label="Buka menu navigasi"
                aria-controls="recruiter-sidebar"
                aria-expanded={sidebarOpen}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border-subtle text-primary transition-colors hover:bg-surface-container-low md:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </button>
              <h2 className="truncate text-lg font-semibold leading-7 text-primary md:text-xl">{title}</h2>
              {pathname.endsWith('/jobs') && (
                <div className="relative hidden w-64 sm:block">
                  <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-outline" />
                  <input
                    className="w-full rounded border border-border-subtle bg-surface-container-lowest py-2 pl-10 pr-4 text-[13px] leading-[18px] text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-fixed/50"
                    placeholder="Cari lowongan..."
                  />
                </div>
              )}
            </div>

            <div className="flex shrink-0 items-center justify-end gap-2 md:gap-4">
              {/* New Job actions — moved to form, remove header duplicates */}
              {pathname.endsWith('/jobs/new') && null}
              {(pathname.endsWith('/jobs') && !pathname.endsWith('/jobs/new')) && (
                <Link
                  href="/dashboard/employer/jobs/new"
                  className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold leading-5 text-on-primary transition-opacity hover:opacity-90"
                >
                  <Plus className="h-4 w-4" />
                  + Posting Baru
                </Link>
              )}

              {/* Notifications */}
              <div className="relative" data-recruiter-notification>
                <button
                  type="button"
                  onClick={() => setNotificationOpen(!notificationOpen)}
                  className="relative rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary"
                  aria-label="Notifikasi"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full border border-surface bg-error px-1 text-[10px] font-bold leading-none text-on-primary">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
                {notificationOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 flex w-[calc(100vw-2rem)] max-w-96 flex-col rounded-lg border border-border-subtle bg-surface shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] sm:w-96">
                    <div className="flex items-center justify-between rounded-t-lg border-b border-border-subtle bg-surface px-4 py-3">
                      <h3 className="text-sm font-medium text-on-surface">{t('notifications.title')}</h3>
                      <span className="cursor-pointer text-xs text-primary hover:underline">{t('notifications.markAllRead')}</span>
                    </div>
                    <div className="max-h-[380px] overflow-y-auto">
                      {notifications.map((notification) => {
                        const unread = !notification.is_read
                        const iconClass = unread
                          ? 'bg-primary-fixed text-primary'
                          : 'bg-surface-container text-on-surface-variant border border-border-subtle'
                        return (
                          <div
                            key={notification.id}
                            className={`flex gap-4 border-b border-border-subtle px-4 py-4 transition-colors hover:bg-surface-container-low ${unread ? 'bg-surface-container-low' : 'opacity-70 hover:opacity-100'}`}
                          >
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconClass}`}>
                              <Bell className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className={`truncate text-sm font-medium ${unread ? 'text-on-surface' : 'text-text-secondary'}`}>{notification.title}</p>
                              <p className="mt-0.5 line-clamp-2 text-xs text-on-surface-variant">{notification.message}</p>
                              <p className={`mt-1 text-xs ${unread ? 'text-primary-container' : 'text-outline'}`}>{timeAgo(notification.created_at)}</p>
                            </div>
                            {unread && (
                              <div className="flex shrink-0 items-center justify-center pt-1">
                                <div className="h-2.5 w-2.5 rounded-full bg-primary-container" />
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    <div className="rounded-b-lg border-t border-border-subtle bg-surface-container-lowest p-3 text-center">
                      <span className="cursor-pointer py-1 text-sm font-medium text-primary transition-colors hover:text-primary-container">
                        Lihat semua
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Help — hidden on mobile to save space */}
              <button
                className="hidden rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary sm:block"
                aria-label="Bantuan"
              >
                <HelpCircle className="h-5 w-5" />
              </button>

              <div className="ml-2 flex h-8 w-8 items-center justify-center rounded-full bg-surface-container text-xs font-bold text-primary ring-1 ring-border-subtle">
                {(user?.name ?? 'R').charAt(0).toUpperCase()}
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto bg-background-recruiter p-4 md:p-8">
            <div key={pathname} className="animate-fade-in">
              {children}
            </div>
          </main>
        </div>
      </div>
    </EmployerProvider>
  )
}
