'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { applicationsApi, companiesApi, interviewsApi } from '@/lib/api'
import { useModalAnimation } from '@/hooks/use-modal-animation'
import { getAtsScore, type ApplicantDetail, type EnrichedUser } from './applicant-data'
import type { Application, Interview, Job } from '@/types'
import { useToast } from '@/providers/toast-provider'
import { useI18n } from '@/hooks/use-i18n'

interface ApplicantDetailProps {
  applicant: ApplicantDetail
  enrichedUser: EnrichedUser
  jobs: Job[]
  onClose: () => void
  onStatusChange: (id: string, status: Application['status']) => void
}

export function ApplicantDetailModal({ applicant, enrichedUser, jobs, onClose, onStatusChange }: ApplicantDetailProps) {
  const { mounted, visible, handleClose } = useModalAnimation({ onClose })
  const { t } = useI18n()
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  const statusLabel: Record<Application['status'], string> = {
    pending: t('employer.detailModal.status.pending'),
    under_review: t('employer.detailModal.status.under_review'),
    interview: t('employer.detailModal.status.interview'),
    accepted: t('employer.detailModal.status.accepted'),
    rejected: t('employer.detailModal.status.rejected'),
  }

  const job = jobs.find((j) => j.id === applicant.job_id)
  const score = getAtsScore(applicant)
  const dash = `${score ?? 0}, 100`
  const skills = applicant.userSkills ?? applicant.skills ?? []
  const hasDocument = !!(applicant.document?.id ?? applicant.document_id ?? applicant.documentId)
  const location = enrichedUser.location || t('employer.detailModal.notSet')

  const handleScheduleInterview = async () => {
    setSaving(true)
    try {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(10, 0, 0, 0)
      await interviewsApi.create({
        application_id: applicant.id,
        company_id: job?.company_id ?? '',
        user_id: applicant.user_id,
        job_id: applicant.job_id,
        scheduled_at: tomorrow.toISOString(),
        duration_minutes: 30,
        timezone: 'Asia/Jakarta',
        interview_type: 'video',
        notes: notes || 'Interview scheduled from applicant detail view',
      })
      onStatusChange(applicant.id, 'interview')
      toast.success('Interview berhasil dijadwalkan.')
      onClose()
  } catch {
    } finally {
      setSaving(false)
    }
  }

  const handleAccept = useCallback(async () => {
    setSaving(true)
    try {
      await applicationsApi.update(applicant.id, { status: 'accepted' })
      onStatusChange(applicant.id, 'accepted')
      handleClose()
      toast.success('Pelamar berhasil diterima.')
    } catch {
    } finally {
      setSaving(false)
    }
  }, [applicant.id, onStatusChange, handleClose, toast])

  const handleReject = useCallback(async () => {
    setSaving(true)
    try {
      await applicationsApi.update(applicant.id, { status: 'rejected' })
      onStatusChange(applicant.id, 'rejected')
      handleClose()
      toast.success('Pelamar berhasil ditolak.')
    } catch {
    } finally {
      setSaving(false)
    }
  }, [applicant.id, onStatusChange, handleClose, toast])

  return (
    <>
      <div aria-hidden="true" className={`fixed inset-0 z-40 backdrop-blur-[2px] transition-all duration-200 ${visible ? 'bg-on-background/40' : 'bg-on-background/0'}`} onClick={handleClose} />
      <div className={`fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-border-subtle bg-surface shadow-2xl transition-transform duration-200 ease-out md:w-[40%] ${visible ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex shrink-0 items-center justify-between border-b border-border-subtle bg-surface-container-lowest px-6 py-4">
          <div>
            <h2 className="text-2xl font-semibold leading-8 tracking-[-0.01em] text-primary">{enrichedUser.name}</h2>
            <p className="mt-1 text-[13px] leading-[18px] text-on-surface-variant">
              {job?.title ?? applicant.job_id} • {statusLabel[applicant.status]}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary"
            aria-label="Tutup"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 space-y-8 overflow-y-auto bg-background p-6">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 flex items-center justify-center lg:col-span-4">
              <div className="relative flex h-32 w-32 items-center justify-center rounded-full border border-border-subtle bg-surface">
                <svg className="absolute h-full w-full -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" className="text-border-subtle" strokeWidth="3" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" className={score == null ? 'text-outline-variant' : 'text-status-open'} strokeWidth="3" strokeDasharray={dash} />
                </svg>
                <div className="z-10 text-center">
                  <span className="block text-4xl font-bold leading-[44px] tracking-[-0.02em] text-primary">{score ?? '-'}</span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">ATS Score</span>
                </div>
              </div>
            </div>
            <div className="col-span-12 flex flex-col justify-center gap-3 lg:col-span-8">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-outline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                <span className="text-sm leading-5 text-on-surface">{enrichedUser.email || t('employer.detailModal.notAvailable')}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-outline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                <span className="text-sm leading-5 text-on-surface">{enrichedUser.phone || t('employer.detailModal.notAvailable')}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-outline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span className="text-sm leading-5 text-on-surface">{location}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {skills.length > 0 ? skills.map((skill) => (
                  <span key={skill} className="rounded border border-border-subtle bg-surface-container px-2 py-1 text-[11px] font-bold leading-[14px] text-on-surface-variant">{skill}</span>
                )) : null}
              </div>
            </div>
          </div>

          {enrichedUser.bio && (
            <>
              <hr className="border-border-subtle" />
              <section className="space-y-2">
                <h3 className="text-base font-semibold leading-6 text-primary">{t('employer.detailModal.summary')}</h3>
                <p className="text-sm leading-6 text-on-surface">{enrichedUser.bio}</p>
              </section>
            </>
          )}
          <hr className="border-border-subtle" />

          <section className="space-y-4">
            <h3 className="text-base font-semibold leading-6 text-primary">{t('employer.detailModal.cv')}</h3>
            {hasDocument ? (
              <div className="rounded-xl border border-border-subtle bg-surface p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-on-surface">CV telah diunggah oleh pelamar</p>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        const res = await applicationsApi.getDocument(applicant.id)
                        if (!res.ok) throw new Error('Gagal mengunduh')
                        const blob = await res.blob()
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `cv-${applicant.user_id}.pdf`
                        a.click()
                        URL.revokeObjectURL(url)
                      } catch {
                      }
                    }}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold leading-5 text-on-primary shadow-sm transition-colors hover:bg-sidebar-navy"
                  >
                    {t('employer.detailModal.downloadCV')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border-subtle bg-surface p-6 text-sm text-on-surface-variant">
                CV belum tersedia untuk lamaran ini.
              </div>
            )}
          </section>

          <hr className="border-border-subtle" />

          <section className="space-y-4">
            <h3 className="text-base font-semibold leading-6 text-primary">{t('employer.detailModal.recruiterNotes')}</h3>
            <textarea
              className="h-24 w-full resize-none rounded-lg border border-border-subtle bg-surface p-3 text-[13px] leading-[18px] text-on-surface transition-all placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder={t('employer.detailModal.addNotes')}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </section>
        </div>

        <div className="flex shrink-0 flex-wrap gap-3 border-t border-border-subtle bg-surface-container-lowest p-6">
          <button
            onClick={handleScheduleInterview}
            disabled={saving}
            className="flex-1 rounded-lg bg-primary py-3 px-4 text-sm font-semibold leading-5 text-on-primary shadow-sm transition-colors hover:bg-sidebar-navy disabled:opacity-50"
          >
            {t('employer.detailModal.scheduleInterview')}
          </button>
          <div className="flex w-full gap-3 sm:w-auto">
            <button
              onClick={handleReject}
              disabled={saving}
              className="flex-1 rounded-lg border border-status-rejected py-3 px-6 text-sm font-semibold leading-5 text-status-rejected transition-colors hover:bg-error-container/20 disabled:opacity-50 sm:flex-none"
            >
              {t('employer.reject')}
            </button>
            <button
              onClick={handleAccept}
              disabled={saving}
              className="flex-1 rounded-lg bg-status-open py-3 px-6 text-sm font-semibold leading-5 text-white shadow-sm transition-colors hover:bg-secondary disabled:opacity-50 sm:flex-none"
            >
              {t('employer.accept')}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

interface ScheduleInterviewModalProps {
  applicant: ApplicantDetail
  enrichedUser: EnrichedUser
  jobs: Job[]
  companyId?: string
  onClose: () => void
  onScheduled: (applicantId: string) => void
}

const HOURS_ALL = ['09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30']
const DAY_LABELS = ['Min','Sen','Sel','Rab','Kam','Jum','Sab']
const MONTH_NAMES = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

function parseHHmm(s: string): number { const [h,m] = s.split(':').map(Number); return h * 60 + m }

function getMonthGrid(year: number, month: number) {
  const first = new Date(year, month, 1)
  const startDay = first.getDay() // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: { date: Date; day: number }[] = []
  // Pad previous month
  for (let i = 0; i < startDay; i++) {
    const d = new Date(year, month, -(startDay - 1 - i))
    cells.push({ date: d, day: d.getDate() })
  }
  for (let d = 1; d <= daysInMonth; d++) cells.push({ date: new Date(year, month, d), day: d })
  // Pad to complete row
  while (cells.length % 7 !== 0) {
    const d = new Date(year, month, daysInMonth + (cells.length - startDay - daysInMonth) + 1)
    cells.push({ date: d, day: d.getDate() })
  }
  return cells
}

export function ScheduleInterviewModal({ applicant, enrichedUser, jobs, companyId, onClose, onScheduled }: ScheduleInterviewModalProps) {
  const { mounted, visible, handleClose } = useModalAnimation({ onClose })
  const { t } = useI18n()

  const today = new Date()

  const [calMonth, setCalMonth] = useState(today.getMonth())
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [interviewType, setInterviewType] = useState('video')
  const [meetingLink, setMeetingLink] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [slots, setSlots] = useState<{ time: string; available: boolean; reason?: string }[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const toast = useToast()
  const job = jobs.find((j) => j.id === applicant.job_id)

  const monthGrid = useMemo(() => getMonthGrid(calYear, calMonth), [calYear, calMonth])
  const todayStr = today.toISOString().slice(0, 10)

  // Fetch availability + interviews when date selected
  useEffect(() => {
    if (!selectedDate || !companyId) { setSlots([]); return }
    let cancelled = false
    setSlotsLoading(true)
    setSelectedTime(null)

    const dayOfWeek = selectedDate.getDay() // 0=Sun
    const dateStr = selectedDate.toISOString().slice(0, 10)

    Promise.all([
      companiesApi.getAvailability(companyId),
      interviewsApi.listByCompany(companyId),
    ]).then(([availRes, interviewRes]) => {
      if (cancelled) return
      const avail = availRes.data ?? []
      const dayAvail = avail.find((a) => a.day_of_week === dayOfWeek && a.is_active)

      if (!dayAvail) {
        setSlots(HOURS_ALL.map(hr => ({ time: hr, available: false, reason: t('employer.detailModal.notAvailable') })))
        setSlotsLoading(false)
        return
      }

      const availStart = parseHHmm(dayAvail.start_time)
      const availEnd = parseHHmm(dayAvail.end_time)

      // Existing interviews on this date
      const existing = (interviewRes.data.interviews ?? []).filter((iv) => {
        const d = new Date(iv.scheduled_at).toISOString().slice(0, 10)
        return d === dateStr && iv.status !== 'cancelled'
      })

      const result = HOURS_ALL.map((hr) => {
        const mins = parseHHmm(hr)
        if (mins < availStart || mins >= availEnd) return { time: hr, available: false, reason: 'Di luar jam kerja' }
        const conflict = existing.some((iv) => {
          const ivStart = new Date(iv.scheduled_at).getHours() * 60 + new Date(iv.scheduled_at).getMinutes()
          const ivDur = iv.duration_minutes || 45
          return mins >= ivStart && mins < ivStart + ivDur
        })
        if (conflict) return { time: hr, available: false, reason: 'Sudah terjadwal' }
        return { time: hr, available: true }
      })
      setSlots(result)
    }).finally(() => { if (!cancelled) setSlotsLoading(false) })

    return () => { cancelled = true }
  }, [selectedDate, companyId])

  const canSubmit = selectedDate && selectedTime
  const handleSubmit = async () => {
    if (!canSubmit) return
    setSaving(true)
    try {
      const dateStr = selectedDate.toISOString().slice(0, 10)
      await interviewsApi.create({
        application_id: applicant.id,
        company_id: companyId ?? job?.company_id ?? '',
        user_id: applicant.user_id,
        job_id: applicant.job_id,
        scheduled_at: new Date(`${dateStr}T${selectedTime}:00`).toISOString(),
        duration_minutes: 45,
        timezone: 'Asia/Jakarta',
        interview_type: interviewType as Interview['interview_type'],
        meeting_platform: interviewType === 'video' ? 'gmeet' : undefined,
        meeting_link: interviewType === 'video' && meetingLink.trim() ? meetingLink.trim() : undefined,
      })
      await applicationsApi.update(applicant.id, { status: 'interview' })
      onScheduled(applicant.id)
      toast.success('Interview berhasil dijadwalkan.')
    } catch {
    } finally {
      setSaving(false)
    }
  }

  const typeButtons = [
    { key: 'video', label: t('employer.interviewModal.video'), icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
    { key: 'phone', label: t('employer.interviewModal.phone'), icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' },
    { key: 'in-person', label: t('employer.interviewModal.onsite'), icon: 'M3 21h18M5 21V7l8-4v18M19 21V11l-6-4' },
  ]

  if (!mounted) return null

  return (
    <div aria-labelledby="modal-title" aria-modal="true" className={`fixed inset-0 z-[80] flex items-center justify-center p-6 backdrop-blur-[8px] transition-all duration-200 ${visible ? 'bg-inverse-surface/40' : 'bg-inverse-surface/0'}`} role="dialog">
      <div className={`flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-surface shadow-2xl transition-all duration-200 ease-out ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-[0.97]'}`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle bg-surface-container-lowest p-6">
          <div>
            <h2 className="text-xl font-semibold leading-7 text-primary" id="modal-title">{t('employer.interviewModal.title')}</h2>
            <p className="mt-1 text-[13px] leading-[18px] text-on-surface-variant">{enrichedUser.name} &bull; {job?.title ?? applicant.job_id}</p>
          </div>
          <button type="button" onClick={handleClose} className="rounded-lg p-1 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Left: Calendar + Interview Type */}
            <div className="border-b border-border-subtle p-6 md:border-b-0 md:border-r">
              {/* Interview Type */}
              <div className="mb-5">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{t('employer.interviewModal.type')}</label>
                <div className="flex gap-2">
                  {typeButtons.map((type) => {
                    const active = interviewType === type.key
                    return (
                      <button key={type.key} type="button" onClick={() => setInterviewType(type.key)}
                        className={active
                          ? 'flex items-center gap-1.5 rounded-full border border-primary bg-primary-fixed px-3 py-1.5 text-xs font-semibold text-primary'
                          : 'flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface-container-lowest px-3 py-1.5 text-xs font-semibold text-on-surface-variant hover:border-primary/50'
                        }>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.4 : 2}><path strokeLinecap="round" strokeLinejoin="round" d={type.icon} /></svg>
                        {type.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Meeting Link (only for video) */}
              {interviewType === 'video' && (
                <div className="mb-5">
                  <label htmlFor="meetingLink" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Link Meeting</label>
                  <input
                    id="meetingLink"
                    type="url"
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                    className="block w-full rounded-lg border border-border-subtle bg-surface-container-lowest p-2.5 text-sm leading-5 transition-shadow focus:border-primary focus:ring-2 focus:ring-primary"
                    placeholder="https://meet.google.com/xxx-yyyy-zzz"
                  />
                  <p className="mt-1 text-[11px] text-on-surface-variant/70">Masukkan link Google Meet, Zoom, atau platform video lainnya.</p>
                </div>
              )}

              {/* Mini Calendar */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <button type="button" onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1) } else setCalMonth(calMonth - 1) }}
                    className="rounded p-1 text-on-surface-variant hover:bg-surface-container">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <span className="text-sm font-semibold text-on-surface">{MONTH_NAMES[calMonth]} {calYear}</span>
                  <button type="button" onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1) } else setCalMonth(calMonth + 1) }}
                    className="rounded p-1 text-on-surface-variant hover:bg-surface-container">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center">
                  {DAY_LABELS.map((d) => <div key={d} className="py-1 text-[11px] font-bold text-on-surface-variant">{d}</div>)}
                  {monthGrid.map(({ date }, i) => {
                    const dateStr = date.toISOString().slice(0, 10)
                    const isPast = dateStr < todayStr
                    const isCurrentMonth = date.getMonth() === calMonth
                    const isSelected = selectedDate?.toISOString().slice(0, 10) === dateStr
                    const isToday = dateStr === todayStr
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6
                    return (
                      <button key={i} type="button" disabled={isPast || !isCurrentMonth || isWeekend}
                        onClick={() => setSelectedDate(date)}
                        className={`relative flex h-8 w-8 items-center justify-center rounded-full text-sm transition-colors
                          ${isSelected ? 'bg-primary font-bold text-on-primary' : ''}
                          ${!isSelected && isToday ? 'border border-primary font-semibold text-primary' : ''}
                          ${!isSelected && !isPast && isCurrentMonth && !isWeekend ? 'text-on-surface hover:bg-primary-container' : ''}
                          ${isPast || !isCurrentMonth || isWeekend ? 'text-on-surface-variant/40 cursor-not-allowed' : 'cursor-pointer'}
                        `}>
                        {date.getDate()}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Notes */}
              <div className="mt-5">
                <label htmlFor="notes" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{t('employer.interviewModal.notes')}</label>
                <textarea id="notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)}
                  className="block w-full resize-none rounded-lg border border-border-subtle bg-surface-container-lowest p-2.5 text-sm leading-5 transition-shadow focus:border-primary focus:ring-2 focus:ring-primary"
                  placeholder={t('employer.interviewModal.notesPlaceholder', { name: enrichedUser.name })} />
              </div>
            </div>

            {/* Right: Time Slots */}
            <div className="p-6">
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{t('employer.interviewModal.selectTime')}</h3>
              {!selectedDate ? (
                <p className="mt-8 text-center text-sm text-on-surface-variant">{t('employer.interviewModal.selectDate')}</p>
              ) : slotsLoading ? (
                <div className="mt-8 space-y-2">
                  {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-surface-container" />)}
                </div>
              ) : (
                <>
                  <p className="mb-3 text-sm text-on-surface-variant">
                    {selectedDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {slots.map((slot) => {
                      const isSel = selectedTime === slot.time
                      return (
                        <button key={slot.time} type="button" disabled={!slot.available}
                          onClick={() => setSelectedTime(slot.time)}
                          title={slot.available ? slot.time : slot.reason}
                          className={`rounded-lg px-2 py-2.5 text-sm font-semibold transition-all
                            ${isSel ? 'bg-primary text-on-primary shadow-sm ring-2 ring-primary ring-offset-1' : ''}
                            ${!isSel && slot.available ? 'border border-border-subtle bg-surface-container-lowest text-on-surface hover:border-primary hover:bg-primary-container cursor-pointer' : ''}
                            ${!slot.available ? 'border border-border-subtle/50 bg-surface-container-low text-on-surface-variant/40 cursor-not-allowed line-through' : ''}
                          `}>
                          {slot.time}
                        </button>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-border-subtle bg-surface-container-lowest p-6">
          <button type="button" onClick={handleClose} className="rounded-lg border border-border-subtle px-6 py-2.5 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container">{t('employer.interviewModal.cancel')}</button>
          <button onClick={handleSubmit} disabled={!canSubmit || saving}
            className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            {t('employer.interviewModal.schedule')}
          </button>
        </div>
      </div>
    </div>
  )
}
