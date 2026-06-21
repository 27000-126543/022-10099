import { AlertTriangle, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AlertCardProps {
  severity: 'high' | 'medium' | 'low'
  title: string
  description: string
  time?: string
  type?: string
  onAction?: () => void
}

const severityConfig = {
  high: {
    border: 'border-l-brand-red',
    icon: AlertTriangle,
    iconColor: 'text-brand-red',
  },
  medium: {
    border: 'border-l-brand-amber',
    icon: AlertCircle,
    iconColor: 'text-brand-amber',
  },
  low: {
    border: 'border-l-brand-gray',
    icon: Info,
    iconColor: 'text-brand-gray-light',
  },
}

export default function AlertCard({ severity, title, description, time, type, onAction }: AlertCardProps) {
  const config = severityConfig[severity]
  const Icon = config.icon

  return (
    <div className={cn(
      'bg-brand-card border border-brand-border border-l-4 rounded-xl p-4 transition-all duration-200'
    , config.border)}>
      <div className="flex items-start gap-3">
        <Icon size={18} className={cn('mt-0.5 shrink-0', config.iconColor)} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-brand-text-primary">{title}</span>
            {type && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-brand-gray/15 text-brand-gray-light">
                {type}
              </span>
            )}
          </div>

          <p className="text-xs text-brand-text-secondary leading-relaxed">{description}</p>

          <div className="flex items-center justify-between mt-2.5">
            {time && (
              <span className="text-xs text-brand-text-muted">{time}</span>
            )}
            {onAction && (
              <button
                onClick={onAction}
                className={cn(
                  'text-xs font-medium px-3 py-1 rounded-lg transition-colors',
                  type === '催办'
                    ? 'bg-brand-emerald/15 text-brand-emerald hover:bg-brand-emerald/25'
                    : 'bg-brand-gray/15 text-brand-gray-light hover:bg-brand-gray/25'
                )}
              >
                {type || '处理'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
