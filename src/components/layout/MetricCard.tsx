import React from 'react'

interface MetricCardProps {
  label: string
  value: string | number
  unit?: string
  sublabel?: string
  icon: React.ReactNode
  variant?: 'default' | 'orange' | 'cyan' | 'emerald' | 'purple'
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  sublabel,
  icon,
  variant = 'default',
}) => {
  const variantStyles = {
    default: 'border-slate-800 bg-slate-900/60 text-slate-100',
    orange: 'border-orange-500/30 bg-orange-500/10 text-orange-400',
    cyan: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400',
    emerald: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
    purple: 'border-purple-500/30 bg-purple-500/10 text-purple-400',
  }

  const iconBgStyles = {
    default: 'bg-slate-800 text-slate-300',
    orange: 'bg-orange-500/20 text-orange-400',
    cyan: 'bg-cyan-500/20 text-cyan-400',
    emerald: 'bg-emerald-500/20 text-emerald-400',
    purple: 'bg-purple-500/20 text-purple-400',
  }

  return (
    <div
      className={`relative overflow-hidden rounded-xl border p-4 backdrop-blur transition-all duration-200 hover:border-slate-700 ${variantStyles[variant]}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </span>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconBgStyles[variant]}`}>
          {icon}
        </div>
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-2xl font-extrabold tracking-tight text-white font-mono">
          {value}
        </span>
        {unit && <span className="text-sm font-medium text-slate-400">{unit}</span>}
      </div>
      {sublabel && (
        <p className="mt-1 text-xs text-slate-400 flex items-center gap-1">
          {sublabel}
        </p>
      )}
    </div>
  )
}
