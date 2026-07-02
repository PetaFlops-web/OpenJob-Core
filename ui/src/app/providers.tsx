'use client'

import type { ReactNode } from 'react'
import { AuthProvider } from '@/providers/auth-provider'
import { SocketProvider } from '@/providers/socket-provider'
import { ToastProvider } from '@/providers/toast-provider'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <SocketProvider>{children}</SocketProvider>
      </ToastProvider>
    </AuthProvider>
  )
}
