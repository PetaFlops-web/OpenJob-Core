'use client'

import { Fragment, useEffect, useMemo, useState } from 'react'
import { companiesApi, interviewsApi, usersApi, jobsApi } from '@/lib/api'
import { useEmployer } from '@/providers/employer-provider'
import { useI18n } from '@/hooks/use-i18n'
import type { Interview } from '@/types'

const HOURS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00']
const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const SHORT_DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

type AvailabilityRow = {
  id?: string
  dayIndex: number
  day: string
  start: string
  end: string
  active: boolean
}

type Appointment = {
  id: string
  date: string // YYYY-MM-DD
  day: string
  hour: string
  title: string
  name: string
  type: string
  note: string
  color: string
}

function startOfWeek(date: Date) {
  const current = new Date(date)
  const diff = current.getDay() === 0 ? -6 : 1 - current.getDay()
  current.setDate(current.getDate() + diff)
  current.setHours(0, 0, 0, 0)
  return current
}

function statusColor(status: string) {
  if (status === 'completed') return 'border-status-accepted bg-blue-50 text-status-accepted'
  if (status === 'cancelled') return 'border-status-closed bg-slate-50 text-status-closed'
  if (status === 'no_show') return 'border-error bg-red-50 text-error'
  return 'border-status-open bg-emerald-50 text-status-open'
}

function normalizeTime(value?: string) {
  if (!value) return '09:00'
  return value.slice(0, 5)
}

