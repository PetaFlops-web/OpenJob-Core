'use client'

import enMessages from '@/i18n/locales/en.json'
import idMessages from '@/i18n/locales/id.json'


function get(obj: unknown, path: string): string {
  const keys = path.split('.')
  let current: unknown = obj
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key]
    } else {
      return path
    }
  }
  return typeof current === 'string' ? current : path
}

function loadMessages(locale: string): Record<string, unknown> {
  return locale === 'en'
    ? (enMessages as Record<string, unknown>)
    : (idMessages as Record<string, unknown>)
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
