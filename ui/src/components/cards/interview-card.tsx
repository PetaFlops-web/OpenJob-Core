import { Video, Phone, MapPin, Calendar, Clock, X, ArrowUpDown, ExternalLink, FileText } from 'lucide-react'
import type { Interview } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn, formatDateTime } from '@/lib/utils'

export interface InterviewCardProps {
  interview: Interview
  onJoin?: () => void
  onReschedule?: () => void
  onCancel?: () => void
  onViewNotes?: () => void
  onClick?: () => void
  className?: string
}

const interviewTypeIcons: Record<string, React.ReactNode> = {
  'video': <Video className="h-5 w-5" />,
  'phone': <Phone className="h-5 w-5" />,
  'in-person': <MapPin className="h-5 w-5" />,
}

const interviewLabels: Record<string, string> = {
  'video': 'Video Call',
  'phone': 'Telepon',
  'in-person': 'Tatap Muka',
}

const interviewStatusConfig: Record<string, { label: string; color: string }> = {
  'scheduled': { label: 'Terjadwal', color: 'primary' },
  'completed': { label: 'Selesai', color: 'success' },
  'cancelled': { label: 'Dibatalkan', color: 'danger' },
  'no-show': { label: 'Tidak Hadir', color: 'warning' },
}
export function InterviewCard({ interview, onJoin, onReschedule, onCancel, onViewNotes, onClick, className }: InterviewCardProps) {
  const statusInfo = interviewStatusConfig[interview.status] ?? { label: interview.status, color: 'default' }
  const typeIcon = interviewTypeIcons[interview.interview_type] ?? <Calendar className="h-5 w-5" />

  const isScheduled = interview.status === 'scheduled'

  return (
    <div
      className={cn(
        'flex w-full flex-col gap-4 rounded-xl border border-oj-border bg-white p-5 oj-shadow transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] sm:items-start',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } } : undefined}
    >
      {/* Left: icon + details */}
      <div className="flex w-full items-start gap-4">
        <div className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg oj-shadow',
          interview.interview_type === 'video' && 'bg-oj-primary text-white',
          interview.interview_type === 'phone' && 'bg-oj-accent text-white',
          interview.interview_type === 'in-person' && 'bg-oj-success text-white',
        )}>
          {typeIcon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusInfo.color as 'primary' | 'success' | 'danger' | 'warning' | 'default'}>
              {statusInfo.label}
            </Badge>
            <span className="text-xs text-oj-text-secondary">
              {interviewLabels[interview.interview_type] ?? interview.interview_type}
            </span>
          </div>

          <h3 className="mt-1.5 text-sm font-medium text-oj-text truncate">
            {interview.job?.title ?? 'Lowongan'}
          </h3>
          <p className="truncate text-sm text-oj-text-secondary">
            {interview.company?.name ?? 'Perusahaan'}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-oj-text-secondary">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4 text-oj-text-secondary" />
              {formatDateTime(interview.scheduled_at)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-oj-text-secondary" />
              {interview.duration_minutes} menit
            </span>
          </div>

          {interview.meeting_platform && (
            <p className="mt-1 text-xs text-oj-text-secondary/80">Platform: {interview.meeting_platform}</p>
          )}
          {interview.location && interview.interview_type === 'in-person' && (
            <p className="mt-1 text-xs text-oj-text-secondary/80 flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {interview.location}
            </p>
          )}
        </div>
      </div>

      {/* Right: action buttons */}
      {(isScheduled || interview.status === 'completed') && (
        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto md:items-stretch lg:items-end">
          {isScheduled && interview.meeting_link && onJoin && (
            <Button variant="primary" size="sm" onClick={onJoin} className="w-full gap-1.5 sm:w-auto">
              <ExternalLink className="h-4 w-4" />
              Join Meeting
            </Button>
          )}
          {isScheduled && onReschedule && (
            <Button variant="outline" size="sm" onClick={onReschedule} className="w-full gap-1.5 sm:w-auto">
              <ArrowUpDown className="h-4 w-4" />
              Reschedule
            </Button>
          )}
          {isScheduled && onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel} className="w-full gap-1.5 text-oj-error hover:bg-oj-bg sm:w-auto">
              <X className="h-4 w-4" />
              Cancel
            </Button>
          )}
          {interview.status === 'completed' && onViewNotes && (
            <Button variant="outline" size="sm" onClick={onViewNotes} className="w-full gap-1.5 sm:w-auto">
              <FileText className="h-4 w-4" />
              Lihat Catatan
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
