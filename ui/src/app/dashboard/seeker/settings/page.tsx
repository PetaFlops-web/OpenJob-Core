'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/providers/auth-provider'
import { useToast } from '@/providers/toast-provider'
import { securityApi, notificationsApi } from '@/lib/api'
import { Skeleton } from '@/components/ui/skeleton'

export default function SettingsPage() {
  const { user, refreshUser } = useAuth()
  const router = useRouter()
  const toast = useToast()
  const [sessions, setSessions] = useState<{ id: string; user_agent: string; ip: string; created_at: string }[]>([])
  const [prefs, setPrefs] = useState({
    email_application: true,
    email_interview: true,
    push_application: false,
    push_interview: false,
    websocket_enabled: true,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveFeedback, setSaveFeedback] = useState<'success' | 'error' | null>(null)
  const [feedbackVisible, setFeedbackVisible] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const [sessionsRes, prefsRes] = await Promise.all([
        securityApi.sessions.list(),
        notificationsApi.preferences.get(),
      ])
      setSessions(sessionsRes.data.sessions || [])
      setPrefs(prefsRes.data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const togglePref = (key: string) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))
  }

  const savePrefs = async () => {
    setSaving(true)
    try {
      await notificationsApi.preferences.update(prefs)
      setSaveFeedback('success')
      setFeedbackVisible(true)
      setTimeout(() => setFeedbackVisible(false), 3000)
      setTimeout(() => setSaveFeedback(null), 3500)
      toast.success('Preferensi notifikasi berhasil disimpan.')
    } catch {
      setSaveFeedback('error')
      setFeedbackVisible(true)
      setTimeout(() => setFeedbackVisible(false), 3000)
      setTimeout(() => setSaveFeedback(null), 3500)
    } finally {
      setSaving(false)
    }
  }

  const revokeSession = async (id: string) => {
    try {
      await securityApi.sessions.revoke(id)
      setSessions(prev => prev.filter(s => s.id !== id))
      toast.success('Sesi berhasil dicabut.')
    } catch {
    }
  }

  const handleDisableMFA = async () => {
    if (!confirm('Yakin ingin menonaktifkan MFA? Akun Anda akan kurang aman.')) return
    try {
      await securityApi.mfa.disable()
      await refreshUser()
      toast.success('MFA berhasil dinonaktifkan.')
    } catch {
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 md:px-6 md:py-8">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 md:px-6 md:py-8">
      <h1 className="text-2xl font-bold text-gray-900">Pengaturan</h1>

      {/* Account Settings */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 md:p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Pengaturan Akun</h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-700">Email</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" size="sm" className="w-full sm:w-auto">Ubah Email</Button>
            <Button variant="outline" size="sm" className="w-full sm:w-auto">Ubah Password</Button>
          </div>
          <div className="pt-4 border-t border-gray-100">
            <Button variant="danger" size="sm" className="w-full sm:w-auto">Hapus Akun</Button>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 md:p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Keamanan</h2>

        {/* MFA */}
        <div className="mb-6 flex flex-col gap-3 rounded-lg bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium text-gray-900">Autentikasi Dua Faktor (MFA)</p>
            <p className="text-sm text-gray-500">
              {user?.mfa_enabled ? 'MFA aktif - akun Anda lebih aman' : 'MFA belum diaktifkan'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={user?.mfa_enabled ? 'success' : 'warning'}>
              {user?.mfa_enabled ? 'Aktif' : 'Nonaktif'}
            </Badge>
            {!user?.mfa_enabled && (
              <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/seeker/settings/mfa')}>
                Setup MFA
              </Button>
            )}
            {user?.mfa_enabled && (
              <Button variant="danger" size="sm" onClick={handleDisableMFA}>
                Disable
              </Button>
            )}
          </div>
        </div>

        {/* Active Sessions */}
        <div>
          <h3 className="mb-3 font-medium text-gray-900">Sesi Aktif</h3>
          {sessions.length === 0 ? (
            <p className="text-sm text-gray-500">Tidak ada sesi aktif</p>
          ) : (
            <div className="space-y-2">
              {sessions.map(session => (
                <div key={session.id} className="flex flex-col gap-3 rounded-lg border border-gray-100 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{session.user_agent || 'Browser'}</p>
                    <p className="text-xs text-gray-500">IP: {session.ip} • {new Date(session.created_at).toLocaleDateString('id-ID')}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="w-full sm:w-auto" onClick={() => revokeSession(session.id)}>
                    Cabut
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 md:p-6">
        <h2 className="mb-1 text-lg font-semibold text-gray-900">Pengaturan Notifikasi</h2>
        <p className="mb-5 text-sm text-gray-500">Atur bagaimana Anda ingin menerima pemberitahuan.</p>

        <div className="space-y-6">
          {/* Email Notifications */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Email Notifications</h3>
            <div className="space-y-1">
              <ToggleRow
                label="Update Lamaran"
                description="Dapatkan email saat status lamaran Anda berubah."
                checked={prefs.email_application}
                onChange={() => togglePref('email_application')}
              />
              <ToggleRow
                label="Undangan Interview"
                description="Dapatkan email saat diundang untuk wawancara."
                checked={prefs.email_interview}
                onChange={() => togglePref('email_interview')}
              />
            </div>
          </div>

          {/* Push & Real-time Notifications */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Push &amp; Real-time Notifications</h3>
            <div className="space-y-1">
              <ToggleRow
                label="Update Lamaran"
                description="Notifikasi push saat status lamaran berubah."
                checked={prefs.push_application}
                onChange={() => togglePref('push_application')}
              />
              <ToggleRow
                label="Undangan Interview"
                description="Notifikasi push saat diundang untuk wawancara."
                checked={prefs.push_interview}
                onChange={() => togglePref('push_interview')}
              />
              <ToggleRow
                label="Real-time (WebSocket)"
                description="Terima notifikasi langsung tanpa perlu memuat ulang halaman."
                checked={prefs.websocket_enabled}
                onChange={() => togglePref('websocket_enabled')}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <Button size="sm" className="w-full sm:w-auto" loading={saving} onClick={savePrefs}>
            Simpan Preferensi
          </Button>
          {saveFeedback && (
            <span
              className={`text-sm font-medium transition-opacity duration-500 ${feedbackVisible ? 'opacity-100' : 'opacity-0'} ${
                saveFeedback === 'success' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {saveFeedback === 'success' ? '✓ Preferensi berhasil disimpan' : 'Gagal menyimpan preferensi'}
            </span>
          )}
        </div>
      </div>

      {/* Language & Region */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 md:p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Bahasa & Region</h2>
        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Bahasa</label>
            <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              <option value="id">Bahasa Indonesia</option>
              <option value="en">English</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Zona Waktu</label>
            <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              <option value="Asia/Jakarta">WIB (Asia/Jakarta)</option>
              <option value="Asia/Makassar">WITA (Asia/Makassar)</option>
              <option value="Asia/Jayapura">WIT (Asia/Jayapura)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-gray-50">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
          checked ? 'bg-blue-600' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}
