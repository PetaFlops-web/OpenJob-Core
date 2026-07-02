'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface UseModalAnimationOptions {
  open?: boolean
  onClose?: () => void
}

export function useModalAnimation({ open = true, onClose }: UseModalAnimationOptions = {}) {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const closingRef = useRef(false)

  useEffect(() => {
    if (open) {
      setMounted(true)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true))
      })
      closingRef.current = false
    } else if (mounted && !closingRef.current) {
      closingRef.current = true
      setVisible(false)
      const timer = setTimeout(() => {
        setMounted(false)
        closingRef.current = false
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [open, mounted])

  const handleClose = useCallback(() => {
    setVisible(false)
    if (onClose) setTimeout(onClose, 200)
  }, [onClose])

  return { mounted, visible, handleClose }
}
