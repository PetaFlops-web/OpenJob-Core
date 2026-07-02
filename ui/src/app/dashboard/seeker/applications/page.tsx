"use client"

import { useState, useEffect, useCallback } from 'react'
import {
  Check,
  Clock,
  FileText,
  Search,
  Building2,
  MapPin,
  X,
  AlertTriangle,
} from 'lucide-react'
import { applicationsApi } from '@/lib/api'
import { useToast } from '@/providers/toast-provider'
import { ApplicationCard } from '@/components/cards'
import { ApplicationCardSkeleton, EmptyState, Button, Badge } from '@/components/ui'
import { cn, applicationStatusConfig } from '@/lib/utils'
import type { Application } from '@/types'

// ── Status filter tabs ────────────────────────────────────────────────────

const FILTERS = [
  { key: 'all', label: 'Semua' },
  { key: 'pending', label: 'Menunggu' },
  { key: 'under_review', label: 'Ditinjau' },
  { key: 'interview', label: 'Interview' },
  { key: 'accepted', label: 'Diterima' },
  { key: 'rejected', label: 'Ditolak' },
] as const

// ── Application timeline stages ───────────────────────────────────────────

const TIMELINE_STAGES: { key: string; label: string; icon: React.ReactNode }[] = [
  { key: 'applied', label: 'Dilamar', icon: <FileText className="h-4 w-4" /> },
  { key: 'under_review', label: 'Ditinjau', icon: <Search className="h-4 w-4" /> },
  { key: 'interview', label: 'Interview', icon: <Building2 className="h-4 w-4" /> },
  { key: 'decision', label: 'Keputusan', icon: <Check className="h-4 w-4" /> },
]

function getCompletedStages(status: Application['status']): string[] {
  switch (status) {
    case 'pending':
      return ['applied']
    case 'under_review':
      return ['applied', 'under_review']
    case 'interview':
      return ['applied', 'under_review', 'interview']
    case 'accepted':
    case 'rejected':
      return ['applied', 'under_review', 'interview', 'decision']
    default:
      return []
  }
}

// ── Detail Modal ──────────────────────────────────────────────────────────

