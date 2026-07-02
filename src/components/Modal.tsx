import React, { useEffect } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  fullScreen?: boolean
}

export function Modal({ isOpen, onClose, title, children, fullScreen = false }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [isOpen])

  // Fermeture clavier (Esc) — accessibilité standard
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Boîte de dialogue'}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className={
          fullScreen
            ? 'w-full h-full bg-bg flex flex-col'
            : 'w-full max-w-[480px] max-h-[90vh] bg-bg rounded-t-2xl sm:rounded-2xl border border-border flex flex-col shadow-2xl animate-fade-in-up'
        }
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          {title ? (
            <h2 className="font-display text-2xl text-secondary mb-0 leading-none">{title}</h2>
          ) : (
            <div />
          )}
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="p-3 bg-surface rounded-full text-text hover:bg-border transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 overscroll-none">
          {children}
        </div>
      </div>
    </div>
  )
}
