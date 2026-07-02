'use client'

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { io, type Socket } from 'socket.io-client'
import { useAuth } from '@/providers/auth-provider'

interface SocketContextValue {
  socket: Socket | null
  isConnected: boolean
}

const SocketContext = createContext<SocketContextValue>({ socket: null, isConnected: false })

export function SocketProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [isConnected, setIsConnected] = useState(false)
  const [socket, setSocket] = useState<Socket | null>(null)

  const getToken = useCallback(() => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('accessToken') || document.cookie.split('; ').find((cookie) => cookie.startsWith('accessToken='))?.split('=')[1] || null
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      setSocket((current) => {
        current?.disconnect()
        return null
      })
      setIsConnected(false)
      return
    }

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001'
    const token = getToken()
    if (!token) return

    const socket = io(wsUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: 10,
    })

    socket.on('connect', () => setIsConnected(true))
    socket.on('disconnect', () => setIsConnected(false))
    socket.on('connect_error', () => setIsConnected(false))

    setSocket(socket)

    return () => {
      socket.disconnect()
      setSocket(null)
      setIsConnected(false)
    }
  }, [isAuthenticated, getToken])

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  return useContext(SocketContext)
}
