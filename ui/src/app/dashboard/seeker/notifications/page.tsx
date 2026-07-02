'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSocket } from '@/providers/socket-provider'
import { useToast } from '@/providers/toast-provider'
import { notificationsApi } from '@/lib/api'
import type { Notification } from '@/types'
import { NotificationItem } from '@/components/cards/notification-item'
import { EmptyState } from '@/components/ui/empty-state'
import { Bell, CheckCheck, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type FilterTab = 'all' | 'unread' | 'applications' | 'interviews'

const tabs: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'Semua' },
  { key: 'unread', label: 'Belum Dibaca' },
  { key: 'applications', label: 'Lamaran' },
  { key: 'interviews', label: 'Interview' },
]

export default function NotificationsPage() {
  const toast = useToast()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await notificationsApi.list()
      setNotifications(res.data.notifications)
    } catch {
      // silently ignore
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await notificationsApi.unreadCount()
      setUnreadCount(res.data.unread_count)
    } catch {
      // silently ignore
    }
  }, [])
  // WebSocket: listen for new notifications and update unread count
  const { socket, isConnected } = useSocket()
  useEffect(() => {
    if (!socket || !isConnected) return

    const handler = () => {
      // Refresh notification list + unread count
      fetchNotifications()
      fetchUnreadCount()
    }

    socket.on('notification', handler)
    socket.on('application_created', handler)
    socket.on('application_update', handler)
    socket.on('interview_scheduled', handler)
    socket.on('interview_reminder', handler)

    return () => {
      socket.off('notification', handler)
      socket.off('application_created', handler)
      socket.off('application_update', handler)
      socket.off('interview_scheduled', handler)
      socket.off('interview_reminder', handler)
    }
  }, [socket, isConnected, fetchNotifications, fetchUnreadCount])


  useEffect(() => {
    fetchNotifications()
    fetchUnreadCount()
    // Poll as fallback when WS disconnected, slow poll when connected
    const intervalMs = isConnected ? 60_000 : 15_000
    const interval = setInterval(fetchUnreadCount, intervalMs)
    return () => clearInterval(interval)
  }, [fetchNotifications, fetchUnreadCount, isConnected])

  const handleMarkRead = async (id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    )
    setUnreadCount((c) => Math.max(0, c - 1))

    try {
      await notificationsApi.markRead(id)
      toast.success('Notifikasi ditandai dibaca.')
    } catch {
      // Roll back
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: false } : n))
      )
      setUnreadCount((c) => c + 1)
      toast.error('Gagal menandai notifikasi dibaca.')
    }
  }

  const handleMarkAllRead = async () => {
    const prev = notifications
    setNotifications((prevN) => prevN.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)

    try {
      await notificationsApi.markAllRead()
      toast.success('Semua notifikasi ditandai dibaca.')
    } catch {
      setNotifications(prev)
      fetchUnreadCount()
      toast.error('Gagal menandai semua notifikasi dibaca.')
    }
  }

  const handleDelete = async (id: string) => {
    const prev = notifications
    const deletedItem = prev.find((n) => n.id === id)
    setNotifications((prevN) => prevN.filter((n) => n.id !== id))
    if (deletedItem && !deletedItem.is_read) {
      setUnreadCount((c) => Math.max(0, c - 1))
    }

    try {
      await notificationsApi.remove(id)
      toast.success('Notifikasi berhasil dihapus.')
    } catch {
      setNotifications(prev)
      if (deletedItem && !deletedItem.is_read) {
        setUnreadCount((c) => c + 1)
      }
      toast.error('Gagal menghapus notifikasi.')
    }
  }

  // Filter notifications based on active tab
  const filtered = notifications.filter((n) => {
    switch (activeTab) {
      case 'unread':
        return !n.is_read
      case 'applications':
        return n.type === 'application'
      case 'interviews':
        return n.type === 'interview'
      default:
        return true
    }
  })

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6 md:px-6 md:py-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifikasi</h1>
            <p className="mt-1 text-sm text-gray-500">
              Pantau update terkait lamaran dan interview Anda.
            </p>
          </div>
        </div>

        {/* Skeleton list */}
        <div className="space-y-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex animate-pulse items-start gap-3 rounded-lg px-4 py-3"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="h-4 w-2/3 rounded bg-gray-200" />
                  <div className="h-4 w-2 rounded bg-gray-200" />
                </div>
                <div className="h-4 w-full rounded bg-gray-200" />
                <div className="h-3 w-20 rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (notifications.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6 md:px-6 md:py-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifikasi</h1>
            <p className="mt-1 text-sm text-gray-500">
              Pantau update terkait lamaran dan interview Anda.
            </p>
          </div>
        </div>

        <EmptyState
          icon={<Bell className="h-8 w-8" />}
          title="Tidak ada notifikasi"
          description="Notifikasi akan muncul ketika ada update pada lamaran atau interview Anda."
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-6 md:py-8">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-primary">Notifikasi</h1>
            {unreadCount > 0 && (
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-primary-container px-2 text-xs font-bold text-on-primary">
                {unreadCount}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-text-secondary">
            {notifications.length} notifikasi{unreadCount > 0 ? `, ${unreadCount} belum dibaca` : ''}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-border-slate bg-bg-surface px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-surface-container-low sm:w-auto"
          >
            <CheckCheck className="h-4 w-4" />
            Tandai Semua Dibaca
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="mb-6 overflow-x-auto rounded-lg border border-border-slate bg-bg-surface p-1.5">
        <div className="flex min-w-max gap-1">
        {tabs.map(({ key, label }) => {
          const count =
            key === 'unread'
              ? unreadCount
              : key === 'all'
                ? notifications.length
                : notifications.filter(
                    (n) =>
                      (key === 'applications' && n.type === 'application') ||
                      (key === 'interviews' && n.type === 'interview')
                  ).length

          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                'flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors',
                activeTab === key
                  ? 'bg-surface-container-low text-primary'
                  : 'text-text-secondary hover:bg-surface-container-low hover:text-primary'
              )}
            >
              {label}
              {count > 0 && (
                <span
                  className={cn(
                    'flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold',
                    activeTab === key
                      ? 'bg-primary-fixed text-on-primary-fixed'
                      : 'bg-surface-container text-text-secondary'
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
        </div>
      </div>

      {/* Notification list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-8 w-8" />}
          title="Tidak ada notifikasi"
          description="Tidak ada notifikasi untuk filter ini."
        />
      ) : (
        <div className="rounded-xl border border-border-slate bg-bg-surface p-3 sm:p-4">
          <div className="flex flex-col gap-3">
            {filtered.map((notification) => (
              <div
                key={notification.id}
                className="group flex flex-col gap-2 sm:flex-row sm:items-start"
              >
                <NotificationItem
                  notification={notification}
                  onMarkRead={handleMarkRead}
                  className="flex-1"
                />
                <div className="flex shrink-0 gap-2 sm:flex-col sm:pt-2">
                  {!notification.is_read && (
                    <button
                      onClick={() => handleMarkRead(notification.id)}
                      className="flex flex-1 items-center justify-center rounded-md border border-border-slate bg-bg-surface p-2 text-text-secondary transition hover:bg-surface-container-low hover:text-primary sm:flex-none sm:opacity-0 sm:group-hover:opacity-100"
                      title="Tandai dibaca"
                    >
                      <CheckCheck className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(notification.id)}
                    className="flex flex-1 items-center justify-center rounded-md border border-border-slate bg-bg-surface p-2 text-text-secondary transition hover:bg-error-container hover:text-error sm:flex-none sm:opacity-0 sm:group-hover:opacity-100"
                    title="Hapus"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
