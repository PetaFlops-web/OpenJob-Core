'use client'

import { usePathname } from 'next/navigation'

type NestedKeyOf<T> = T extends object
  ? { [K in keyof T]: K extends string ? T[K] extends object ? `${K}.${NestedKeyOf<T[K]>}` : K : never }[keyof T]
  : never

// Simple dot-path getter
function get(obj: unknown, path: string): string {
  const keys = path.split('.')
  let current: unknown = obj
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key]
    } else {
      return path // fallback: return the key itself
    }
  }
  return typeof current === 'string' ? current : path
}

// Cache messages per locale
const cache: Record<string, Record<string, unknown>> = {}

function loadMessages(locale: string): Record<string, unknown> {
  if (cache[locale]) return cache[locale]
  // Sync require for client components
  try {
    if (locale === 'en') {
      cache[locale] = require('@/i18n/locales/en.json')
    } else {
      cache[locale] = require('@/i18n/locales/id.json')
    }
  } catch {
    cache[locale] = require('@/i18n/locales/id.json')
  }
  return cache[locale]
}

export function useI18n() {
  // Default to 'id' since the app is Indonesian-first
  const locale = 'id'
  const messages = loadMessages(locale)

  function t(key: string, params?: Record<string, string | number>): string {
    let value = get(messages, key)
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        value = value.replace(`{${k}}`, String(v))
      }
    }
    return value
  }

  return { t, locale }
}
