import { useEffect, useRef, useState } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  change?: number
  unit?: string
  color?: 'emerald' | 'amber' | 'red' | 'blue'
  format?: (num: number) => string
}

const colorMap = {
  emerald: 'text-brand-emerald',
  amber: 'text-brand-amber',
  red: 'text-brand-red',
  blue: 'text-brand-blue',
}

const glowMap = {
  emerald: 'glow-emerald',
  amber: 'glow-amber',
  red: 'glow-red',
  blue: '',
}

export default function MetricCard({ icon, label, value, change, unit, color = 'emerald', format }: MetricCardProps) {
  const [displayValue, setDisplayValue] = useState<string | number>(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const numericValue = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value
    if (isNaN(numericValue)) {
      setDisplayValue(value)
      return
    }

    const duration = 800
    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = numericValue * eased

      if (format) {
        setDisplayValue(format(current))
      } else if (Number.isInteger(numericValue)) {
        setDisplayValue(Math.round(current))
      } else {
        setDisplayValue(current.toFixed(1))
      }

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [value, format])

  const isPositive = change !== undefined && change >= 0

  return (
    <div className={cn(
      'bg-brand-card border border-brand-border rounded-xl p-5 transition-all duration-200',
      glowMap[color]
    )}>
      <div className="flex items-center gap-2 mb-3">
        <span className={colorMap[color]}>{icon}</span>
        <span className="text-xs text-brand-text-muted font-medium uppercase tracking-wider">{label}</span>
      </div>

      <div className="flex items-baseline gap-1.5 mb-2">
        <span className="font-mono text-3xl font-bold text-brand-text-primary tracking-tight">
          {displayValue}
        </span>
        {unit && (
          <span className="text-sm text-brand-text-muted">{unit}</span>
        )}
      </div>

      {change !== undefined && (
        <div className={cn(
          'flex items-center gap-1 text-xs font-medium',
          isPositive ? 'text-brand-emerald' : 'text-brand-red'
        )}>
          {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          <span>{isPositive ? '+' : ''}{change}%</span>
          <span className="text-brand-text-muted ml-1">较昨日</span>
        </div>
      )}
    </div>
  )
}
