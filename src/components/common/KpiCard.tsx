import React from 'react'
import { LucideIcon } from 'lucide-react'

interface KpiCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
  trend?: {
    value: string
    isPositive?: boolean
    isNeutral?: boolean
  }
  alertLevel?: 'none' | 'warning' | 'critical'
  onClick?: () => void
  badgeText?: string
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-emerald-600',
  iconBg = 'bg-emerald-50',
  trend,
  alertLevel = 'none',
  onClick,
  badgeText,
}) => {
  const borderClass =
    alertLevel === 'critical'
      ? 'border-rose-300 ring-1 ring-rose-100 hover:border-rose-400'
      : alertLevel === 'warning'
      ? 'border-amber-300 ring-1 ring-amber-100 hover:border-amber-400'
      : 'border-slate-200/80 hover:border-slate-300'

  return (
    <div
      onClick={onClick}
      className={`relative bg-white rounded-xl p-5 border shadow-xs transition-all duration-200 ${borderClass} ${
        onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {title}
            </span>
            {badgeText && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">
                {badgeText}
              </span>
            )}
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
              {value}
            </span>
            {trend && (
              <span
                className={`text-xs font-semibold flex items-center ${
                  trend.isNeutral
                    ? 'text-slate-500'
                    : trend.isPositive
                    ? 'text-emerald-600'
                    : 'text-rose-600'
                }`}
              >
                {trend.value}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-500 line-clamp-1">
              {subtitle}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl shrink-0 ${iconBg} ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {onClick && (
        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 hover:text-emerald-700 font-medium">
          <span>View breakdown</span>
          <span>→</span>
        </div>
      )}
    </div>
  )
}
