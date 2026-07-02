'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  User,
  Briefcase,
  Bookmark,
  Calendar,
  Bell,
  Settings,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type NavItem = {
  label: string
  href: string
  icon: LucideIcon
}

const navItems: NavItem[] = [
  { label: 'Profile', href: '/dashboard/seeker/profile', icon: User },
  { label: 'My Applications', href: '/dashboard/seeker/applications', icon: Briefcase },
  { label: 'Bookmarked Jobs', href: '/dashboard/seeker/bookmarks', icon: Bookmark },
  { label: 'Interviews', href: '/dashboard/seeker/interviews', icon: Calendar },
  { label: 'Notifications', href: '/dashboard/seeker/notifications', icon: Bell },
  { label: 'Settings', href: '/dashboard/seeker/settings', icon: Settings },
]

interface DashboardSidebarProps {
  unreadCount?: number
  className?: string
}

export function DashboardSidebar({ unreadCount, className }: DashboardSidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop sidebar - fixed left */}
      <aside
        className={cn(
          'hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 rounded-xl border border-oj-border bg-white shadow-lg m-2',
          className
        )}
      >
        <nav className="flex flex-col gap-1 p-4">
          {navItems.map(({ label, href, icon: Icon }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-oj-primary text-white text-oj-text oj-shadow'
                    : 'text-oj-text/70 hover:bg-oj-bg hover:text-oj-text'
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
                {label === 'Notifications' && unreadCount && unreadCount > 0 && (
                  <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-oj-primary text-white text-xs font-bold text-oj-text">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Mobile bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-oj-border bg-white/90 backdrop-blur-md px-1 py-1 lg:hidden">
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-0.5 rounded-md px-2 py-1.5 text-xs transition-all',
                isActive ? 'text-oj-primary' : 'text-oj-text/50'
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {label === 'Notifications' && unreadCount && unreadCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-oj-primary text-white text-[9px] font-bold text-oj-text">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span className="truncate max-w-[60px]">{label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
