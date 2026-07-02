import { ApiResponse } from '@/types'

// Global error listener — set by toast provider
let _onApiError: ((msg: string) => void) | null = null
export function setApiErrorListener(fn: ((msg: string) => void) | null) { _onApiError = fn }


function normalizeBackendUrl(value: string) {
  return value.replace(/\/$/, '')
}

function getApiUrl(path: string) {
  // If path already has /api/v1 prefix, use it as-is (for Flask ATS service)
  if (path.startsWith('/api/')) {
    if (typeof window !== 'undefined') {
      const backendUrl = normalizeBackendUrl(
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      )
      return `${backendUrl}${path}`
    }
    return path
  }

  if (typeof window !== 'undefined') {
    const backendUrl = normalizeBackendUrl(
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    )
    return `${backendUrl}${path}`
  }

  const backendUrl = normalizeBackendUrl(
    process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
  )
  return `${backendUrl}${path}`
}

function getRetryDelay(response: Response, attempt: number) {
  const retryAfter = response.headers.get('retry-after')
  if (retryAfter) {
    const retryAfterSeconds = Number(retryAfter)
    if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
      return Math.min(retryAfterSeconds * 1000, 5000)
    }
  }

  return 500 * (attempt + 1)
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function getCookie(name: string) {
  if (typeof document === 'undefined') return null

  const prefix = `${name}=`
  const cookie = document.cookie.split('; ').find((part) => part.startsWith(prefix))
  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : null
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = getApiUrl(path)

  const isFormData = options.body instanceof FormData

  const headers: Record<string, string> = {
    'Accept-Language': 'id',
    ...options.headers as Record<string, string>,
  }

  if (!isFormData) {
    headers['Content-Type'] = 'application/json'
  }

  // Add auth token if available (client-side only)
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken') || getCookie('accessToken')
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  }

  let response = await fetch(url, { ...options, headers })

  if (response.status === 429 && (!options.method || options.method === 'GET')) {
    for (let attempt = 0; attempt < 2 && response.status === 429; attempt += 1) {
      await wait(getRetryDelay(response, attempt))
      response = await fetch(url, { ...options, headers })
    }
  }

  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      document.cookie = 'accessToken=; path=/; max-age=0'
      document.cookie = 'userRole=; path=/; max-age=0'
    }
    const error = await response.json().catch(() => ({ message: 'Terjadi kesalahan' }))
    const raw = error.message
    const msg = Array.isArray(raw) ? raw[0] : (raw || `HTTP ${response.status}`)
    if (_onApiError && response.status !== 401 && response.status !== 404) _onApiError(msg)
    throw new Error(msg)
  }

  return response.json()
}

export const api = {
  get: <T>(path: string, params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return request<T>(`${path}${qs}`)
  },
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  delete: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'DELETE',
      ...(body ? { body: body instanceof FormData ? body : JSON.stringify(body) } : {}),
    }),
  request: <T>(path: string, options: RequestInit = {}) =>
    request<T>(path, options),
}

