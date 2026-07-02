import { useEffect, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'

export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

export interface ToastProps {
  id?: string
  message: string
  variant?: ToastVariant
  duration?: number
  onClose?: () => void
  className?: string
}

const VARIANT_STYLES: Record<ToastVariant, { bg: string; border: string; icon: React.ReactNode; iconBg: string }> = {
  success: {
    bg: 'border border-oj-success/40 bg-white',
    border: '',
    iconBg: 'bg-oj-success text-white',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  error: {
    bg: 'border border-oj-error/40 bg-white',
    border: '',
    iconBg: 'bg-oj-error text-white',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  },
  warning: {
    bg: 'border border-oj-warning/40 bg-white',
    border: '',
    iconBg: 'bg-oj-warning text-white',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M12 3l9.5 16.5H2.5L12 3z" />
      </svg>
    ),
  },
  info: {
    bg: 'border border-oj-primary/40 bg-white',
    border: '',
    iconBg: 'bg-oj-primary text-white',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
      </svg>
    ),
  },
}

const DEFAULT_DURATION = 4000

export function Toast({
  message,
  variant = 'info',
  duration = DEFAULT_DURATION,
  onClose,
  className,
}: ToastProps) {
  const [remaining, setRemaining] = useState(duration)
  const [paused, setPaused] = useState(false)

  const style = VARIANT_STYLES[variant]

  const handleClose = useCallback(() => {
    onClose?.()
  }, [onClose])

  // Auto-dismiss when countdown reaches 0
  useEffect(() => {
    if (remaining > 0) return
    onClose?.()
  }, [remaining, onClose])

  // Countdown timer
  useEffect(() => {
    if (paused || remaining <= 0) return

    const timer = setInterval(() => {
      setRemaining((prev) => Math.max(prev - 50, 0))
    }, 50)

    return () => clearInterval(timer)
  }, [paused, remaining])

  const progress = duration > 0 ? (remaining / duration) * 100 : 0

  return (
    <div
      role="alert"
      className={cn(
        'group relative flex w-80 items-start gap-3 overflow-hidden rounded-xl border bg-white p-4 shadow-lg transition-all',
        style.bg,
        style.border,
        className
      )}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Icon */}
      <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm', style.iconBg)}>
        {style.icon}
      </div>

      {/* Message */}
      <div className="flex-1 pt-0.5">
        <p className="text-sm font-semibold text-oj-text">{message}</p>
      </div>

      {/* Close button */}
      <button
        type="button"
        onClick={handleClose}
        className="shrink-0 rounded-full p-1 text-oj-text-secondary transition-all hover:bg-oj-bg hover:text-oj-text active:scale-[0.98]"
        aria-label="Close notification"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Progress bar */}
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 overflow-hidden bg-oj-bg">
          <div
            className={cn('h-full transition-[width] duration-50 ease-linear', {
              'bg-oj-success': variant === 'success',
              'bg-oj-error': variant === 'error',
              'bg-oj-warning': variant === 'warning',
              'bg-oj-primary': variant === 'info',
            })}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  )
}
