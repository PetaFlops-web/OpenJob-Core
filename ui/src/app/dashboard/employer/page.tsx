'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useEmployer } from '@/providers/employer-provider'
import { jobsApi, applicationsApi, interviewsApi } from '@/lib/api'
import { resolveNames } from '@/lib/resolve-names'
import { Briefcase, CalendarDays, Group, MoreHorizontal, Clock } from 'lucide-react'
import { useI18n } from '@/hooks/use-i18n'

function StatCard({ icon: Icon, label, value, sub }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number; sub: string }) {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      <div className="mb-4 flex items-start justify-between">
        <h3 className="text-sm font-semibold leading-5 text-on-surface-variant">{label}</h3>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-fixed">
          <Icon className="h-[18px] w-[18px] text-primary" />
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-bold leading-[44px] tracking-[-0.02em] text-primary">{value}</span>
        <span className="text-[11px] font-bold leading-[14px] text-secondary">{sub}</span>
      </div>
    </div>
  )
}

export default function EmployerDashboardPage() {
  const { company } = useEmployer()
  const { t } = useI18n()
  const [stats, setStats] = useState({ activeJobs: 0, totalApplicants: 0, interviewsThisWeek: 0 })
  const [recentJobs, setRecentJobs] = useState<{ id: string; title: string; dept: string; applicants: number; status: string }[]>([])
  const [upcomingInterviews, setUpcomingInterviews] = useState<{ id: string; name: string; role: string; time: string }[]>([])

  useEffect(() => {
    if (!company?.id) return
    let cancelled = false
    jobsApi.list({ company_id: company.id })
      .then(async (jRes) => {
        if (cancelled) return
        const allJobs = jRes.data.jobs ?? []
        // Filter to company's jobs (backend may not filter by company_id)
        const jobs = allJobs.filter(j => j.company_id === company.id)
        const jobIds = jobs.map(j => j.id)

        // Fetch applications per job (GET /applications is seeker-scoped)
        const appResults = await Promise.allSettled(
          jobIds.map(id => applicationsApi.getByJob(id).then(r => r.data.applications ?? []))
        )
        if (cancelled) return

        const allApps = appResults.flatMap(r => r.status === 'fulfilled' ? r.value : [])
        const applicationCounts: Record<string, number> = {}
        for (const app of allApps) {
          applicationCounts[app.job_id] = (applicationCounts[app.job_id] ?? 0) + 1
        }

        setStats((prev) => ({
          ...prev,
          activeJobs: jobs.filter((j) => j.status === 'open' || j.status === 'active').length,
          totalApplicants: allApps.length,
        }))
        setRecentJobs(
          jobs.slice(0, 3).map((j) => ({
            id: j.id,
            title: j.title,
            dept: j.location_city ?? j.location_type,
            applicants: applicationCounts[j.id] ?? 0,
            status: j.status,
          }))
        )
      })
      .catch(() => { /* ignore */ })
    return () => { cancelled = true }
  }, [company?.id])


  useEffect(() => {
    if (!company?.id) {
      setStats((prev) => ({ ...prev, interviewsThisWeek: 0 }))
      setUpcomingInterviews([])
      return
    }
    let cancelled = false
    interviewsApi.listByCompany(company.id)
      .then(async (res) => {
        if (cancelled) return
        const interviews = res.data.interviews ?? []
        const now = new Date()
        const weekEnd = new Date(now)
        weekEnd.setDate(now.getDate() + 7)
        const upcoming = interviews
          .filter((i) => i.status === 'scheduled' && new Date(i.scheduled_at) > now)
          .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
        setStats((prev) => ({
          ...prev,
          interviewsThisWeek: upcoming.filter((i) => new Date(i.scheduled_at) <= weekEnd).length,
        }))
        // Resolve user names and job titles
        const userIds = [...new Set(upcoming.slice(0, 3).map(i => i.user_id))]
        const jobIds = [...new Set(upcoming.slice(0, 3).map(i => i.job_id))]
        const { userNames: uMap, jobTitles: jMap } = await resolveNames(userIds, jobIds)

        if (cancelled) return
        setUpcomingInterviews(
          upcoming.slice(0, 3).map((i) => {
            const scheduled = new Date(i.scheduled_at)
            const timeStr = scheduled.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }) +
              ', ' + scheduled.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
            return {
              id: i.id,
              name: uMap[i.user_id] ?? t('employer.candidate'),
              role: jMap[i.job_id] ?? t('interviews.title'),
              time: timeStr,
            }
          })
        )
      })
      .catch(() => { /* ignore */ })
    return () => { cancelled = true }
  }, [company?.id])
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6">
        <StatCard icon={Briefcase} label={t('employer.stats.activeJobs')} value={stats.activeJobs} sub={t('employer.stats.total')} />
        <StatCard icon={Group} label={t('employer.stats.totalApplicants')} value={stats.totalApplicants} sub={t('employer.stats.total')} />
        <StatCard icon={CalendarDays} label={t('employer.stats.interviewsThisWeek')} value={stats.interviewsThisWeek} sub={t('employer.stats.upcoming')} />
      </section>

      <section className="grid grid-cols-1 gap-4 md:gap-6 xl:grid-cols-12">
        <div className="flex flex-col overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-[0_1px_3px_rgba(0,0,0,0.05)] xl:col-span-8">
          <div className="flex items-center justify-between border-b border-border-subtle p-4">
            <h2 className="text-xl font-semibold leading-7 text-primary">{t('employer.recentJobs')}</h2>
            <Link href="/dashboard/employer/jobs" className="text-[11px] font-bold leading-[14px] text-primary hover:underline">{t('jobs.viewAll')}</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[640px] w-full border-collapse text-left text-sm md:text-base">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-container-recruiter">
                  <th className="px-3 py-3 text-xs font-semibold uppercase tracking-[0.05em] text-on-surface-variant md:p-4">{t('employer.table.position')}</th>
                  <th className="px-3 py-3 text-xs font-semibold uppercase tracking-[0.05em] text-on-surface-variant md:p-4">{t('employer.table.applicants')}</th>
                  <th className="px-3 py-3 text-xs font-semibold uppercase tracking-[0.05em] text-on-surface-variant md:p-4">{t('employer.table.status')}</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-[0.05em] text-on-surface-variant md:p-4">{t('employer.table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {recentJobs.map((job) => (
                  <tr key={job.id} className="group cursor-pointer border-b border-border-subtle transition-colors hover:bg-surface-container-recruiter">
                    <td className="px-3 py-3 md:p-4">
                      <p className="text-sm font-semibold leading-5 text-primary md:text-base">{job.title}</p>
                      <p className="text-[13px] leading-[18px] text-on-surface-variant">{job.dept}</p>
                    </td>
                    <td className="px-3 py-3 text-sm leading-5 md:p-4 md:text-base">{job.applicants}</td>
                    <td className="px-3 py-3 md:p-4">
                      <span className={job.status === 'active' || job.status === 'open' ? 'inline-flex items-center rounded-full bg-primary-fixed px-2 py-1 text-[11px] font-bold leading-[14px] text-on-primary-fixed' : 'inline-flex items-center rounded-full bg-surface-container px-2 py-1 text-[11px] font-bold leading-[14px] text-status-closed'}>
                        {job.status === 'open' || job.status === 'active' ? t('employer.table.active') : job.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right md:p-4">
                      <button className="text-outline transition-colors hover:text-primary md:opacity-0 md:group-hover:opacity-100" aria-label={`Kelola ${job.title}`}>
                        <MoreHorizontal className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-[0_1px_3px_rgba(0,0,0,0.05)] xl:col-span-4">
          <div className="flex items-center justify-between border-b border-border-subtle p-4">
            <h2 className="text-xl font-semibold leading-7 text-primary">{t('employer.upcomingInterviews')}</h2>
          </div>
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
            {upcomingInterviews.map((i) => (
              <div key={i.id} className="group flex cursor-pointer gap-4 rounded-lg border border-border-subtle p-3 transition-colors hover:border-primary">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-container-recruiter text-xs font-bold text-primary">
                  {i.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold leading-5 text-on-surface transition-colors group-hover:text-primary">{i.name}</p>
                  <p className="text-[13px] leading-[18px] text-on-surface-variant">{i.role}</p>
                  <div className="mt-1 flex items-center gap-1 text-on-surface-variant">
                    <Clock className="h-[14px] w-[14px]" />
                    <span className="text-[11px] font-bold leading-[14px]">{i.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-border-subtle p-4 text-center">
            <Link href="/dashboard/employer/interviews" className="text-xs font-semibold leading-4 tracking-[0.05em] text-primary hover:underline">{t('employer.viewCalendar')}</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
