'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ReactNode, useEffect } from 'react'
import { PageTransition } from '@/components/layout/page-transition'
import {
  LayoutDashboard,
  User,
  Briefcase,
  Bookmark,
  Calendar,
  Bell,
  Settings,
} from 'lucide-react'
import { useAuth } from '@/providers/auth-provider'
import { Skeleton } from '@/components/ui/skeleton'

const navItems = [
  { href: '/dashboard/seeker', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/seeker/profile', icon: User, label: 'Profil' },
  { href: '/dashboard/seeker/applications', icon: Briefcase, label: 'Lamaran Saya' },
  { href: '/dashboard/seeker/bookmarks', icon: Bookmark, label: 'Tersimpan' },
  { href: '/dashboard/seeker/interviews', icon: Calendar, label: 'Interview' },
  { href: '/dashboard/seeker/notifications', icon: Bell, label: 'Notifikasi' },
  { href: '/dashboard/seeker/settings', icon: Settings, label: 'Pengaturan' },
]

function SeekerSidebar({ userName }: { userName: string }) {
  const pathname = usePathname()

  return (
    <div className="sticky top-24 rounded-lg border border-border-slate bg-bg-surface p-6">
      <div className="mb-4 flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border-slate bg-primary text-sm font-bold text-on-primary">
          {userName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-sm font-medium text-on-surface">{userName}</h2>
          <p className="text-xs text-text-secondary">Job Seeker</p>
        </div>
      </div>
      <div className="my-2 h-px w-full bg-border-slate" />
      <nav className="flex flex-col gap-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-md p-2 text-base leading-6 transition-colors ${
                isActive
                  ? 'bg-surface-container-low text-primary font-medium'
                  : 'text-text-secondary hover:bg-surface-container-low hover:text-primary'
              }`}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

export default function SeekerLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login')
    }
  }, [isLoading, router, user])

  if (isLoading) {
    return (
      <div className="mx-auto grid min-h-screen max-w-[1200px] grid-cols-1 gap-4 px-4 py-6 md:grid-cols-12 md:px-6 md:py-8">
        <aside className="hidden md:col-span-3 md:block">
          <div className="rounded-lg border border-border-slate bg-bg-surface p-6">
            <Skeleton className="mb-4 h-12 w-full" />
            <Skeleton className="mb-2 h-10 w-full" />
            <Skeleton className="mb-2 h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </aside>
        <main className="md:col-span-9">
          <Skeleton className="mb-4 h-8 w-48" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </main>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-bg-page">
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-4 overflow-x-hidden px-4 py-6 md:grid-cols-12 md:px-6 md:py-8">
        <aside className="hidden md:col-span-3 md:block">
          <SeekerSidebar userName={user.name} />
        </aside>
        <main className="min-w-0 pb-20 md:col-span-9 md:pb-0">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border-slate bg-bg-surface md:hidden">
        <div className="flex w-full items-center py-2">
          {navItems.slice(0, 5).map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-1 text-[11px] ${
                  isActive ? 'text-primary' : 'text-text-secondary'
                }`}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span className="max-w-full truncate">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