function ApplicationDetailModal({
  application,
  onClose,
  onWithdraw,
  withdrawing,
}: {
  application: Application
  onClose: () => void
  onWithdraw: () => void
  withdrawing: boolean
}) {
  const completed = getCompletedStages(application.status)
  const statusInfo = applicationStatusConfig[application.status] ?? {
    label: application.status,
    color: 'default',
  }
  const canWithdraw =
    application.status === 'pending' || application.status === 'under_review'

  const job = application.job

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 flex items-start justify-between border-b border-gray-100 bg-white px-4 py-4 md:px-6">
          <div className="min-w-0 pr-4">
            <h2 className="truncate text-lg font-semibold text-gray-900">
              {job?.title ?? 'Lowongan'}
            </h2>
            <p className="truncate text-sm text-gray-500">
              {job?.company?.name ?? 'Perusahaan'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Tutup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 px-4 py-5 md:px-6">
          {/* Job Info */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <Building2 className="h-4 w-4 text-gray-400" />
              <span>{job?.company?.name ?? '—'}</span>
            </div>
            {job?.location_city && (
              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span>{job.location_city}</span>
              </div>
            )}
            <Badge
              variant={
                statusInfo.color as
                  | 'warning'
                  | 'primary'
                  | 'purple'
                  | 'success'
                  | 'danger'
                  | 'default'
              }
            >
              {statusInfo.label}
            </Badge>
          </div>

          {/* Timeline Visualization */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-700">
              Status Lamaran
            </h3>
            <div className="pb-2">
              <div className="flex items-start">
                {TIMELINE_STAGES.map((stage, idx) => {
                  const isCompleted = completed.includes(stage.key)
                  const isCurrent =
                    !isCompleted &&
                    (idx === 0 || completed.includes(TIMELINE_STAGES[idx - 1]?.key))
                  const isPending = !isCompleted && !isCurrent
                  const isLast = idx === TIMELINE_STAGES.length - 1

                  return (
                    <div
                      key={stage.key}
                      className="flex flex-1 flex-col items-center gap-1.5 relative"
                    >
                      {/* Connector line */}
                      {!isLast && (
                        <div
                          className="absolute top-4 left-[calc(50%+16px)] h-0.5 w-[calc(100%-32px)]"
                          style={{
                            background: isCompleted
                              ? 'var(--completed-line, #10b981)'
                              : '#e5e7eb',
                          }}
                        />
                      )}

                      {/* Icon circle */}
                      <div
                        className={cn(
                          'relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-medium',
                          isCompleted &&
                            'border-emerald-500 bg-emerald-500 text-white',
                          isCurrent &&
                            'border-blue-500 bg-blue-50 text-blue-600',
                          isPending && 'border-gray-200 bg-white text-gray-300'
                        )}
                      >
                        {isCompleted ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Clock className="h-4 w-4" />
                        )}
                      </div>

                      {/* Label */}
                      <span
                        className={cn(
                          'whitespace-nowrap text-xs font-medium',
                          isCompleted && 'text-emerald-600',
                          isCurrent && 'text-blue-600',
                          isPending && 'text-gray-400'
                        )}
                      >
                        {stage.label}
                      </span>
                      {stage.key === 'applied' && application.created_at && (
                        <span className={cn(
                          'whitespace-nowrap text-[10px]',
                          isCompleted ? 'text-emerald-500' : 'text-gray-400'
                        )}>
                          {new Date(application.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Notes from employer */}
          {'employer_notes' in application && application.employer_notes ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    Catatan dari Pemberi Kerja
                  </p>
                  <p className="mt-1 text-sm text-amber-700">
                    {application.employer_notes as string}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {/* Actions */}
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:items-center sm:justify-end">
            {canWithdraw && (
              <Button
                variant="danger"
                onClick={onWithdraw}
                loading={withdrawing}
                size="sm"
              >
                Tarik Lamaran
              </Button>
            )}
            <Button variant="outline" onClick={onClose} size="sm">
              Tutup
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ApplicationsPage() {
  const toast = useToast()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [withdrawing, setWithdrawing] = useState(false)

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await applicationsApi.list()
      setApplications(response.data?.applications ?? [])
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Gagal memuat data lamaran'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchApplications()
  }, [fetchApplications])

  // Client-side filter
  const filtered =
    activeFilter === 'all'
      ? applications
      : applications.filter((a) => a.status === activeFilter)

  const handleWithdraw = async () => {
    if (!selectedApp) return
    try {
      setWithdrawing(true)
      await applicationsApi.update(selectedApp.id, { status: 'withdrawn' })
      setApplications((prev) => prev.filter((a) => a.id !== selectedApp.id))
      setSelectedApp(null)
      toast.success('Lamaran berhasil ditarik.')
  } catch {
    } finally {
      setWithdrawing(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-6 md:py-8">
      {/* Page Title */}
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Lamaran Saya</h1>

      {/* Filter Tabs */}
      <div className="mb-6 overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <div className="flex min-w-max gap-1 p-1">
          {FILTERS.map((filter) => {
            const isActive = activeFilter === filter.key
            return (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={cn(
                  'shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                {filter.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <ApplicationCardSkeleton count={5} />
      ) : error ? (
        <EmptyState
          icon={<AlertTriangle className="h-8 w-8" />}
          title="Gagal Memuat Data"
          description={error}
          actionLabel="Coba Lagi"
          onAction={fetchApplications}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-8 w-8" />}
          title="Belum ada lamaran"
          description={
            activeFilter === 'all'
              ? 'Kamu belum melamar lowongan apapun. Mulai jelajahi lowongan dan kirim lamaran pertamamu!'
              : `Tidak ada lamaran dengan status "${FILTERS.find((f) => f.key === activeFilter)?.label}".`
          }
          actionLabel="Jelajahi Lowongan"
          onAction={() => (window.location.href = '/jobs')}
        />
      ) : (
        <div className="flex w-full flex-col gap-3">
          {filtered.map((app) => (
            <ApplicationCard
              key={app.id}
              application={app}
              onDetailClick={() => setSelectedApp(app)}
            />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedApp && (
        <ApplicationDetailModal
          application={selectedApp}
          onClose={() => setSelectedApp(null)}
          onWithdraw={handleWithdraw}
          withdrawing={withdrawing}
        />
      )}
    </div>
  )
}
