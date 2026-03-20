import React from 'react'

interface StatCardProps {
  label: string
  value: string | number
  unit?: string
  icon?: React.ReactNode
  textColorClass?: string
}

export function StatCard({ label, value, unit, icon, textColorClass = 'text-[#F1F1F1]' }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-[#686868] font-medium">{label}</span>
        {icon && <span className="text-[#B8482A]">{icon}</span>}
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-bold ${textColorClass}`}>{value}</span>
        {unit && <span className="text-sm text-[#686868]">{unit}</span>}
      </div>
    </div>
  )
}
