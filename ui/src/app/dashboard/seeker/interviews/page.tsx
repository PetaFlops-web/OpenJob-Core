'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/providers/auth-provider'
import { useToast } from '@/providers/toast-provider'
import { interviewsApi, jobsApi, companiesApi } from '@/lib/api'
import type { Interview, Job, Company } from '@/types'
import { InterviewCard } from '@/components/cards/interview-card'
import { EmptyState } from '@/components/ui/empty-state'
import { Modal } from '@/components/modals/modal'
import { CalendarDays, List, Calendar, Video, Phone, MapPin, ExternalLink, Clock, Building2, Briefcase, FileText, ChevronRight } from 'lucide-react'
import { cn, formatDateTime } from '@/lib/utils'

function InterviewSkeletonCard() {
  return (
    <div className="animate-pulse flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5 sm:flex-row sm:items-start">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gray-200" />
      <div className="min-w-0 flex-1 space-y-3">
        <div className="flex gap-2">
          <div className="h-5 w-20 rounded-full bg-gray-200" />
          <div className="h-5 w-16 rounded-full bg-gray-200" />
        </div>
        <div className="h-5 w-3/4 rounded bg-gray-200" />
        <div className="h-4 w-1/2 rounded bg-gray-200" />
        <div className="flex gap-4">
          <div className="h-4 w-32 rounded bg-gray-200" />
          <div className="h-4 w-24 rounded bg-gray-200" />
        </div>
      </div>
      <div className="flex gap-2 shrink-0 sm:flex-col">
        <div className="h-8 w-24 rounded-lg bg-gray-200" />
        <div className="h-8 w-24 rounded-lg bg-gray-200" />
      </div>
    </div>
  )
}
export default function InterviewsPage() {
  const { user } = useAuth()
  const toast = useToast()
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null)
  const [jobsMap, setJobsMap] = useState<Record<string, Job>>({})
  const [companiesMap, setCompaniesMap] = useState<Record<string, Company>>({})

  const fetchInterviews = useCallback(async () => {
    if (!user?.id) return
    try {
      const res = await interviewsApi.listByUser()
      const raw = res.data.interviews
      setInterviews(raw)

      // Enrich: fetch job + company data for each interview
      const jobIds = [...new Set(raw.map(i => i.job_id).filter(Boolean))]
      const companyIds = [...new Set(raw.map(i => i.company_id).filter(Boolean))]

      const [jobResults, companyResults] = await Promise.all([
        Promise.all(jobIds.map(id => jobsApi.getById(id).catch(() => null))),
        Promise.all(companyIds.map(id => companiesApi.getById(id).catch(() => null))),
      ])

      const jMap: Record<string, Job> = {}
      jobResults.forEach((r, idx) => { if (r?.data) jMap[jobIds[idx]] = r.data as Job })
      setJobsMap(jMap)

      const cMap: Record<string, Company> = {}
      companyResults.forEach((r, idx) => { if (r?.data) cMap[companyIds[idx]] = r.data as Company })
      setCompaniesMap(cMap)
    } catch {
      // silently ignore
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchInterviews()
  }, [fetchInterviews])

  // Get the next upcoming scheduled interview
  const nextInterview = interviews
    .filter((i) => i.status === 'scheduled' && new Date(i.scheduled_at) > new Date())
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())[0]

  const handleJoin = (interview: Interview) => {
    if (interview.meeting_link) {
      window.open(interview.meeting_link, '_blank')
      toast.success('Membuka link interview.')
    } else {
      toast.error('Link meeting belum tersedia.')
    }
  }

  const handleReschedule = (interview: Interview) => {
    const jobTitle = jobsMap[interview.job_id]?.title ?? 'lowongan ini'
    toast.info(`Reschedule interview untuk "${jobTitle}" belum tersedia.`)
  }

  const handleCancel = async (interview: Interview) => {
    if (!confirm('Yakin ingin membatalkan interview ini?')) return
    try {
      await interviewsApi.update(interview.id, { status: 'cancelled' })
      setInterviews((prev) =>
        prev.map((i) => (i.id === interview.id ? { ...i, status: 'cancelled' } : i))
      )
      toast.success('Interview berhasil dibatalkan.')
  } catch {
    }
  }

  // Sort interviews: scheduled first (by date), then others
  const sortedInterviews = [...interviews].sort((a, b) => {
    const aScheduled = a.status === 'scheduled' ? 0 : 1
    const bScheduled = b.status === 'scheduled' ? 0 : 1
    if (aScheduled !== bScheduled) return aScheduled - bScheduled
    return new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime()
  })

  const typeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-4 w-4" />
      case 'phone':
        return <Phone className="h-4 w-4" />
      case 'in-person':
        return <MapPin className="h-4 w-4" />
      default:
        return <CalendarDays className="h-4 w-4" />
    }
  }


  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Jadwal Interview</h1>
            <p className="mt-1 text-sm text-gray-500">Kelola jadwal interview Anda.</p>
          </div>
          <div className="flex gap-1 rounded-lg border bg-white p-1">
            <button className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-500">
              <List className="h-4 w-4" />
            </button>
            <button className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-500">
              <Calendar className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <InterviewSkeletonCard key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (interviews.length === 0) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Jadwal Interview</h1>
            <p className="mt-1 text-sm text-gray-500">Kelola jadwal interview Anda.</p>
          </div>
          <div className="flex gap-1 rounded-lg border bg-white p-1">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium',
                viewMode === 'list' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'
              )}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium',
                viewMode === 'calendar' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'
              )}
            >
              <Calendar className="h-4 w-4" />
            </button>
          </div>
        </div>
        <EmptyState
          icon={<CalendarDays className="h-8 w-8" />}
          title="Belum ada interview"
          description="Interview akan muncul setelah Anda melamar dan perusahaan mengundang Anda."
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jadwal Interview</h1>
          <p className="mt-1 text-sm text-gray-500">
            {interviews.length} interview{interviews.length > 1 ? ' total' : ''}
          </p>
        </div>

        {/* View toggle */}
        <div className="flex gap-1 rounded-lg border bg-white p-1">
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              viewMode === 'list' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">List</span>
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              viewMode === 'calendar' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Calendar</span>
          </button>
        </div>
      </div>

      {/* Next upcoming interview highlight */}
      {nextInterview && viewMode === 'list' && (
        <div className="mb-4 rounded-xl border-2 border-blue-200 bg-blue-50/50 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-600">
            Interview Berikutnya
          </p>
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
              nextInterview.interview_type === 'video' && 'bg-blue-100 text-blue-600',
              nextInterview.interview_type === 'phone' && 'bg-emerald-100 text-emerald-600',
              nextInterview.interview_type === 'in-person' && 'bg-amber-100 text-amber-600',
            )}>
              {typeIcon(nextInterview.interview_type)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-900">
                {jobsMap[nextInterview.job_id]?.title ?? 'Lowongan'}
              </p>
              <p className="truncate text-sm text-gray-500">
                {companiesMap[nextInterview.company_id]?.name ?? 'Perusahaan'}
              </p>
            </div>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-gray-900">
                {new Date(nextInterview.scheduled_at).toLocaleDateString('id-ID', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
              <p className="text-sm text-gray-500">
                {new Date(nextInterview.scheduled_at).toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Calendar view: simple month grid */}
      {viewMode === 'calendar' ? (
        <CalendarView interviews={sortedInterviews} jobsMap={jobsMap} companiesMap={companiesMap} onClickInterview={setSelectedInterview} />
      ) : (
        /* List view */
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {sortedInterviews.map((interview) => {
            const isNext = nextInterview?.id === interview.id
            return (
              <InterviewCard
                key={interview.id}
                interview={{ ...interview, job: jobsMap[interview.job_id], company: companiesMap[interview.company_id] }}
                className={isNext ? 'border-2 border-blue-200' : undefined}
                onClick={() => setSelectedInterview(interview)}
                onJoin={() => handleJoin(interview)}
                onReschedule={() => handleReschedule(interview)}
                onCancel={() => handleCancel(interview)}
              />
            )
          })}
        </div>
      )}

      {/* Interview Detail Modal */}
      {selectedInterview && (() => {
        const job = jobsMap[selectedInterview.job_id]
        const company = companiesMap[selectedInterview.company_id]
        const scheduledDate = new Date(selectedInterview.scheduled_at)
        const statusConfig: Record<string, { label: string; color: string }> = {
          scheduled: { label: 'Terjadwal', color: 'bg-blue-100 text-blue-700' },
          completed: { label: 'Selesai', color: 'bg-green-100 text-green-700' },
          cancelled: { label: 'Dibatalkan', color: 'bg-red-100 text-red-700' },
          'no-show': { label: 'Tidak Hadir', color: 'bg-amber-100 text-amber-700' },
        }
        const status = statusConfig[selectedInterview.status] ?? { label: selectedInterview.status, color: 'bg-gray-100 text-gray-700' }
        const typeLabels: Record<string, string> = { video: 'Video Call', phone: 'Telepon', 'in-person': 'Tatap Muka' }
        const platformLabels: Record<string, string> = { zoom: 'Zoom', gmeet: 'Google Meet', teams: 'Microsoft Teams' }

        return (
          <Modal open onClose={() => setSelectedInterview(null)} title="Detail Interview" maxWidth="max-w-lg">
            <div className="space-y-5">
              {/* Status + Type badges */}
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status.color}`}>
                  {status.label}
                </span>
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                  {typeLabels[selectedInterview.interview_type] ?? selectedInterview.interview_type}
                </span>
              </div>

              {/* Job & Company */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Briefcase className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{job?.title ?? 'Lowongan tidak ditemukan'}</p>
                    <p className="text-xs text-gray-500">Posisi</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{company?.name ?? 'Perusahaan tidak ditemukan'}</p>
                    <p className="text-xs text-gray-500">Perusahaan</p>
                  </div>
                </div>
              </div>

              {/* Date & Time */}
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {scheduledDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <p className="text-sm text-gray-600">
                      {scheduledDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} · {selectedInterview.duration_minutes} menit
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{selectedInterview.timezone ?? 'Asia/Jakarta'}</p>
                  </div>
                </div>
              </div>

              {/* Meeting info */}
              {(selectedInterview.meeting_platform || selectedInterview.meeting_link) && (
                <div className="space-y-2">
                  {selectedInterview.meeting_platform && (
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Video className="h-4 w-4 text-gray-400" />
                      <span>Platform: {platformLabels[selectedInterview.meeting_platform] ?? selectedInterview.meeting_platform}</span>
                    </div>
                  )}
                  {selectedInterview.meeting_link && selectedInterview.status === 'scheduled' && (
                    <a
                      href={selectedInterview.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Buka Link Meeting
                    </a>
                  )}
                </div>
              )}

              {/* Location (for in-person) */}
              {selectedInterview.interview_type === 'in-person' && selectedInterview.location && (
                <div className="flex items-start gap-2 text-sm text-gray-700">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                  <span>{selectedInterview.location}</span>
                </div>
              )}

              {/* Notes */}
              {selectedInterview.notes && (
                <div className="flex items-start gap-2">
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Catatan</p>
                    <p className="text-sm text-gray-700">{selectedInterview.notes}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              {selectedInterview.status === 'scheduled' && (
                <div className="flex gap-3 pt-2 border-t border-gray-100">
                  {selectedInterview.meeting_link && (
                    <button
                      onClick={() => { window.open(selectedInterview.meeting_link!, '_blank'); toast.success('Membuka link interview.') }}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Join Meeting
                    </button>
                  )}
                  <button
                    onClick={() => handleCancel(selectedInterview)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Batalkan
                  </button>
                </div>
              )}
            </div>
          </Modal>
        )
      })()}
    </div>
  )
}

/** Simple calendar view grouping interviews by date */
function CalendarView({ interviews, jobsMap, companiesMap, onClickInterview }: { interviews: Interview[]; jobsMap: Record<string, Job>; companiesMap: Record<string, Company>; onClickInterview: (i: Interview) => void }) {
  // Group by date string
  const grouped = interviews.reduce<Record<string, Interview[]>>((acc, interview) => {
    const dateKey = interview.scheduled_at.split('T')[0]
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(interview)
    return acc
  }, {})

  const sortedDates = Object.keys(grouped).sort()

  if (sortedDates.length === 0) {
    return <p className="text-sm text-gray-500">Tidak ada interview dijadwalkan.</p>
  }

  return (
    <div className="space-y-6">
      {sortedDates.map((date) => {
        const items = grouped[date]
        const dateObj = new Date(date + 'T00:00:00')
        return (
          <div key={date}>
            <h3 className="mb-3 text-sm font-semibold text-gray-700">
              {dateObj.toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {items.map((interview) => (
                <div
                  key={interview.id}
                  className="flex cursor-pointer flex-col gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 transition-all hover:-translate-y-0.5 hover:shadow-md sm:flex-row sm:items-center sm:gap-3"
                  onClick={() => onClickInterview(interview)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClickInterview(interview) } }}
                >
                  <div className="text-sm font-medium text-gray-900">
                    {new Date(interview.scheduled_at).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                  <div className="hidden h-6 w-px bg-gray-200 sm:block" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {jobsMap[interview.job_id]?.title ?? 'Lowongan'}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {companiesMap[interview.company_id]?.name ?? 'Perusahaan'}
                    </p>
                  </div>
                  <span className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                    interview.interview_type === 'video' && 'bg-blue-100 text-blue-700',
                    interview.interview_type === 'phone' && 'bg-emerald-100 text-emerald-700',
                    interview.interview_type === 'in-person' && 'bg-amber-100 text-amber-700',
                  )}>
                    {interview.interview_type === 'video' && <Video className="h-3 w-3" />}
                    {interview.interview_type === 'phone' && <Phone className="h-3 w-3" />}
                    {interview.interview_type === 'in-person' && <MapPin className="h-3 w-3" />}
                    {interview.interview_type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
