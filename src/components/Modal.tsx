import React, { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  fullScreen?: boolean
}

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function Modal({ isOpen, onClose, title, children, fullScreen = false }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

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

  // Focus : mémorise l'élément actif, place le focus dans la modale,
  // le restaure à la fermeture (lecteurs d'écran + navigation clavier).
  useEffect(() => {
    if (!isOpen) return
    previouslyFocused.current = document.activeElement as HTMLElement | null
    panelRef.current?.focus()
    return () => {
      previouslyFocused.current?.focus?.()
    }
  }, [isOpen])

  // Clavier : Esc ferme, Tab reste piégé dans la modale.
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab' || !panelRef.current) return
      const focusables = panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement
      if (e.shiftKey && (active === first || active === panelRef.current)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
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
        ref={panelRef}
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
        className={
          fullScreen
            ? 'w-full h-full bg-bg flex flex-col outline-none'
            : 'w-full max-w-[480px] max-h-[90vh] bg-bg rounded-t-2xl sm:rounded-2xl border border-border flex flex-col shadow-2xl animate-fade-in-up outline-none'
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
