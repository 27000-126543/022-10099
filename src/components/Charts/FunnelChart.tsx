import { useState } from 'react'

interface FunnelStage {
  name: string
  value: number
  rate?: string
  color?: string
}

interface FunnelChartProps {
  stages: FunnelStage[]
  width?: number
  height?: number
}

const DEFAULT_COLORS = [
  '#00D4AA',
  '#00C49A',
  '#00B48A',
  '#00A47A',
  '#00946A',
  '#00845A',
]

export default function FunnelChart({ stages, width = 400, height = 320 }: FunnelChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  if (!stages.length) return null

  const maxValue = Math.max(...stages.map(s => s.value))
  const stageCount = stages.length
  const gap = 4
  const stageHeight = (height - (stageCount - 1) * gap) / stageCount
  const centerX = width / 2
  const minWidthRatio = 0.3

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        {stages.map((_, i) => (
          <linearGradient key={i} id={`funnelGrad${i}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={stages[i].color || DEFAULT_COLORS[i % DEFAULT_COLORS.length]} stopOpacity={0.7} />
            <stop offset="50%" stopColor={stages[i].color || DEFAULT_COLORS[i % DEFAULT_COLORS.length]} stopOpacity={1} />
            <stop offset="100%" stopColor={stages[i].color || DEFAULT_COLORS[i % DEFAULT_COLORS.length]} stopOpacity={0.7} />
          </linearGradient>
        ))}
        <filter id="funnelGlow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {stages.map((stage, i) => {
        const ratio = maxValue > 0 ? stage.value / maxValue : minWidthRatio
        const halfWidth = (Math.max(ratio, minWidthRatio) * width) / 2
        const prevRatio = i > 0 && maxValue > 0 ? stages[i - 1].value / maxValue : 1
        const prevHalfWidth = i > 0 ? (Math.max(prevRatio, minWidthRatio) * width) / 2 : width / 2
        const y = i * (stageHeight + gap)

        const topLeft = centerX - prevHalfWidth
        const topRight = centerX + prevHalfWidth
        const bottomLeft = centerX - halfWidth
        const bottomRight = centerX + halfWidth

        const isHovered = hoveredIndex === i

        return (
          <g
            key={i}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
            style={{ cursor: 'pointer' }}
          >
            <path
              d={`M ${topLeft} ${y} L ${topRight} ${y} L ${bottomRight} ${y + stageHeight} L ${bottomLeft} ${y + stageHeight} Z`}
              fill={`url(#funnelGrad${i})`}
              filter={isHovered ? 'url(#funnelGlow)' : undefined}
              opacity={isHovered ? 1 : 0.9}
              style={{ transition: 'opacity 0.2s, filter 0.2s' }}
            />
            <text
              x={centerX - width / 2 + 8}
              y={y + stageHeight / 2 + 4}
              fill="#94A3B8"
              fontSize={12}
              textAnchor="start"
            >
              {stage.name}
            </text>
            <text
              x={centerX}
              y={y + stageHeight / 2 + 4}
              fill="#F1F5F9"
              fontSize={14}
              fontWeight={600}
              fontFamily="JetBrains Mono, monospace"
              textAnchor="middle"
            >
              {stage.value.toLocaleString()}
            </text>
            {stage.rate && (
              <text
                x={centerX + width / 2 - 8}
                y={y + stageHeight / 2 + 4}
                fill="#00D4AA"
                fontSize={12}
                textAnchor="end"
              >
                {stage.rate}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
