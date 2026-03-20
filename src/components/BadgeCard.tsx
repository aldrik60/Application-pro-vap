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
          ? 'border-[#CB8002] bg-[rgba(203,128,2,0.05)]' 
          : 'opacity-40 grayscale border-[#2E2E32]'
      }`}
    >
      {unlocked && (
        <div className="absolute top-2 right-2 bg-[#CB8002] rounded-full p-0.5">
          <Check size={12} color="#1E1E22" strokeWidth={4} />
        </div>
      )}
      <span className="text-4xl mb-2">{badge.icon}</span>
      <span className="text-[10px] font-bold uppercase leading-tight text-[#F1F1F1]">
        {badge.title}
      </span>
      <span className="text-[9px] text-[#686868] mt-1">
        J+{badge.day_threshold}
      </span>
    </div>
  )
}
