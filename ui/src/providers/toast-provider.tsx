'use client'

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { Toast, type ToastVariant } from '@/components/ui/toast'
import { setApiErrorListener } from '@/lib/api-client'

interface ToastItem {
  id: string
  message: string
  variant: ToastVariant
}

interface ToastContextValue {
  toasts: ToastItem[]
  toast: (message: string, variant?: ToastVariant) => void
  success: (message: string) => void
  error: (message: string) => void
  warning: (message: string) => void
  info: (message: string) => void
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let counter = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])
  const push = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = `toast-${Date.now()}-${++counter}`
    setToasts((prev) => [...prev.slice(-4), { id, message, variant }])
  }, [])

  useEffect(() => {
    setApiErrorListener((msg) => push(msg, 'error'))
    return () => setApiErrorListener(null)
  }, [push])

  const success = useCallback((message: string) => push(message, 'success'), [push])
  const error = useCallback((message: string) => push(message, 'error'), [push])
  const warning = useCallback((message: string) => push(message, 'warning'), [push])
  const info = useCallback((message: string) => push(message, 'info'), [push])

  return (
    <ToastContext.Provider value={{ toasts, toast: push, success, error, warning, info, dismiss }}>
      {children}
      <div className="fixed right-4 top-4 z-[100] flex max-w-sm flex-col gap-2" aria-live="polite">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            message={toast.message}
            variant={toast.variant}
            onClose={() => dismiss(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
