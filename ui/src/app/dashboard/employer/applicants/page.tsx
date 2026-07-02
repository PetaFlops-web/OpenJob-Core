'use client'

import { useEffect, useState, useCallback } from 'react'
import { useI18n } from '@/hooks/use-i18n'
import { applicationsApi, jobsApi, usersApi } from '@/lib/api'
import { useEmployer } from '@/providers/employer-provider'
import { useToast } from '@/providers/toast-provider'
import type { Application, Job } from '@/types'
import { getAtsScore, getUserFromApplication, hydrateApplicantDetail, normalizeApplication, type ApplicantDetail } from '../components/applicant-data'
import { formatDate, applicationStatusConfig } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ApplicantDetailModal, ScheduleInterviewModal } from '../components/applicant-modals'

function getStatusTabs(t: (key: string) => string) {
  return [
    { key: 'all' as const, label: 'Semua' },
    { key: 'pending' as const, label: t('employer.detailModal.status.pending') },
    { key: 'under_review' as const, label: t('employer.detailModal.status.under_review') },
    { key: 'interview' as const, label: t('employer.detailModal.status.interview') },
    { key: 'accepted' as const, label: t('employer.detailModal.status.accepted') },
    { key: 'rejected' as const, label: t('employer.detailModal.status.rejected') },
  ]
}

type StatusKey = 'all' | 'pending' | 'under_review' | 'interview' | 'accepted' | 'rejected'

