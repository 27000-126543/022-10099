import { useState, useMemo } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  ReferenceLine,
  CartesianGrid,
  Cell,
} from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import { DollarSign, TrendingUp, ChevronDown, ChevronRight, Users, Trash2 } from 'lucide-react'
import { channels, dailyChannelStats, getChannelStatsByDateRange } from '@/data/channels'
import PageWrapper from '@/components/Layout/PageWrapper'
import MetricCard from '@/components/UI/MetricCard'
import Modal from '@/components/UI/Modal'
import Badge from '@/components/UI/Badge'
import { cn } from '@/lib/utils'

type TimeRange = 7 | 30

interface CostEntry {
  channelId: string
  amount: number
  date: string
}

interface LeadDetailRow {
  id: string
  name: string
  concernTags: string[]
  followUpCount: number
  status: 'new' | 'contacted' | 'booked' | 'arrived' | 'closed' | 'lost'
  firstResponseMin: number
}

const CONCERN_TAGS = ['价格顾虑', '信任不足', '时间冲突', '效果存疑']
const TAG_VARIANTS: Record<string, 'emerald' | 'amber' | 'red' | 'blue'> = {
  '价格顾虑': 'amber',
  '信任不足': 'red',
  '时间冲突': 'blue',
  '效果存疑': 'emerald',
}
const LEAD_NAMES = ['王女士', '李先生', '张女士', '赵先生', '刘女士', '陈先生', '杨女士', '周先生', '吴女士', '孙先生']
const LEAD_STATUSES: LeadDetailRow['status'][] = ['new', 'contacted', 'booked', 'arrived', 'closed', 'lost']
const STATUS_LABELS: Record<string, string> = {
  new: '新线索',
  contacted: '已联系',
  booked: '已预约',
  arrived: '已到院',
  closed: '已成交',
  lost: '已流失',
}
const STATUS_VARIANTS: Record<string, 'emerald' | 'amber' | 'red' | 'blue' | 'gray'> = {
  new: 'blue',
  contacted: 'amber',
  booked: 'emerald',
  arrived: 'emerald',
  closed: 'emerald',
  lost: 'red',
}

function generateLeadDetails(channelId: string): LeadDetailRow[] {
  const count = 3 + Math.floor(Math.random() * 3)
  return Array.from({ length: count }, (_, i) => {
    const seed = channelId.charCodeAt(0) * 100 + i * 7
    const tagCount = 1 + (seed % 3)
    const tags = Array.from({ length: tagCount }, (_, j) => CONCERN_TAGS[(seed + j * 3) % CONCERN_TAGS.length])
    return {
      id: `${channelId}-lead-${i}`,
      name: LEAD_NAMES[(seed + i) % LEAD_NAMES.length],
      concernTags: tags,
      followUpCount: (seed % 5) + 1,
      status: LEAD_STATUSES[(seed + i) % LEAD_STATUSES.length],
      firstResponseMin: 3 + (seed % 30),
    }
  })
}

const LEAD_DETAILS_CACHE: Record<string, LeadDetailRow[]> = {}
function getLeadDetails(channelId: string): LeadDetailRow[] {
  if (!LEAD_DETAILS_CACHE[channelId]) {
    LEAD_DETAILS_CACHE[channelId] = generateLeadDetails(channelId)
  }
  return LEAD_DETAILS_CACHE[channelId]
}

