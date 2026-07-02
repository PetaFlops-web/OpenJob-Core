import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '')

export function resolveLogoUrl(value: string | null | undefined): string | null {
  if (!value) {
    if (typeof window !== 'undefined') console.log('[OpenJob logo] empty logo_url:', value)
    return null
  }

  // Strip 'src/' prefix — backend sometimes stores relative filesystem paths
  let clean = value.replace(/^src\//, '')
  if (!clean.startsWith('/')) clean = '/' + clean

  const isFilePath = clean.includes('/uploads/') || /\.\w{2,5}$/.test(clean.split('?')[0])
  if (!clean.startsWith('blob:') && !clean.startsWith('data:') && !clean.startsWith('http://') && !clean.startsWith('https://') && !isFilePath) {
    if (typeof window !== 'undefined') console.warn('[OpenJob logo] rejected non-file logo_url:', value)
    return null
  }

  const resolved = clean.startsWith('blob:') || clean.startsWith('data:') || clean.startsWith('http://') || clean.startsWith('https://')
    ? clean
    : `${API_ORIGIN}${clean}`

  if (typeof window !== 'undefined') {
    console.log('[OpenJob logo] resolveLogoUrl', {
      raw: value,
      resolved,
      apiOrigin: API_ORIGIN,
    })
  }

  return resolved
}

export function resolveDocUrl(value: string | null | undefined): string | null {
  if (!value) return null
  if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('blob:') || value.startsWith('data:')) return value
  const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '')
  return `${API_ORIGIN}${value.startsWith('/') ? '' : '/'}${value}`
}

/** Parse a value that may be a JSON string array (from backend) or an actual array. */
export function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string')
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : []
    } catch {
      return []
    }
  }
  return []
}

export const buttonVariants = {
  primary: 'bg-oj-primary text-white hover:bg-oj-primary-dark oj-shadow',
  secondary: 'border border-oj-border bg-white text-oj-text hover:bg-oj-bg oj-shadow',
  outline: 'border border-oj-border bg-white text-oj-text hover:bg-oj-bg',
  ghost: 'text-oj-text hover:bg-oj-bg active:scale-[0.98]',
  danger: 'bg-oj-error text-white hover:bg-red-600 oj-shadow',
  success: 'bg-oj-success text-white hover:bg-emerald-600 oj-shadow',
} as const

export const badgeVariants = {
  default: 'bg-oj-bg text-oj-text',
  primary: 'bg-oj-primary/10 text-oj-primary',
  success: 'bg-oj-success/10 text-oj-success',
  warning: 'bg-oj-warning/10 text-oj-warning',
  danger: 'bg-oj-error/10 text-oj-error',
  purple: 'bg-purple-100 text-purple-800',
} as const

export function cn2(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ')
}
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | null, currency: string = 'IDR'): string {
  if (amount == null) return '-'
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—'
  const d = new Date(date)
  if (isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(d)
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—'
  const d = new Date(date)
  if (isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function timeAgo(date: string | Date | null | undefined): string {
  if (!date) return '—'
  const then = new Date(date)
  if (isNaN(then.getTime())) return '—'
  const now = new Date()
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000)

  if (seconds < 60) return 'baru saja'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} menit yang lalu`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} jam yang lalu`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} hari yang lalu`
  return formatDate(date)
}

export const jobTypeLabels: Record<string, string> = {
  'full-time': 'Full-time',
  'part-time': 'Part-time',
  'contract': 'Contract',
  'internship': 'Internship',
  'freelance': 'Freelance',
}

export const experienceLevelLabels: Record<string, string> = {
  'entry': 'Entry Level',
  'mid': 'Mid Level',
  'senior': 'Senior Level',
  'lead': 'Lead',
  'manager': 'Manager',
}

export const locationTypeLabels: Record<string, string> = {
  'remote': 'Remote',
  'on-site': 'On-site',
  'onsite': 'On-site',
  'hybrid': 'Hybrid',
}

export const applicationStatusConfig: Record<string, { label: string; color: keyof typeof badgeVariants }> = {
  pending: { label: 'Menunggu', color: 'warning' },
  under_review: { label: 'Ditinjau', color: 'primary' },
  interview: { label: 'Interview', color: 'purple' },
  accepted: { label: 'Diterima', color: 'success' },
  rejected: { label: 'Ditolak', color: 'danger' },
}