export default function ApplicantsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [jobsLoading, setJobsLoading] = useState(true)
  const [selectedJobId, setSelectedJobId] = useState('all')
  const [activeStatus, setActiveStatus] = useState<StatusKey>('all')
  const [applications, setApplications] = useState<Application[]>([])
  const [usersMap, setUsersMap] = useState<Record<string, { name: string; email: string }>>({})
  const [loading, setLoading] = useState(true)
  const [detailApplicant, setDetailApplicant] = useState<ApplicantDetail | null>(null)
  const [scheduleApplicant, setScheduleApplicant] = useState<ApplicantDetail | null>(null)
  const [detailLoadingId, setDetailLoadingId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const { company, isLoading: companyLoading } = useEmployer()
  const toast = useToast()
  const { t } = useI18n()
  const statusTabs = getStatusTabs(t)

  // Load company jobs
  useEffect(() => {
    let cancelled = false
    async function loadJobs() {
      if (!company) {
        setJobs([])
        setJobsLoading(false)
        return
      }

      setJobsLoading(true)
      try {
        const res = await jobsApi.getByCompany(company.id)
        if (!cancelled) setJobs(res.data.jobs)
      } catch {
        if (!cancelled) setJobs([])
      } finally {
        if (!cancelled) setJobsLoading(false)
      }
    }

    if (!companyLoading) loadJobs()
    return () => { cancelled = true }
  }, [company, companyLoading])

  // Load applications
  useEffect(() => {
    let cancelled = false
    async function loadApps() {
      setLoading(true)
      try {
        let raw: Application[] = []
        if (selectedJobId !== 'all') {
          const res = await applicationsApi.getByJob(selectedJobId)
          raw = res.data.applications
        } else {
          const jobIds = jobs.map(j => j.id)
          if (jobIds.length === 0) {
            const res = await applicationsApi.list()
            raw = res.data.applications
          } else {
            const results = await Promise.allSettled(
              jobIds.map(id => applicationsApi.getByJob(id))
            )
            for (const r of results) {
              if (r.status === 'fulfilled') raw.push(...r.value.data.applications)
            }
          }
        }
        if (!cancelled) setApplications(raw.map(normalizeApplication))
        // Fetch user data for all unique user_ids
        const uniqueIds = [...new Set(raw.map(a => a.user_id))]
        const entries = await Promise.allSettled(
          uniqueIds.map(async (id) => {
            const res = await usersApi.getById(id)
            return [id, { name: res.data.name, email: res.data.email }] as const
          })
        )
        if (!cancelled) {
          const map: Record<string, { name: string; email: string }> = {}
          for (const e of entries) {
            if (e.status === 'fulfilled') {
              const [id, data] = e.value
              map[id] = data
            }
          }
          setUsersMap(map)
        }
      } catch {
        if (!cancelled) setApplications([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    if (!jobsLoading) loadApps()
    return () => { cancelled = true }
  }, [selectedJobId, jobs, jobsLoading])

  const handleStatusChange = useCallback((id: string, newStatus: Application['status']) => {
    setApplications(prev =>
      prev.map(a => a.id === id ? { ...a, status: newStatus } : a)
    )
    setDetailApplicant(null)
  }, [])

  const handleScheduleComplete = useCallback((applicantId: string) => {
    handleStatusChange(applicantId, 'interview')
    setScheduleApplicant(null)
  }, [handleStatusChange])

  const handleReject = useCallback(async (id: string) => {
    setActionLoading(id)
    try {
      await applicationsApi.update(id, { status: 'rejected' })
      handleStatusChange(id, 'rejected')
      toast.success('Pelamar berhasil ditolak.')
  } catch {
    // error already shown by global API listener
    } finally {
      setActionLoading(null)
    }
  }, [handleStatusChange, toast])

  // Filter by status tab
  const filtered = activeStatus === 'all'
    ? applications
    : applications.filter(a => a.status === activeStatus)

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('employer.applicants.title')}</h1>
        <p className="mt-1 text-sm text-gray-500">{t('employer.applicants.subtitle')}</p>
      </div>

      {/* Job Filter */}
      <div className="mb-4">
        <label htmlFor="job-filter" className="mb-1 block text-sm font-medium text-gray-700">
          {t('employer.applicants.filterJob')}
        </label>
        <select
          id="job-filter"
          value={selectedJobId}
          onChange={(e) => setSelectedJobId(e.target.value)}
          disabled={jobsLoading}
          className="w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <option value="all">{t('employer.applicants.allJobs')}</option>
          {jobs.map(j => (
            <option key={j.id} value={j.id}>{j.title}</option>
          ))}
        </select>
      </div>

      {/* Status Tabs */}
      <div className="mb-4 flex flex-wrap gap-1 border-b">
        {statusTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveStatus(tab.key)}
            className={`px-4 py-2 text-sm font-medium transition ${
              activeStatus === tab.key
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {tab.key !== 'all' && (
              <span className="ml-1.5 rounded-full bg-gray-100 px-1.5 py-0.5 text-xs">
                {applications.filter(a => a.status === tab.key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('employer.applicants.name')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('employer.applicants.email')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('employer.applicants.job')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('employer.applicants.date')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('employer.table.status')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('employer.applicants.score')}</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">{t('employer.table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 w-20 rounded bg-gray-200" />
                        </td>
                      ))}
                    </tr>
                  ))
                : filtered.length === 0
                  ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-16 text-center">
                        <div className="flex flex-col items-center text-gray-400">
                          <svg className="mb-3 h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                          </svg>
                          <p className="text-lg font-medium">{t('employer.applicants.noApplicants')}</p>
                          <p className="text-sm">{t('employer.applicants.noApplicants')}</p>
                        </div>
                      </td>
                    </tr>
                  )
                  : filtered.map((app) => {
                    const user = usersMap[app.user_id]
                    const displayName = user?.name ?? app.user_id
                    const displayEmail = user?.email ?? ''
                    return (
                      <tr key={app.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                              {displayName.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium">{displayName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{displayEmail || app.user_id}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {jobs.find(j => j.id === app.job_id)?.title ?? app.job_id}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{formatDate(app.created_at)}</td>
                        <td className="px-4 py-3">
                          <Badge variant={applicationStatusConfig[app.status]?.color ?? 'default'}>
                            {applicationStatusConfig[app.status]?.label ?? app.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {(() => {
                            const score = getAtsScore(app)
                            return score != null ? (
                              <span className={`text-sm font-semibold ${
                                score >= 70 ? 'text-emerald-600' : score >= 40 ? 'text-amber-600' : 'text-red-600'
                              }`}>
                                {score}%
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )
                          })()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              loading={detailLoadingId === app.id}
                              onClick={async () => {
                                setDetailLoadingId(app.id)
                                const hydrated = await hydrateApplicantDetail(app)
                                setDetailApplicant(hydrated)
                                setDetailLoadingId(null)
                              }}
                            >
                              {t('employer.applicants.view')}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                setDetailLoadingId(app.id)
                                const hydrated = await hydrateApplicantDetail(app)
                                setScheduleApplicant(hydrated)
                                setDetailLoadingId(null)
                              }}
                              disabled={app.status === 'rejected' || app.status === 'accepted'}
                            >
                              {t('employer.applicants.interview')}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:bg-red-50"
                              onClick={() => handleReject(app.id)}
                              loading={actionLoading === app.id}
                            >
                              {t('employer.reject')}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {detailApplicant && (
        <ApplicantDetailModal
          applicant={detailApplicant}
          enrichedUser={detailApplicant.enrichedUser}
          jobs={jobs}
          onClose={() => setDetailApplicant(null)}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Schedule Interview Modal */}
      {scheduleApplicant && (
        <ScheduleInterviewModal
          applicant={scheduleApplicant}
          enrichedUser={scheduleApplicant.enrichedUser}
          jobs={jobs}
          companyId={company?.id}
          onClose={() => setScheduleApplicant(null)}
          onScheduled={handleScheduleComplete}
        />
      )}
    </div>
  )
}