export default function InterviewsPage() {
  const { company } = useEmployer()
  const { t } = useI18n()
  const [view, setView] = useState<'calendar' | 'availability'>('calendar')
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [availability, setAvailability] = useState<AvailabilityRow[]>([])
  const [loading, setLoading] = useState(true)
  const [userNames, setUserNames] = useState<Record<string, string>>({})
  const [jobTitles, setJobTitles] = useState<Record<string, string>>({})

  const [weekOffset, setWeekOffset] = useState(0)
  const [showPicker, setShowPicker] = useState(false)
  const weekStart = useMemo(() => {
    const d = startOfWeek(new Date())
    d.setDate(d.getDate() + weekOffset * 7)
    return d
  }, [weekOffset])
  const days = useMemo(() => Array.from({ length: 5 }, (_, i) => {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + i)
    return {
      key: date.toISOString().slice(0, 10), // YYYY-MM-DD
      dayOfWeek: String(date.getDay()),
      label: SHORT_DAYS[date.getDay()],
      date: String(date.getDate()),
      today: date.toDateString() === new Date().toDateString(),
    }
  }), [weekStart])

  const weekRange = useMemo(() => {
    const end = new Date(weekStart)
    end.setDate(weekStart.getDate() + 4)
    return `${weekStart.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`
  }, [weekStart])

  useEffect(() => {
    if (!company?.id) {
      setInterviews([])
      setAvailability([])
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    Promise.all([
      interviewsApi.listByCompany(company.id),
      companiesApi.getAvailability(company.id),
    ]).then(async ([interviewRes, availabilityRes]) => {
      if (cancelled) return
      const ivs = interviewRes.data.interviews ?? []
      setInterviews(ivs)
      const rows = availabilityRes.data ?? []
      setAvailability(DAY_NAMES.map((day, dayIndex) => {
        const match = rows.find((row) => row.day_of_week === dayIndex)
        return {
          id: match?.id,
          dayIndex,
          day,
          start: normalizeTime(match?.start_time),
          end: normalizeTime(match?.end_time),
          active: Boolean(match?.is_active),
        }
      }))

      // Fetch user names and job titles
      const uniqueUserIds = [...new Set(ivs.map(iv => iv.user_id))]
      const uniqueJobIds = [...new Set(ivs.map(iv => iv.job_id))]
      const [userResults, jobResults] = await Promise.all([
        Promise.allSettled(uniqueUserIds.map(id => usersApi.getById(id).then(r => [id, r.data.name] as const))),
        Promise.allSettled(uniqueJobIds.map(id => jobsApi.getById(id).then(r => [id, r.data.title] as const))),
      ])
      if (!cancelled) {
        const uMap: Record<string, string> = {}
        for (const r of userResults) { if (r.status === 'fulfilled') uMap[r.value[0]] = r.value[1] }
        setUserNames(uMap)
        const jMap: Record<string, string> = {}
        for (const r of jobResults) { if (r.status === 'fulfilled') jMap[r.value[0]] = r.value[1] }
        setJobTitles(jMap)
      }
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })

    return () => { cancelled = true }
  }, [company?.id])

  const appointments = useMemo<Appointment[]>(() => {
    return interviews.map((interview) => {
      const scheduled = new Date(interview.scheduled_at)
      const dateStr = scheduled.toISOString().slice(0, 10)
      const hour = `${String(scheduled.getHours()).padStart(2, '0')}:00`
      return {
        id: interview.id,
        date: dateStr,
        day: String(scheduled.getDay()),
        hour,
        title: jobTitles[interview.job_id] ?? interview.job_id,
        name: userNames[interview.user_id] ?? interview.user_id,
        type: interview.interview_type,
        note: interview.status,
        color: statusColor(interview.status),
      }
    })
  }, [interviews, userNames, jobTitles])

  const toggleAvailability = async (row: AvailabilityRow) => {
    if (!company?.id) return
    if (row.active && row.id) {
      await companiesApi.deleteAvailability(row.id)
    } else {
      await companiesApi.addAvailability({
        company_id: company.id,
        day_of_week: row.dayIndex,
        start_time: row.start,
        end_time: row.end,
      })
    }

    const res = await companiesApi.getAvailability(company.id)
    setAvailability(DAY_NAMES.map((day, dayIndex) => {
      const match = res.data.find((item) => item.day_of_week === dayIndex)
      return {
        id: match?.id,
        dayIndex,
        day,
        start: normalizeTime(match?.start_time),
        end: normalizeTime(match?.end_time),
        active: Boolean(match?.is_active),
      }
    }))
  }

  if (loading) {
    return <div className="rounded-xl border border-border-subtle bg-surface p-6 text-sm text-on-surface-variant">{t('employer.interviews.loading')}</div>
  }

  return (
    <div className="-my-8 space-y-6">
      <div className="flex items-center justify-between rounded-xl border border-border-subtle bg-surface p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold leading-7 text-primary">
            {view === 'calendar' ? t('employer.interviews.schedule') : t('employer.interviews.availability')}
          </h2>
          <div className="flex items-center gap-0.5 rounded-lg border border-border-subtle bg-surface-container-low p-1">
            <button onClick={() => setView('calendar')} className={`rounded px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.05em] transition-colors ${view === 'calendar' ? 'bg-surface shadow-sm text-primary border border-border-subtle' : 'text-on-surface-variant hover:bg-surface-container-high'}`}>{t('employer.interviews.calendar')}</button>
            <button onClick={() => setView('availability')} className={`rounded px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.05em] transition-colors ${view === 'availability' ? 'bg-surface shadow-sm text-primary border border-border-subtle' : 'text-on-surface-variant hover:bg-surface-container-high'}`}>{t('employer.interviews.availability')}</button>
          </div>
        </div>
        {view === 'calendar' && (
          <div className="flex items-center gap-3">
            <button onClick={() => setWeekOffset(weekOffset - 1)} className="rounded-lg p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container" title={t('employer.interviews.prevWeek')}>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className="relative">
              <button onClick={() => setShowPicker(!showPicker)} className="min-w-[220px] rounded-lg border border-border-subtle px-3 py-1.5 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container">
                <svg className="mr-2 inline h-4 w-4 text-on-surface-variant" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                {weekRange}
              </button>
              {showPicker && (
                <div className="absolute right-0 top-full z-20 mt-2 w-64 rounded-xl border border-border-subtle bg-surface p-4 shadow-xl">
                  {/* Year selector */}
                  <div className="mb-3 flex items-center justify-between">
                    <button type="button" onClick={() => {
                      const d = new Date(weekStart); d.setFullYear(d.getFullYear() - 1)
                      const today2 = startOfWeek(new Date()); setWeekOffset(Math.round((d.getTime() - today2.getTime()) / (7 * 86400000)))
                    }} className="rounded p-1 text-on-surface-variant hover:bg-surface-container">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <span className="text-sm font-bold text-primary">{weekStart.getFullYear()}</span>
                    <button type="button" onClick={() => {
                      const d = new Date(weekStart); d.setFullYear(d.getFullYear() + 1)
                      const today2 = startOfWeek(new Date()); setWeekOffset(Math.round((d.getTime() - today2.getTime()) / (7 * 86400000)))
                    }} className="rounded p-1 text-on-surface-variant hover:bg-surface-container">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                    </button>
                  </div>
                  {/* Month grid */}
                  <div className="grid grid-cols-3 gap-2">
                    {['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'].map((m, idx) => {
                      const isCurrentMonth = weekStart.getMonth() === idx && weekStart.getFullYear() === new Date().getFullYear()
                      const isSelected = weekStart.getMonth() === idx
                      return (
                        <button key={m} type="button" onClick={() => {
                          const target = new Date(weekStart.getFullYear(), idx, 1)
                          const targetWeekStart = startOfWeek(target)
                          const today2 = startOfWeek(new Date())
                          setWeekOffset(Math.round((targetWeekStart.getTime() - today2.getTime()) / (7 * 86400000)))
                          setShowPicker(false)
                        }} className={`rounded-lg px-2 py-2 text-xs font-semibold transition-colors
                          ${isSelected ? 'bg-primary text-on-primary' : 'text-on-surface hover:bg-primary-container'}
                          ${isCurrentMonth && !isSelected ? 'ring-1 ring-primary' : ''}
                        `}>
                          {m}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
            <button onClick={() => setWeekOffset(weekOffset + 1)} className="rounded-lg p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container" title={t('employer.interviews.nextWeek')}>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
            {weekOffset !== 0 && (
              <button onClick={() => setWeekOffset(0)} className="rounded-lg border border-border-subtle px-3 py-1 text-xs font-semibold text-on-surface-variant transition-colors hover:bg-surface-container">
                {t('employer.interviews.today')}
              </button>
            )}
          </div>
        )}
      </div>

      {view === 'calendar' ? (
        <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-sm">
          <div className="flex flex-1 flex-col min-h-[600px] overflow-y-auto">
            <div className="grid gap-px bg-border-subtle" style={{ gridTemplateColumns: '60px repeat(5, 1fr)', gridTemplateRows: 'auto repeat(8, minmax(60px, auto))' }}>
              <div className="border-r border-border-subtle bg-background" />
              {days.map((d) => (
                <div key={d.key} className={`py-3 text-center border-b border-border-subtle bg-background ${d.today ? 'bg-primary-fixed border-b-2 border-primary' : ''}`}>
                  <span className={`block text-xs font-semibold uppercase tracking-[0.05em] ${d.today ? 'text-primary' : 'text-on-surface-variant'}`}>{d.label}</span>
                  <span className="mt-1 block text-xl font-semibold leading-7 text-primary">{d.date}</span>
                </div>
              ))}

              {HOURS.map((hour) => {
                const isBreak = hour === '12:00'
                const cells = days.map((d) => {
                  const match = appointments.find((a) => a.date === d.key && a.hour === hour)
                  if (isBreak) return <div key={d.key} className="flex items-center justify-center bg-surface-container-low"><span className="text-[11px] font-bold leading-[14px] text-on-surface-variant opacity-50">{t('employer.interviews.break')}</span></div>
                  return (
                    <div key={d.key} className="relative bg-background">
                      {match && (
                        <div className={`absolute inset-x-1 top-1 bottom-1 rounded border-l-4 p-2 shadow-sm flex flex-col justify-between overflow-hidden cursor-pointer hover:shadow-md transition-shadow ${match.color}`}>
                          <div>
                            <p className="truncate text-sm font-semibold leading-5">{match.title}</p>
                            <p className="truncate text-[13px] leading-[18px] text-on-surface-variant">{match.name}</p>
                          </div>
                          <div className="mt-1 flex items-center gap-1 text-on-surface-variant"><span className="text-[11px] font-bold leading-[14px]">{match.note}</span></div>
                        </div>
                      )}
                    </div>
                  )
                })
                return (
                  <Fragment key={`row-${hour}`}>
                    <div className="border-r border-border-subtle bg-background pr-2 pt-2 text-right"><span className="text-[11px] font-bold leading-[14px] text-on-surface-variant">{hour}</span></div>
                    {cells}
                  </Fragment>
                )
              })}
            </div>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm leading-5 text-on-surface-variant">{t('employer.interviews.availabilityDesc')}</p>
          <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-sm">
            <div className="border-b border-border-subtle bg-surface-container-lowest px-6 py-4"><h3 className="text-base font-semibold leading-6 text-primary">{t('employer.interviews.weeklyHours')}</h3></div>
            <div>
              {availability.map((item, idx) => (
                <div key={item.day} className={`flex items-center justify-between border-b border-border-subtle p-6 transition-colors hover:bg-surface-container-low ${idx === availability.length - 1 ? 'border-b-0' : ''} ${!item.active ? 'bg-surface-container-low opacity-75' : ''}`}>
                  <div className="flex w-1/3 items-center gap-4">
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input type="checkbox" className="peer sr-only" checked={item.active} onChange={() => toggleAvailability(item)} />
                      <div className="h-6 w-11 rounded-full bg-surface-variant after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-all peer-checked:bg-primary-container peer-checked:after:translate-x-full" />
                    </label>
                    <span className={`w-20 text-sm font-semibold leading-5 ${item.active ? 'text-on-surface' : 'text-on-surface-variant'}`}>{item.day}</span>
                  </div>
                  <div className="flex w-2/3 items-center justify-end gap-4">
                    {item.active ? (
                      <div className="flex items-center gap-2">
                        <input type="time" value={item.start} readOnly className="rounded-lg border border-border-subtle bg-surface-container-lowest px-3 py-2 text-sm leading-5 text-on-surface outline-none" />
                        <span className="text-on-surface-variant">-</span>
                        <input type="time" value={item.end} readOnly className="rounded-lg border border-border-subtle bg-surface-container-lowest px-3 py-2 text-sm leading-5 text-on-surface outline-none" />
                      </div>
                    ) : <span className="text-sm italic leading-5 text-status-closed">{t('employer.interviews.unavailable')}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
