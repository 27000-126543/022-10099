import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'emerald' | 'amber' | 'red' | 'blue' | 'gray'
  size?: 'sm' | 'md'
}

const variantMap = {
  emerald: 'bg-brand-emerald/15 text-brand-emerald',
  amber: 'bg-brand-amber/15 text-brand-amber',
  red: 'bg-brand-red/15 text-brand-red',
  blue: 'bg-brand-blue/15 text-brand-blue',
  gray: 'bg-brand-gray/15 text-brand-gray-light',
}

const sizeMap = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
}

export default function Badge({ children, variant = 'emerald', size = 'sm' }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-full font-medium',
      variantMap[variant],
      sizeMap[size]
    )}>
      {children}
    </span>
  )
}
