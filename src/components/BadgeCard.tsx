import React from 'react'
import { Badge } from '../types'
import { Check } from 'lucide-react'

interface BadgeCardProps {
  badge: Badge
  unlocked: boolean
}

export function BadgeCard({ badge, unlocked }: BadgeCardProps) {
  return (
    <div
      className={`card flex flex-col items-center justify-center p-3 aspect-square relative text-center transition-all ${
        unlocked
          ? 'border-secondary bg-secondary/5'
          : 'opacity-40 grayscale border-border'
      }`}
    >
      {unlocked && (
        <div className="absolute top-2 right-2 bg-secondary rounded-full p-0.5">
          <Check size={12} className="text-surface" strokeWidth={4} />
        </div>
      )}
      <span className="text-4xl mb-2">{badge.icon}</span>
      <span className="text-[10px] font-bold uppercase leading-tight text-text">
        {badge.title}
      </span>
      <span className="text-[9px] text-text-muted mt-1">
        J+{badge.day_threshold}
      </span>
    </div>
  )
}
