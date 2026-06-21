import { Fragment, useState, useMemo } from 'react'

interface HeatmapDataItem {
  x: string
  y: string
  value: number
}

interface HeatmapChartProps {
  data: HeatmapDataItem[]
  xLabels: string[]
  yLabels: string[]
}

function getHeatColor(value: number, min: number, max: number): string {
  if (max === min) return '#00D4AA'
  const t = (value - min) / (max - min)

  let r: number, g: number, b: number

  if (t < 0.5) {
    const s = t / 0.5
    r = Math.round(0 + s * 245)
    g = Math.round(212 - s * 46)
    b = Math.round(170 - s * 135)
  } else {
    const s = (t - 0.5) / 0.5
    r = Math.round(245 + s * 10)
    g = Math.round(166 - s * 95)
    b = Math.round(35 + s * 22)
  }

  return `rgb(${r},${g},${b})`
}

export default function HeatmapChart({ data, xLabels, yLabels }: HeatmapChartProps) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string; value: number } | null>(null)

  const { min, max } = useMemo(() => {
    const values = data.map(d => d.value)
    return { min: Math.min(...values), max: Math.max(...values) }
  }, [data])

  const dataMap = useMemo(() => {
    const map = new Map<string, number>()
    data.forEach(d => map.set(`${d.x}-${d.y}`, d.value))
    return map
  }, [data])

  const cellSize = 28
  const labelWidth = 72
  const labelHeight = 28
  const gap = 2

  return (
    <div className="relative inline-block">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `${labelWidth}px repeat(${xLabels.length}, ${cellSize}px)`,
          gridTemplateRows: `${labelHeight}px repeat(${yLabels.length}, ${cellSize}px)`,
          gap: `${gap}px`,
        }}
      >
        <div />
        {xLabels.map((label, i) => (
          <div
            key={i}
            className="flex items-center justify-center text-[10px] text-brand-text-muted select-none"
            title={label}
          >
            <span className="truncate w-full text-center">{label}</span>
          </div>
        ))}

        {yLabels.map((yLabel, rowIdx) => (
          <Fragment key={rowIdx}>
            <div
              className="flex items-center justify-end pr-2 text-[11px] text-brand-text-secondary truncate select-none"
            >
              {yLabel}
            </div>
            {xLabels.map((_, colIdx) => {
              const xLabel = xLabels[colIdx]
              const value = dataMap.get(`${xLabel}-${yLabel}`) ?? 0
              const bgColor = value > 0 ? getHeatColor(value, min, max) : '#1E293B'
              return (
                <div
                  key={`${rowIdx}-${colIdx}`}
                  className="rounded-sm cursor-pointer transition-transform hover:scale-110"
                  style={{ backgroundColor: bgColor, width: cellSize, height: cellSize }}
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    const parentRect = e.currentTarget.parentElement!.getBoundingClientRect()
                    setTooltip({
                      x: rect.left - parentRect.left + rect.width / 2,
                      y: rect.top - parentRect.top - 4,
                      label: `${yLabel} · ${xLabel}`,
                      value,
                    })
                  }}
                  onMouseLeave={() => setTooltip(null)}
                />
              )
            })}
          </Fragment>
        ))}
      </div>

      {tooltip && (
        <div
          className="absolute pointer-events-none z-10 px-2 py-1 rounded bg-brand-card border border-brand-border text-xs whitespace-nowrap"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <span className="text-brand-text-secondary">{tooltip.label}</span>
          <span className="ml-1.5 text-brand-text-primary font-mono font-medium">{tooltip.value}</span>
        </div>
      )}
    </div>
  )
}
