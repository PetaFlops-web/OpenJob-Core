import { Briefcase, Calendar, Bell, MessageSquare } from 'lucide-react'
import type { Notification } from '@/types'
import { cn, timeAgo } from '@/lib/utils'

export interface NotificationItemProps {
  notification: Notification
  onMarkRead?: (id: string) => void
  className?: string
}

const notificationIconMap: Record<string, React.ReactNode> = {
  'application': <Briefcase className="h-5 w-5" />,
  'interview': <Calendar className="h-5 w-5" />,
  'system': <Bell className="h-5 w-5" />,
  'message': <MessageSquare className="h-5 w-5" />,
}

const notificationColorMap: Record<string, string> = {
  'application': 'bg-primary-fixed text-primary',
  'interview': 'bg-secondary-fixed text-secondary',
  'system': 'bg-surface-variant text-on-surface-variant border border-border-slate',
  'message': 'bg-secondary-fixed text-secondary',
}

export function NotificationItem({ notification, onMarkRead, className }: NotificationItemProps) {
  const icon = notificationIconMap[notification.type] ?? <Bell className="h-5 w-5" />
  const iconColor = notificationColorMap[notification.type] ?? 'bg-white text-oj-text'

  const handleClick = () => {
    if (!notification.is_read && onMarkRead) {
      onMarkRead(notification.id)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'flex w-full items-start gap-4 rounded-lg border border-border-slate bg-bg-surface px-5 py-4 text-left transition-all hover:bg-surface-container-low hover:shadow-sm active:scale-[0.98]',
        !notification.is_read && 'bg-surface-container-low ring-1 ring-primary/20',
        className
      )}
    >
      {/* Icon */}
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full oj-shadow', iconColor)}>
        {icon}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h4 className={cn(
            'text-sm font-medium text-oj-text',
            !notification.is_read && 'font-semibold'
          )}>
            {notification.title}
          </h4>
          {!notification.is_read && (
            <span className="shrink-0 mt-1 h-2 w-2 rounded-full bg-oj-primary" />
          )}
        </div>
        <p className="mt-0.5 text-sm text-oj-text-secondary line-clamp-2">
          {notification.message}
        </p>
        <span className="mt-1 block text-xs text-oj-text-secondary/80">
          {timeAgo(notification.created_at ?? '')}
        </span>
      </div>
    </button>
  )
}
