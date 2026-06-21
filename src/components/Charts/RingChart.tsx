import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

interface RingDataItem {
  name: string
  value: number
  color: string
}

interface RingChartProps {
  data: RingDataItem[]
  size?: number
  strokeWidth?: number
  centerLabel?: string
  centerValue?: string
}

const BG_COLOR = '#1E293B'

export default function RingChart({
  data,
  size = 180,
  strokeWidth = 20,
  centerLabel,
  centerValue,
}: RingChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  const outerRadius = size / 2
  const innerRadius = outerRadius - strokeWidth

  const bgData = [{ value: 1 }]

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={bgData}
              dataKey="value"
              outerRadius={outerRadius}
              innerRadius={innerRadius}
              startAngle={90}
              endAngle={-270}
              stroke="none"
              isAnimationActive={false}
            >
              <Cell fill={BG_COLOR} />
            </Pie>
            <Pie
              data={data}
              dataKey="value"
              outerRadius={outerRadius}
              innerRadius={innerRadius}
              startAngle={90}
              endAngle={-270}
              stroke="none"
              cornerRadius={2}
              paddingAngle={2}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {(centerLabel || centerValue) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {centerValue && (
              <span className="font-mono text-2xl font-bold text-brand-text-primary leading-none">
                {centerValue}
              </span>
            )}
            {centerLabel && (
              <span className="text-xs text-brand-text-muted mt-1">
                {centerLabel}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5">
        {data.map((item, i) => {
          const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0.0'
          return (
            <div key={i} className="flex items-center gap-1.5 text-xs">
              <span
                className="inline-block w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-brand-text-secondary">{item.name}</span>
              <span className="text-brand-text-primary font-medium font-mono">{item.value}</span>
              <span className="text-brand-text-muted">({pct}%)</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
