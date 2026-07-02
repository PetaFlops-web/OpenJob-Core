import { cn, badgeVariants } from '@/lib/utils'

export interface BadgeProps {
  children: React.ReactNode
  variant?: keyof typeof badgeVariants
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn('inline-flex min-h-6 items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.05em] shadow-sm transition-all', badgeVariants[variant], className)}>
      {children}
    </span>
  )
}
