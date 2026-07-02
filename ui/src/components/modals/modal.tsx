'use client'

import { useEffect, type ReactNode, type MouseEvent } from 'react'
import { useModalAnimation } from '@/hooks/use-modal-animation'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  maxWidth?: string
}

export function Modal({ open, onClose, title, children, maxWidth = 'max-w-2xl' }: ModalProps) {
  const { mounted, visible, handleClose } = useModalAnimation({ open, onClose })

  useEffect(() => {
    if (!open) return
    function onKeydown(e: globalThis.KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeydown)
    return () => document.removeEventListener('keydown', onKeydown)
  }, [open, onClose])

  if (!mounted) return null

  function onBackdrop(e: MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-8 sm:pt-16 transition-all duration-200 ${visible ? 'bg-black/50' : 'bg-black/0'}`}
      onClick={onBackdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className={`relative w-full ${maxWidth} rounded-xl border border-oj-border bg-white shadow-xl p-0 transition-all duration-200 ease-out ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-[0.97]'}`}>
        <div className="flex items-center justify-between border-b border-oj-border px-6 py-4">
          <h2 id="modal-title" className="text-lg font-semibold text-oj-text">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-oj-text-secondary hover:bg-oj-bg transition-all active:scale-[0.98] hover:text-gray-600"
            aria-label="Tutup"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto px-6 py-4">{children}</div>
      </div>
    </div>
  )
}
