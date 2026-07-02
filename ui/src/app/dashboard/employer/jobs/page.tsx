'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { jobsApi } from '@/lib/api'
import { useToast } from '@/providers/toast-provider'
import type { Job } from '@/types'
import { Eye, Pencil, Trash2 } from 'lucide-react'
import { useI18n } from '@/hooks/use-i18n'
function statusBadge(status: string, t: (key: string) => string) {
  const map: Record<string, { bg: string; dot: string; text: string; labelKey: string }> = {
    active: { bg: 'bg-[#D1FAE5]', dot: 'bg-status-open', text: 'text-[#065F46]', labelKey: 'employer.table.active' },
    open: { bg: 'bg-[#D1FAE5]', dot: 'bg-status-open', text: 'text-[#065F46]', labelKey: 'employer.table.active' },
    closed: { bg: 'bg-[#F1F5F9]', dot: 'bg-status-closed', text: 'text-[#475569]', labelKey: 'employer.table.closed' },
    draft: { bg: 'bg-[#FEF3C7]', dot: 'bg-status-pending', text: 'text-[#B45309]', labelKey: 'employer.table.draft' },
  }
  const s = map[status] ?? map.draft
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-bold leading-[14px] ${s.bg} ${s.text}`}>
      <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {t(s.labelKey)}
    </span>
  )
}

function jobInitials(title: string) {
  return title
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

function matchesTab(job: Job, tab: JobTab) {
  if (tab === 'active') return job.status === 'active' || job.status === 'open'
  if (tab === 'closed') return job.status === 'closed'
  if (tab === 'draft') return job.status === 'draft'
  return true
}

type JobTab = 'all' | 'active' | 'closed' | 'draft'


export default function JobManagementPage() {
  const router = useRouter()
  const toast = useToast()
  const { t } = useI18n()
  const [jobs, setJobs] = useState<Job[]>([])
  const [tab, setTab] = useState<JobTab>('all')
  const jobTabs = [
    { label: t('employer.jobs.allJobs'), value: 'all' as const },
    { label: t('employer.jobs.active'), value: 'active' as const },
    { label: t('employer.jobs.closed'), value: 'closed' as const },
    { label: t('employer.jobs.draft'), value: 'draft' as const }
  ]

  const loadJobs = useCallback(async () => {
    const res = await jobsApi.list({ limit: '10' })
    return res.data.jobs ?? []
  }, [])

  useEffect(() => {
    let cancelled = false
    loadJobs()
      .then((loadedJobs) => {
        if (!cancelled) setJobs(loadedJobs)
      })
      .catch(() => {
        if (!cancelled) setJobs([])
      })
    return () => { cancelled = true }
  }, [loadJobs])

  const handleDelete = async (jobId: string) => {
    if (!confirm(t('employer.jobs.confirmDelete'))) return
    try {
      await jobsApi.remove(jobId)
      setJobs(await loadJobs())
      toast.success(t('employer.jobs.deleted'))
  } catch {
    }
  }

  const filteredJobs = jobs.filter((job) => matchesTab(job, tab))

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 border-b border-border-subtle pb-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="flex min-w-max gap-6">
            {jobTabs.map((item) => (
              <button
                key={item.value}
                onClick={() => setTab(item.value)}
                className={`-mb-[1px] pb-2 text-sm font-semibold leading-5 transition-colors ${
                  tab === item.value ? 'border-b-2 border-primary text-primary' : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <button className="flex items-center gap-1 rounded border border-border-subtle px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.05em] text-on-surface-variant transition-colors hover:bg-surface-container-recruiter">
          {t('employer.jobs.filter')}
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface">
        <div className="overflow-x-auto">
          <table className="min-w-[760px] w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border-subtle bg-surface-container-recruiter">
                <th className="px-2 py-3 text-xs font-semibold uppercase tracking-[0.05em] text-on-surface-variant md:px-4 md:py-4">{t('employer.jobs.title')}</th>
                <th className="px-2 py-3 text-xs font-semibold uppercase tracking-[0.05em] text-on-surface-variant md:px-4 md:py-4">{t('employer.table.status')}</th>
                <th className="px-2 py-3 text-xs font-semibold uppercase tracking-[0.05em] text-on-surface-variant md:px-4 md:py-4">{t('employer.table.applicants')}</th>
                <th className="px-2 py-3 text-xs font-semibold uppercase tracking-[0.05em] text-on-surface-variant md:px-4 md:py-4">{t('employer.apiKeys.created')}</th>
                <th className="px-2 py-3 text-right text-xs font-semibold uppercase tracking-[0.05em] text-on-surface-variant md:px-4 md:py-4">{t('employer.table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-sm leading-5">
              {filteredJobs.map((job) => (
                <tr key={job.id} className="group transition-colors hover:bg-surface-container-recruiter">
                  <td className="px-2 py-3 md:px-4 md:py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded bg-primary-fixed-dim font-bold text-primary">{jobInitials(job.title)}</div>
                      <div>
                        <p className="text-sm font-semibold leading-5 text-on-surface md:text-base md:leading-6">{job.title}</p>
                        <p className="text-[13px] leading-[18px] text-on-surface-variant">{job.job_type} • {job.experience_level}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-3 md:px-4 md:py-4">{statusBadge(job.status, t)}</td>
                  <td className="px-2 py-3 md:px-4 md:py-4">
                    <span className="text-sm font-semibold leading-5">-</span>
                  </td>
                  <td className="px-2 py-3 text-on-surface-variant md:px-4 md:py-4">{job.created_at ? new Date(job.created_at).toLocaleDateString('id-ID') : '-'}</td>
                  <td className="px-2 py-3 text-right md:px-4 md:py-4">
                    <div className="flex justify-end gap-2 opacity-100 transition-opacity">
                      <button onClick={() => router.push(`/jobs/${job.id}`)} className="rounded p-1.5 text-on-surface-variant transition-colors hover:bg-primary-fixed hover:text-primary" title="View">
                        <Eye className="h-5 w-5" />
                      </button>
                      <button onClick={() => router.push(`/dashboard/employer/jobs/${job.id}/edit`)} className="rounded p-1.5 text-on-surface-variant transition-colors hover:bg-primary-fixed hover:text-primary" title="Edit">
                        <Pencil className="h-5 w-5" />
                      </button>
                      <button onClick={() => { void handleDelete(job.id) }} className="rounded p-1.5 text-on-surface-variant transition-colors hover:bg-error-container hover:text-error" title="Delete">
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-border-subtle bg-surface-container-lowest px-4 py-3">
          <p className="text-center text-[13px] leading-[18px] text-on-surface-variant sm:text-left">{t('employer.jobs.showingFromTo', { from: 1, to: filteredJobs.length, total: jobs.length })}</p>
        </div>
      </div>
    </div>
  )
}