function ChannelTrendChart() {
  const [timeRange, setTimeRange] = useState<TimeRange>(7)

  const trendData = useMemo(() => {
    const today = new Date()
    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - timeRange + 1)
    const startStr = startDate.toISOString().split('T')[0]
    const endStr = today.toISOString().split('T')[0]

    const stats = getChannelStatsByDateRange(startStr, endStr)

    const dateMap = new Map<string, Record<string, number>>()
    for (const s of stats) {
      if (!dateMap.has(s.date)) {
        dateMap.set(s.date, {})
      }
      dateMap.get(s.date)![s.channelId] = s.newLeads
    }

    const sortedDates = Array.from(dateMap.keys()).sort()
    return sortedDates.map(date => {
      const entry: Record<string, string | number> = {
        date: date.slice(5),
      }
      for (const ch of channels) {
        entry[ch.id] = dateMap.get(date)?.[ch.id] ?? 0
      }
      return entry
    })
  }, [timeRange])

  return (
    <div className="bg-brand-card border border-brand-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-brand-text-primary">渠道趋势</h3>
        <div className="flex gap-1 bg-brand-card-hover rounded-lg p-0.5">
          {([7, 30] as TimeRange[]).map(days => (
            <button
              key={days}
              onClick={() => setTimeRange(days)}
              className={cn(
                'px-3 py-1 text-xs rounded-md font-medium transition-colors',
                timeRange === days
                  ? 'bg-brand-emerald/20 text-brand-emerald'
                  : 'text-brand-text-muted hover:text-brand-text-secondary'
              )}
            >
              {days}日
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={trendData}>
          <defs>
            {channels.map(ch => (
              <linearGradient key={ch.id} id={`grad-${ch.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={ch.color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={ch.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#64748B', fontSize: 11 }}
            axisLine={{ stroke: '#1E293B' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#64748B', fontSize: 11 }}
            axisLine={{ stroke: '#1E293B' }}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0F172A',
              border: '1px solid #1E293B',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            labelStyle={{ color: '#94A3B8', marginBottom: '4px' }}
            formatter={(value: number, name: string) => {
              const ch = channels.find(c => c.id === name)
              return [value, ch?.name ?? name]
            }}
          />
          <Legend
            formatter={(value: string) => {
              const ch = channels.find(c => c.id === value)
              return <span style={{ color: ch?.color ?? '#94A3B8', fontSize: '12px' }}>{ch?.name ?? value}</span>
            }}
          />
          {channels.map(ch => (
            <Line
              key={ch.id}
              type="monotone"
              dataKey={ch.id}
              stroke={ch.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: ch.color }}
              fill={`url(#grad-${ch.id})`}
              fillOpacity={1}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function CostInputSection() {
  const [isOpen, setIsOpen] = useState(false)
  const [costs, setCosts] = useState<CostEntry[]>(() => {
    try {
      const raw = localStorage.getItem('channel_costs')
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })
  const [formChannel, setFormChannel] = useState(channels[0].id)
  const [formAmount, setFormAmount] = useState('')
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0])
  const [submitMsg, setSubmitMsg] = useState<{ text: string; type: 'ok' | 'warn' } | null>(null)

  const today = new Date()
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  const startStr = sevenDaysAgo.toISOString().split('T')[0]
  const endStr = today.toISOString().split('T')[0]
  const recentStats = getChannelStatsByDateRange(startStr, endStr)

  const persistCosts = (next: CostEntry[]) => {
    setCosts(next)
    try {
      localStorage.setItem('channel_costs', JSON.stringify(next))
    } catch {
      /* ignore quota errors */
    }
  }

  const roiData = useMemo(() => {
    return channels.map(ch => {
      const channelStats = recentStats.filter(s => s.channelId === ch.id)
      const totalDeal = channelStats.reduce((sum, s) => sum + s.dealAmount, 0)
      const inRangeCustomCost = costs
        .filter(c => c.channelId === ch.id && c.date >= startStr && c.date <= endStr)
        .reduce((sum, c) => sum + c.amount, 0)
      const defaultCost = ch.dailyCost * 7
      const totalCost = inRangeCustomCost > 0 ? inRangeCustomCost : defaultCost
      const roi = totalCost > 0 ? totalDeal / totalCost : 0
      return { ...ch, totalDeal, totalCost, roi, usedCustom: inRangeCustomCost > 0 }
    })
  }, [costs, recentStats, startStr, endStr])

  const sortedCosts = useMemo(() => {
    return [...costs].sort((a, b) => b.date.localeCompare(a.date))
  }, [costs])

  const handleSubmit = () => {
    const amount = parseFloat(formAmount)
    if (isNaN(amount) || amount <= 0) return
    const next = [...costs, { channelId: formChannel, amount, date: formDate }]
    persistCosts(next)
    setFormAmount('')
    const inRange = formDate >= startStr && formDate <= endStr
    const chName = channels.find(c => c.id === formChannel)?.name ?? ''
    if (inRange) {
      setSubmitMsg({ text: `已录入${chName}成本，将参与当前7日ROI计算`, type: 'ok' })
    } else {
      setSubmitMsg({ text: `已录入${chName}成本，日期在当前7日范围外，暂不影响当前ROI`, type: 'warn' })
    }
    setTimeout(() => setSubmitMsg(null), 3000)
    setTimeout(() => setIsOpen(false), 400)
  }

  const handleDelete = (sortedIndex: number) => {
    const originalIndex = costs.indexOf(sortedCosts[sortedIndex])
    if (originalIndex === -1) return
    const next = costs.filter((_, i) => i !== originalIndex)
    persistCosts(next)
    const cost = sortedCosts[sortedIndex]
    const chName = channels.find(c => c.id === cost.channelId)?.name ?? ''
    const inRange = cost.date >= startStr && cost.date <= endStr
    if (inRange) {
      setSubmitMsg({ text: `已删除${chName}成本记录，ROI已重新计算`, type: 'warn' })
    } else {
      setSubmitMsg({ text: `已删除${chName}成本记录`, type: 'warn' })
    }
    setTimeout(() => setSubmitMsg(null), 3000)
  }

  return (
    <div className="bg-brand-card border border-brand-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-brand-text-primary">成本与ROI</h3>
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-brand-emerald/15 text-brand-emerald hover:bg-brand-emerald/25 transition-colors"
        >
          <DollarSign size={14} />
          录入成本
        </button>
      </div>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="录入成本">
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-brand-text-muted mb-1">渠道</label>
            <select
              value={formChannel}
              onChange={e => setFormChannel(e.target.value)}
              className="w-full bg-brand-card-hover border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text-primary focus:outline-none focus:border-brand-emerald"
            >
              {channels.map(ch => (
                <option key={ch.id} value={ch.id}>{ch.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-brand-text-muted mb-1">金额 (元)</label>
            <input
              type="number"
              value={formAmount}
              onChange={e => setFormAmount(e.target.value)}
              placeholder="请输入金额"
              className="w-full bg-brand-card-hover border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text-primary focus:outline-none focus:border-brand-emerald placeholder:text-brand-text-muted"
            />
          </div>
          <div>
            <label className="block text-xs text-brand-text-muted mb-1">日期</label>
            <input
              type="date"
              value={formDate}
              onChange={e => setFormDate(e.target.value)}
              className="w-full bg-brand-card-hover border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text-primary focus:outline-none focus:border-brand-emerald"
            />
          </div>
          <button
            onClick={handleSubmit}
            className="w-full py-2 text-sm font-medium rounded-lg bg-brand-emerald text-white hover:bg-brand-emerald/90 transition-colors"
          >
            确认录入
          </button>
        </div>
      </Modal>

      {submitMsg && (
        <div
          className={cn(
            'mb-3 text-xs px-3 py-2 rounded-lg',
            submitMsg.type === 'ok'
              ? 'bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20'
              : 'bg-brand-amber/10 text-brand-amber border border-brand-amber/20'
          )}
        >
          {submitMsg.text}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {roiData.map(ch => (
          <div key={ch.id} className="bg-brand-card-hover rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ch.color }} />
              <span className="text-xs text-brand-text-secondary">{ch.name}</span>
              {ch.usedCustom && (
                <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-brand-emerald/15 text-brand-emerald">
                  自定义成本
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-lg font-bold text-brand-text-primary">
                {ch.roi.toFixed(2)}
              </span>
              <span className="text-xs text-brand-text-muted">ROI</span>
            </div>
            <div className="text-[10px] text-brand-text-muted mt-1">
              成交 ¥{ch.totalDeal.toLocaleString()} / 成本 ¥{ch.totalCost.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 pt-4 border-t border-brand-border">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-blue/15 text-brand-blue font-medium">
            记录
          </span>
          <h4 className="text-sm font-semibold text-brand-text-primary">成本记录</h4>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand-card-hover text-brand-text-muted">
            {sortedCosts.length}
          </span>
        </div>

        {sortedCosts.length === 0 ? (
          <div className="py-6 text-center">
            <div className="text-xs text-brand-text-muted">
              暂无成本记录，点击右上角录入
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border/50">
                  <th className="text-left py-2 px-2 text-xs text-brand-text-muted font-medium">渠道</th>
                  <th className="text-left py-2 px-2 text-xs text-brand-text-muted font-medium">日期</th>
                  <th className="text-right py-2 px-2 text-xs text-brand-text-muted font-medium">金额</th>
                  <th className="text-center py-2 px-2 text-xs text-brand-text-muted font-medium w-12">操作</th>
                </tr>
              </thead>
              <tbody>
                {sortedCosts.map((cost, idx) => {
                  const ch = channels.find(c => c.id === cost.channelId)
                  return (
                    <tr key={idx} className="border-b border-brand-border/30 last:border-0">
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: ch?.color }} />
                          <span className="text-xs text-brand-text-secondary">{ch?.name}</span>
                        </div>
                      </td>
                      <td className="py-2 px-2 text-xs text-brand-text-muted font-mono">
                        {cost.date}
                      </td>
                      <td className="py-2 px-2 text-right text-xs font-mono text-brand-text-primary">
                        ¥{cost.amount.toLocaleString()}
                      </td>
                      <td className="py-2 px-2 text-center">
                        <button
                          onClick={() => handleDelete(idx)}
                          className="p-1.5 rounded-md text-brand-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function ThreeRateComparison() {
  const today = new Date()
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  const recentStats = getChannelStatsByDateRange(
    sevenDaysAgo.toISOString().split('T')[0],
    today.toISOString().split('T')[0]
  )

  const { barData, avgValidRate, avgBookingRate, avgArrivalRate } = useMemo(() => {
    const data = channels.map(ch => {
      const channelStats = recentStats.filter(s => s.channelId === ch.id)
      const totalNew = channelStats.reduce((sum, s) => sum + s.newLeads, 0)
      const totalValid = channelStats.reduce((sum, s) => sum + s.validLeads, 0)
      const totalBooked = channelStats.reduce((sum, s) => sum + s.booked, 0)
      const totalArrived = channelStats.reduce((sum, s) => sum + s.arrived, 0)

      const validRate = totalNew > 0 ? (totalValid / totalNew) * 100 : 0
      const bookingRate = totalValid > 0 ? (totalBooked / totalValid) * 100 : 0
      const arrivalRate = totalBooked > 0 ? (totalArrived / totalBooked) * 100 : 0

      return {
        name: ch.name,
        color: ch.color,
        有效率: parseFloat(validRate.toFixed(1)),
        预约率: parseFloat(bookingRate.toFixed(1)),
        到院率: parseFloat(arrivalRate.toFixed(1)),
      }
    })

    const avgV = data.reduce((s, d) => s + d['有效率'], 0) / data.length
    const avgB = data.reduce((s, d) => s + d['预约率'], 0) / data.length
    const avgA = data.reduce((s, d) => s + d['到院率'], 0) / data.length

    return {
      barData: data,
      avgValidRate: parseFloat(avgV.toFixed(1)),
      avgBookingRate: parseFloat(avgB.toFixed(1)),
      avgArrivalRate: parseFloat(avgA.toFixed(1)),
    }
  }, [recentStats])

  const avgOverall = parseFloat(((avgValidRate + avgBookingRate + avgArrivalRate) / 3).toFixed(1))

  const RATE_COLORS: Record<string, string> = {
    '有效率': '#10B981',
    '预约率': '#F59E0B',
    '到院率': '#3B82F6',
  }

  return (
    <div className="bg-brand-card border border-brand-border rounded-xl p-5">
      <h3 className="text-sm font-semibold text-brand-text-primary mb-4">三率对比</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={barData} barCategoryGap="20%">
          <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
          <XAxis
            dataKey="name"
            tick={{ fill: '#64748B', fontSize: 11 }}
            axisLine={{ stroke: '#1E293B' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#64748B', fontSize: 11 }}
            axisLine={{ stroke: '#1E293B' }}
            tickLine={false}
            unit="%"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0F172A',
              border: '1px solid #1E293B',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            labelStyle={{ color: '#94A3B8', marginBottom: '4px' }}
            formatter={(value: number) => [`${value}%`]}
          />
          <Legend
            formatter={(value: string) => (
              <span style={{ color: RATE_COLORS[value] ?? '#94A3B8', fontSize: '12px' }}>{value}</span>
            )}
          />
          <ReferenceLine y={avgOverall} stroke="#64748B" strokeDasharray="6 4" label={{ value: `均值 ${avgOverall}%`, fill: '#64748B', fontSize: 10, position: 'right' }} />
          {(['有效率', '预约率', '到院率'] as const).map(key => (
            <Bar key={key} dataKey={key} radius={[4, 4, 0, 0]} maxBarSize={24}>
              {barData.map((entry, idx) => (
                <Cell
                  key={idx}
                  fill={RATE_COLORS[key]}
                  opacity={entry[key] < avgOverall ? 0.4 : 1}
                />
              ))}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function DrillDownTable() {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const today = new Date()
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  const recentStats = getChannelStatsByDateRange(
    sevenDaysAgo.toISOString().split('T')[0],
    today.toISOString().split('T')[0]
  )

  const tableData = useMemo(() => {
    return channels.map(ch => {
      const channelStats = recentStats.filter(s => s.channelId === ch.id)
      return {
        id: ch.id,
        name: ch.name,
        color: ch.color,
        newLeads: channelStats.reduce((sum, s) => sum + s.newLeads, 0),
        validLeads: channelStats.reduce((sum, s) => sum + s.validLeads, 0),
        booked: channelStats.reduce((sum, s) => sum + s.booked, 0),
        arrived: channelStats.reduce((sum, s) => sum + s.arrived, 0),
        dealAmount: channelStats.reduce((sum, s) => sum + s.dealAmount, 0),
        avgFirstResponse: channelStats.length > 0
          ? Math.round(channelStats.reduce((sum, s) => sum + s.avgFirstResponseMin, 0) / channelStats.length)
          : 0,
      }
    })
  }, [recentStats])

  const columns = [
    { key: 'name', label: '渠道' },
    { key: 'newLeads', label: '新线索' },
    { key: 'validLeads', label: '有效线索' },
    { key: 'booked', label: '已预约' },
    { key: 'arrived', label: '已到院' },
    { key: 'dealAmount', label: '成交金额' },
    { key: 'avgFirstResponse', label: '平均首响(分)' },
  ]

  return (
    <div className="bg-brand-card border border-brand-border rounded-xl p-5">
      <h3 className="text-sm font-semibold text-brand-text-primary mb-4">渠道明细</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-border">
              <th className="text-left py-2 px-3 text-xs text-brand-text-muted font-medium w-8" />
              {columns.map(col => (
                <th key={col.key} className="text-left py-2 px-3 text-xs text-brand-text-muted font-medium">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.map(row => {
              const isExpanded = expandedId === row.id
              const leadDetails = getLeadDetails(row.id)
              return (
                <tr key={row.id} className="border-b border-brand-border/50">
                  <td colSpan={columns.length + 1} className="p-0">
                    <div>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : row.id)}
                        className="w-full flex items-center text-left"
                      >
                        <span className="py-3 px-3 w-8">
                          {isExpanded ? (
                            <ChevronDown size={14} className="text-brand-text-muted" />
                          ) : (
                            <ChevronRight size={14} className="text-brand-text-muted" />
                          )}
                        </span>
                        <span className="py-3 px-3 flex items-center gap-2 w-24">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: row.color }} />
                          <span className="text-brand-text-secondary">{row.name}</span>
                        </span>
                        <span className="py-3 px-3 font-mono text-brand-text-primary w-20">{row.newLeads}</span>
                        <span className="py-3 px-3 font-mono text-brand-text-primary w-20">{row.validLeads}</span>
                        <span className="py-3 px-3 font-mono text-brand-text-primary w-20">{row.booked}</span>
                        <span className="py-3 px-3 font-mono text-brand-text-primary w-20">{row.arrived}</span>
                        <span className="py-3 px-3 font-mono text-brand-text-primary w-28">¥{row.dealAmount.toLocaleString()}</span>
                        <span className="py-3 px-3 font-mono text-brand-text-primary w-28">{row.avgFirstResponse}分钟</span>
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="pl-14 pr-4 pb-3">
                              <div className="bg-brand-card-hover rounded-lg p-3 space-y-2">
                                <div className="text-xs text-brand-text-muted mb-2 flex items-center gap-1">
                                  <Users size={12} />
                                  线索详情
                                </div>
                                {leadDetails.map(lead => (
                                  <div
                                    key={lead.id}
                                    className="flex items-center gap-3 py-1.5 border-b border-brand-border/30 last:border-0"
                                  >
                                    <span className="text-xs text-brand-text-secondary w-16">{lead.name}</span>
                                    <div className="flex gap-1 flex-1">
                                      {lead.concernTags.map(tag => (
                                        <Badge key={tag} variant={TAG_VARIANTS[tag]} size="sm">
                                          {tag}
                                        </Badge>
                                      ))}
                                    </div>
                                    <span className="text-xs text-brand-text-muted w-20">
                                      跟进 {lead.followUpCount} 次
                                    </span>
                                    <Badge variant={STATUS_VARIANTS[lead.status]} size="sm">
                                      {STATUS_LABELS[lead.status]}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function ChannelPage() {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]
  const yesterdayStats = dailyChannelStats.filter(s => s.date === yesterdayStr)

  const totalNewLeads = yesterdayStats.reduce((sum, s) => sum + s.newLeads, 0)
  const totalValidLeads = yesterdayStats.reduce((sum, s) => sum + s.validLeads, 0)
  const totalBooked = yesterdayStats.reduce((sum, s) => sum + s.booked, 0)
  const totalDealAmount = yesterdayStats.reduce((sum, s) => sum + s.dealAmount, 0)

  return (
    <PageWrapper>
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            icon={<TrendingUp size={16} />}
            label="昨日新线索"
            value={totalNewLeads}
            change={5.2}
            color="emerald"
          />
          <MetricCard
            icon={<Users size={16} />}
            label="昨日有效线索"
            value={totalValidLeads}
            change={3.8}
            color="blue"
          />
          <MetricCard
            icon={<TrendingUp size={16} />}
            label="昨日预约"
            value={totalBooked}
            change={-2.1}
            color="amber"
          />
          <MetricCard
            icon={<DollarSign size={16} />}
            label="昨日成交"
            value={totalDealAmount}
            unit="元"
            change={8.5}
            color="emerald"
          />
        </div>

        <ChannelTrendChart />

        <CostInputSection />

        <ThreeRateComparison />

        <DrillDownTable />
      </div>
    </PageWrapper>
  )
}
