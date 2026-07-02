"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { AlertCircle, Bell, CalendarCheck, CheckCircle, ChevronDown, LayoutDashboard, LogOut, Menu, X } from "lucide-react"
import { useAuth } from "@/providers/auth-provider"
import { cn } from "@/lib/utils"

const navLinks = [
  { label: "Cari Kerja", href: "/jobs" },
  { label: "Perusahaan", href: "/companies" },
]

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)

  const notifications = useMemo(() => [
    {
      title: "Jadwal Interview: Tech Corp",
      message: "Undangan interview tahap akhir untuk posisi Senior Frontend Developer.",
      time: "Hari ini, 10:00 AM",
      unread: true,
      Icon: CalendarCheck,
      iconClass: "bg-primary-fixed text-primary",
    },
    {
      title: "Lamaran Diterima!",
      message: "Selamat! Lamaran Anda di PT Inovasi Maju telah diterima.",
      time: "Kemarin, 15:30 PM",
      unread: true,
      Icon: CheckCircle,
      iconClass: "bg-secondary-fixed text-secondary",
    },
    {
      title: "Status Lamaran Diperbarui",
      message: "Status lamaran Anda untuk UI/UX Designer berubah menjadi Sedang Direview.",
      time: "3 hari yang lalu",
      unread: false,
      Icon: LayoutDashboard,
      iconClass: "bg-surface-variant text-text-secondary border border-border-slate",
    },
    {
      title: "Lengkapi Profil Anda",
      message: "Profil Anda baru selesai 60%.",
      time: "1 minggu yang lalu",
      unread: false,
      Icon: AlertCircle,
      iconClass: "bg-error-container text-error",
    },
  ], [])

  useEffect(() => {
    if (!dropdownOpen && !notificationOpen) return
    const onClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("[data-dropdown]") &&
          !(e.target as HTMLElement).closest("[data-notification]")) {
        setDropdownOpen(false)
        setNotificationOpen(false)
      }
    }
    document.addEventListener("click", onClick)
    return () => document.removeEventListener("click", onClick)
  }, [dropdownOpen, notificationOpen])

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false)
    }
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U"

  const dashboardHref = user?.role === "employer" ? "/dashboard/employer" : "/dashboard/seeker"

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-slate bg-bg-surface">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex min-h-[44px] items-center text-2xl font-bold text-primary transition-transform active:scale-95">
          OpenJob
        </Link>

        <nav className="hidden items-center gap-8 text-base md:flex">
          {navLinks.map((link) => {
            const active = pathname.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "inline-flex min-h-[44px] items-center transition-colors active:scale-95",
                  active
                    ? "font-bold text-primary border-b-2 border-primary pb-1"
                    : "text-on-surface-variant hover:text-primary"
                )}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          {isAuthenticated && user ? (
            <>
              <div className="relative" data-notification>
                <button
                  type="button"
                  onClick={() => setNotificationOpen(!notificationOpen)}
                  className="relative inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-2 transition-colors hover:bg-surface-container focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  <Bell className="h-5 w-5 text-text-secondary" />
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border border-bg-surface bg-error-red" />
                </button>
                {notificationOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 flex w-80 flex-col rounded-lg border border-border-slate bg-bg-surface shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] sm:w-96">
                    <div className="flex items-center justify-between rounded-t-lg border-b border-border-slate bg-bg-surface p-4">
                      <h3 className="text-sm font-medium text-on-surface">Notifikasi</h3>
                      <button className="text-xs text-primary hover:underline focus:outline-none">Tandai semua dibaca</button>
                    </div>
                    <div className="max-h-[380px] overflow-y-auto">
                      {notifications.map(({ title, message, time, unread, Icon, iconClass }) => (
                        <Link
                          key={title}
                          href="/dashboard/seeker/notifications"
                          onClick={() => setNotificationOpen(false)}
                          className={`flex gap-4 border-b border-border-slate p-4 transition-colors hover:bg-surface-container group ${unread ? "bg-surface-container-low" : "bg-bg-surface opacity-70 hover:opacity-100"}`}
                        >
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconClass}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={`truncate text-sm font-medium ${unread ? "text-on-surface" : "text-text-secondary"}`}>{title}</p>
                            <p className={`mt-0.5 line-clamp-2 text-xs ${unread ? "text-text-secondary" : "text-outline"}`}>{message}</p>
                            <p className={`mt-1 text-xs ${unread ? "text-primary-container" : "text-outline"}`}>{time}</p>
                          </div>
                          {unread && (
                            <div className="flex shrink-0 items-center justify-center pt-1">
                              <div className="h-2.5 w-2.5 rounded-full bg-primary-container" />
                            </div>
                          )}
                        </Link>
                      ))}
                    </div>
                    <div className="rounded-b-lg border-t border-border-slate bg-surface-container-lowest p-3 text-center">
                      <Link href="/dashboard/seeker/notifications" onClick={() => setNotificationOpen(false)} className="w-full py-1 text-sm font-medium text-primary transition-colors hover:text-primary-container">
                        Lihat semua
                      </Link>
                    </div>
                  </div>
                )}
              </div>
              <div className="hidden sm:block mx-2 h-6 w-px bg-border-slate" />
            </>
          ) : null}
          {isAuthenticated && user ? (
            <div className="relative" data-dropdown>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex min-h-[44px] items-center gap-2 rounded-lg border border-border-slate px-2 py-1.5 transition-colors hover:bg-surface-container-highest"
                aria-expanded={dropdownOpen}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-on-primary">
                  {initials}
                </span>
                <span className="text-sm font-medium text-on-surface">{user.name}</span>
                <ChevronDown className={cn("h-4 w-4 transition-transform", dropdownOpen && "rotate-180")} />
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border-slate bg-bg-surface p-2 shadow-lg">
                  <Link
                    href={dashboardHref}
                    className="flex min-h-[44px] items-center gap-2 rounded-md px-4 py-2 text-sm hover:bg-surface-container"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                  <hr className="my-1 border-border-slate" />
                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false)
                      logout()
                    }}
                    className="flex min-h-[44px] w-full items-center gap-2 rounded-md px-4 py-2 text-sm text-error hover:bg-error-container"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex min-h-[44px] items-center rounded-lg border border-border-slate px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-surface-container-highest active:scale-95"
              >
                Masuk
              </Link>
              <Link
                href="/register"
                className="inline-flex min-h-[44px] items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-on-primary transition-colors hover:bg-primary-container active:scale-95"
              >
                Daftar
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-border-slate p-2 text-on-surface transition-colors hover:bg-surface-container-high md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-border-slate bg-bg-surface px-4 py-4 md:hidden">
          <ul className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "flex min-h-[44px] items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-surface-container",
                    pathname.startsWith(link.href) ? "text-primary font-bold" : "text-on-surface-variant"
                  )}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <hr className="my-3 border-border-slate" />
          {isAuthenticated ? (
            <div className="flex flex-col gap-2">
              <Link href={dashboardHref} className="flex min-h-[44px] items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-surface-container" onClick={() => setMobileOpen(false)}>
                <LayoutDashboard className="mr-2 inline h-4 w-4" />
                Dashboard
              </Link>
              <button
                onClick={() => { setMobileOpen(false); logout() }}
                className="flex min-h-[44px] w-full items-center rounded-md px-3 py-2 text-left text-sm font-medium text-error hover:bg-error-container"
              >
                <LogOut className="mr-2 inline h-4 w-4" />
                Logout
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Link href="/login" className="flex min-h-[44px] items-center justify-center rounded-lg border border-border-slate px-3 py-2 text-center text-sm font-medium text-primary hover:bg-surface-container-highest" onClick={() => setMobileOpen(false)}>Masuk</Link>
              <Link href="/register" className="flex min-h-[44px] items-center justify-center rounded-lg bg-primary px-3 py-2 text-center text-sm font-medium text-on-primary hover:bg-primary-container" onClick={() => setMobileOpen(false)}>Daftar</Link>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
