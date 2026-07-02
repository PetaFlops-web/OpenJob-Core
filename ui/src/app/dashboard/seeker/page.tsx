'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { applicationsApi, interviewsApi, bookmarksApi } from '@/lib/api'
import { useAuth } from '@/providers/auth-provider'
import { ApplicationCard, InterviewCard } from '@/components/cards'
import { Skeleton } from '@/components/ui/skeleton'
import { Briefcase, CalendarDays, Bookmark, CheckCircle } from 'lucide-react'
import type { Application, Interview } from '@/types'

export default function SeekerDashboardHome() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ applications: 0, active: 0, interviews: 0, bookmarks: 0 })
  const [recentApps, setRecentApps] = useState<Application[]>([])
  const [upcomingInterviews, setUpcomingInterviews] = useState<Interview[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [appsRes, interviewsRes, bookmarksRes] = await Promise.all([
          applicationsApi.list(),
          user ? interviewsApi.listByUser() : Promise.resolve({ data: { interviews: [] } }),
          bookmarksApi.listByUser(),
        ])
        const apps = appsRes.data.applications || []
        const interviews = interviewsRes.data.interviews || []
        const bookmarks = bookmarksRes.data.bookmarks || []

        setStats({
          applications: apps.length,
          active: apps.filter(a => ['pending', 'under_review', 'interview'].includes(a.status)).length,
          interviews: interviews.filter(i => i.status === 'scheduled').length,
          bookmarks: bookmarks.length,
        })
        setRecentApps(apps.slice(0, 5))
        const now = new Date()
        setUpcomingInterviews(
          interviews
            .filter(i => i.status === 'scheduled' && new Date(i.scheduled_at) >= now)
            .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
            .slice(0, 3)
        )
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [user])

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:px-6 md:py-8">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:px-6 md:py-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Selamat datang, {user?.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-gray-500">Berikut ringkasan aktivitas Anda</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Briefcase className="h-6 w-6" />} label="Total Lamaran" value={stats.applications} color="blue" />
        <StatCard icon={<CalendarDays className="h-6 w-6" />} label="Lamaran Aktif" value={stats.active} color="amber" />
        <StatCard icon={<CheckCircle className="h-6 w-6" />} label="Interview" value={stats.interviews} color="emerald" />
        <StatCard icon={<Bookmark className="h-6 w-6" />} label="Disimpan" value={stats.bookmarks} color="purple" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Applications */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 md:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">Lamaran Terbaru</h2>
            <Link href="/dashboard/seeker/applications" className="text-sm text-blue-600 hover:underline">
              Lihat Semua
            </Link>
          </div>
          {recentApps.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">Belum ada lamaran</p>
          ) : (
            <div className="space-y-3">
              {recentApps.map(app => (
                <ApplicationCard key={app.id} application={app} />
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Interviews */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 md:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">Interview Mendatang</h2>
            <Link href="/dashboard/seeker/interviews" className="text-sm text-blue-600 hover:underline">
              Lihat Semua
            </Link>
          </div>
          {upcomingInterviews.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">Tidak ada interview mendatang</p>
          ) : (
            <div className="space-y-3">
              {upcomingInterviews.map(interview => (
                <InterviewCard key={interview.id} interview={interview} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    purple: 'bg-purple-50 text-purple-600',
  }
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className={`mb-3 inline-flex rounded-lg p-2.5 ${colorMap[color]}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  )
}
