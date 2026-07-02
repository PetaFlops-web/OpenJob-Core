import { cn } from '@/lib/utils'
import { Button } from './button'

export interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 rounded-xl border border-oj-border bg-white px-6 py-12 text-center',
        className
      )}
    >
      {/* Illustration area */}
      {icon && (
        <div className="flex h-16 w-16 items-center justify-center rounded-full rounded-lg border border-oj-border bg-white text-oj-text">
          {icon}
        </div>
      )}

      {/* Text */}
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-oj-text">{title}</h3>
        {description && (
          <p className="max-w-sm text-sm text-oj-text-secondary">{description}</p>
        )}
      </div>

      {/* Optional CTA */}
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="primary">
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
