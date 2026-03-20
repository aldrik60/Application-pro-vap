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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in-up">
      <div 
        className={
          fullScreen 
            ? "w-full h-full bg-[#28282D] flex flex-col" 
            : "w-full max-w-[480px] max-h-[90vh] bg-[#28282D] rounded-t-2xl sm:rounded-2xl border border-[#2E2E32] flex flex-col shadow-2xl"
        }
      >
        <div className="flex items-center justify-between p-4 border-b border-[#2E2E32]">
          {title ? (
            <h2 className="font-display text-2xl text-[#CB8002] mb-0 leading-none">{title}</h2>
          ) : (
            <div />
          )}
          <button 
            onClick={onClose}
            className="p-2 bg-[#1E1E22] rounded-full text-[#F1F1F1] hover:bg-[#2E2E32] transition-colors"
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
