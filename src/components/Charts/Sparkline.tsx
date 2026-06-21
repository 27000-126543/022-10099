import { useMemo } from 'react'
import { AreaChart, Area, ResponsiveContainer } from 'recharts'

interface SparklineProps {
  data: number[]
  color?: string
  width?: number
  height?: number
  showArea?: boolean
}

export default function Sparkline({
  data,
  color = '#00D4AA',
  width = 120,
  height = 40,
  showArea = false,
}: SparklineProps) {
  const chartData = useMemo(() => data.map((v) => ({ v })), [data])

  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <defs>
            <linearGradient id={`sparkGrad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            fill={showArea ? `url(#sparkGrad-${color.replace('#', '')})` : 'none'}
            dot={false}
            activeDot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
