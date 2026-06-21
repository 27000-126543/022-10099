import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, CheckCircle2, Zap, CalendarCheck, Building2, DollarSign, Target, TrendingUp, TrendingDown, AlertTriangle, X } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ComposedChart, Line, Area, CartesianGrid, ReferenceLine } from 'recharts'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import PageWrapper from '@/components/Layout/PageWrapper'
import MetricCard from '@/components/UI/MetricCard'
import FunnelChart from '@/components/Charts/FunnelChart'
import { channels, getChannelStatsByDateRange } from '@/data/channels'
import { dailyProjectStats } from '@/data/projects'
import { getActiveAlerts } from '@/data/alerts'
import { loadTargets, type MonthlyTarget } from '@/data/targets'

type DateRangeKey = '7d' | '30d' | 'month'

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

function getDateRange(key: DateRangeKey): { start: string; end: string } {
  const today = new Date()
  const end = formatDate(today)

  if (key === '7d') {
    const start = new Date(today)
    start.setDate(start.getDate() - 6)
    return { start: formatDate(start), end }
  }

  if (key === '30d') {
    const start = new Date(today)
    start.setDate(start.getDate() - 29)
    return { start: formatDate(start), end }
  }

  const start = new Date(today.getFullYear(), today.getMonth(), 1)
  return { start: formatDate(start), end }
}

export default function OverviewPage() {
  const navigate = useNavigate()
  const [dateRange, setDateRange] = useState<DateRangeKey>('7d')
  const [selectedTargetMetric, setSelectedTargetMetric] = useState<'leads' | 'dealAmount' | 'validRate' | null>(null)

  const { start, end } = useMemo(() => getDateRange(dateRange), [dateRange])

  const channelStats = useMemo(() => getChannelStatsByDateRange(start, end), [start, end])
  const projectStats = useMemo(() => dailyProjectStats.filter(s => s.date >= start && s.date <= end), [start, end])
  const activeAlerts = useMemo(() => getActiveAlerts(), [])

  const currentMonth = new Date().toISOString().slice(0, 7)
  const monthTarget = useMemo(() => loadTargets().find(t => t.month === currentMonth), [currentMonth])

  const monthStartStr = useMemo(() => {
    const d = new Date()
    return formatDate(new Date(d.getFullYear(), d.getMonth(), 1))
  }, [])

  const todayStr = useMemo(() => formatDate(new Date()), [])

  const currentMonthStats = useMemo(
    () => getChannelStatsByDateRange(monthStartStr, todayStr),
    [monthStartStr, todayStr]
  )

  const targetProgress = useMemo(() => {
    if (!monthTarget) return null

    const now = new Date()
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const daysPassed = Math.max(now.getDate(), 1)

    const totalNewLeads = currentMonthStats.reduce((s, c) => s + c.newLeads, 0)
    const totalValidLeads = currentMonthStats.reduce((s, c) => s + c.validLeads, 0)
    const totalDealAmount = currentMonthStats.reduce((s, c) => s + c.dealAmount, 0)
    const validRate = totalNewLeads > 0 ? totalValidLeads / totalNewLeads : 0

    const predictedLeads = (totalNewLeads / daysPassed) * daysInMonth
    const predictedDealAmount = (totalDealAmount / daysPassed) * daysInMonth

    return {
      leads: {
        current: totalNewLeads,
        target: monthTarget.totalLeads,
        predicted: Math.round(predictedLeads),
        onTrack: predictedLeads >= monthTarget.totalLeads,
        progress: Math.min(totalNewLeads / monthTarget.totalLeads, 1),
        gap: monthTarget.totalLeads - totalNewLeads,
      },
      dealAmount: {
        current: totalDealAmount,
        target: monthTarget.totalDealAmount,
        predicted: Math.round(predictedDealAmount),
        onTrack: predictedDealAmount >= monthTarget.totalDealAmount,
        progress: Math.min(totalDealAmount / monthTarget.totalDealAmount, 1),
        gap: monthTarget.totalDealAmount - totalDealAmount,
      },
      validRate: {
        current: validRate,
        target: monthTarget.validRate,
        predicted: validRate,
        onTrack: validRate >= monthTarget.validRate,
        progress: Math.min(validRate / monthTarget.validRate, 1),
        gap: monthTarget.validRate - validRate,
      },
    }
  }, [monthTarget, currentMonthStats])

  const breakdownChartData = useMemo(() => {
    if (!selectedTargetMetric || !monthTarget) return []

    const rangeStats = getChannelStatsByDateRange(start, end)
    const now = new Date()
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()

    const byDate: Record<string, { newLeads: number; validLeads: number; dealAmount: number }> = {}
    for (const s of rangeStats) {
      if (!byDate[s.date]) byDate[s.date] = { newLeads: 0, validLeads: 0, dealAmount: 0 }
      byDate[s.date].newLeads += s.newLeads
      byDate[s.date].validLeads += s.validLeads
      byDate[s.date].dealAmount += s.dealAmount
    }

    const dates = Object.keys(byDate).sort()
    let cumActual = 0
    let cumExpected = 0

    return dates.map(date => {
      const d = byDate[date]
      let actual: number
      let expected: number

      if (selectedTargetMetric === 'leads') {
        actual = d.newLeads
        expected = monthTarget.totalLeads / daysInMonth
      } else if (selectedTargetMetric === 'dealAmount') {
        actual = d.dealAmount
        expected = monthTarget.totalDealAmount / daysInMonth
      } else {
        actual = d.newLeads > 0 ? d.validLeads / d.newLeads : 0
        expected = monthTarget.validRate
      }

      if (selectedTargetMetric === 'validRate') {
        cumActual = actual
        cumExpected = expected
      } else {
        cumActual += actual
        cumExpected += expected
      }

      const cumGap = cumExpected - cumActual
      const negGap = cumGap < 0 ? cumGap : 0

      return {
        date: date.slice(5),
        actual,
        expected,
        cumGap: selectedTargetMetric === 'validRate' ? (actual < expected ? actual - expected : 0) : negGap,
        cumActual,
        cumExpected,
      }
    })
  }, [selectedTargetMetric, monthTarget, start, end])

  const metrics = useMemo(() => {
    const totalNewLeads = channelStats.reduce((s, c) => s + c.newLeads, 0)
    const totalValidLeads = channelStats.reduce((s, c) => s + c.validLeads, 0)
    const totalBooked = channelStats.reduce((s, c) => s + c.booked, 0)
    const totalArrived = channelStats.reduce((s, c) => s + c.arrived, 0)
    const totalDealAmount = channelStats.reduce((s, c) => s + c.dealAmount, 0)
    const validRate = totalNewLeads > 0 ? (totalValidLeads / totalNewLeads) * 100 : 0
    const fastResponseCount = channelStats.filter(c => c.avgFirstResponseMin < 10).length
    const totalRecords = channelStats.length
    const firstResponseRate = totalRecords > 0 ? (fastResponseCount / totalRecords) * 100 : 0
    const bookingRate = totalValidLeads > 0 ? (totalBooked / totalValidLeads) * 100 : 0
    const arrivalRate = totalBooked > 0 ? (totalArrived / totalBooked) * 100 : 0

    return {
      totalNewLeads,
      validRate,
      firstResponseRate,
      bookingRate,
      arrivalRate,
      totalDealAmount,
    }
  }, [channelStats])

  const channelRanking = useMemo(() => {
    const channelTotals: Record<string, { newLeads: number }> = {}
    for (const stat of channelStats) {
      if (!channelTotals[stat.channelId]) {
        channelTotals[stat.channelId] = { newLeads: 0 }
      }
      channelTotals[stat.channelId].newLeads += stat.newLeads
    }

    return Object.entries(channelTotals)
      .map(([channelId, data]) => {
        const channel = channels.find(c => c.id === channelId)
        return {
          name: channel?.name ?? channelId,
          value: data.newLeads,
          color: channel?.color ?? '#6B7280',
        }
      })
      .sort((a, b) => b.value - a.value)
  }, [channelStats])

  const funnelStages = useMemo(() => {
    const totalLeads = projectStats.reduce((s, p) => s + p.leads, 0)
    const totalBooked = projectStats.reduce((s, p) => s + p.booked, 0)
    const totalArrived = projectStats.reduce((s, p) => s + p.arrived, 0)
    const totalClosed = projectStats.reduce((s, p) => s + p.closed, 0)

    const bookingRate = totalLeads > 0 ? ((totalBooked / totalLeads) * 100).toFixed(1) + '%' : '-'
    const arrivalRate = totalBooked > 0 ? ((totalArrived / totalBooked) * 100).toFixed(1) + '%' : '-'
    const closeRate = totalArrived > 0 ? ((totalClosed / totalArrived) * 100).toFixed(1) + '%' : '-'

    return [
      { name: '线索', value: totalLeads },
      { name: '预约', value: totalBooked, rate: bookingRate },
      { name: '到院', value: totalArrived, rate: arrivalRate },
      { name: '成交', value: totalClosed, rate: closeRate },
    ]
  }, [projectStats])

  const alertText = useMemo(() => {
    const count = activeAlerts.length
    const titles = activeAlerts.slice(0, 3).map(a => a.title).join('  |  ')
    return `${count}条待处理告警：${titles}`
  }, [activeAlerts])

  const dateRangeOptions: { key: DateRangeKey; label: string }[] = [
    { key: '7d', label: '最近7日' },
    { key: '30d', label: '最近30日' },
    { key: 'month', label: '本月' },
  ]

  return (
    <PageWrapper>
      <div className="space-y-6 pb-14">
        <div className="flex justify-end">
          <div className="flex bg-brand-card-hover rounded-lg p-0.5">
            {dateRangeOptions.map(option => (
              <button
                key={option.key}
                onClick={() => setDateRange(option.key)}
                className={cn(
                  'px-4 py-1.5 text-sm rounded-md font-medium transition-colors',
                  dateRange === option.key
                    ? 'bg-brand-emerald text-white'
                    : 'text-brand-text-muted hover:text-brand-text-secondary'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <MetricCard
            icon={<UserPlus size={18} />}
            label="新增客资"
            value={metrics.totalNewLeads}
            color="emerald"
          />
          <MetricCard
            icon={<CheckCircle2 size={18} />}
            label="有效率"
            value={metrics.validRate.toFixed(1)}
            unit="%"
            color="emerald"
          />
          <MetricCard
            icon={<Zap size={18} />}
            label="10分钟首响率"
            value={metrics.firstResponseRate.toFixed(1)}
            unit="%"
            color="amber"
          />
          <MetricCard
            icon={<CalendarCheck size={18} />}
            label="预约率"
            value={metrics.bookingRate.toFixed(1)}
            unit="%"
            color="blue"
          />
          <MetricCard
            icon={<Building2 size={18} />}
            label="到院率"
            value={metrics.arrivalRate.toFixed(1)}
            unit="%"
            color="blue"
          />
          <MetricCard
            icon={<DollarSign size={18} />}
            label="成交金额"
            value={metrics.totalDealAmount}
            unit="¥"
            color="amber"
            format={(v) => Math.round(v).toLocaleString()}
          />
        </div>

        {targetProgress && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Target size={16} className="text-brand-text-muted" />
              <h3 className="text-sm font-medium text-brand-text-muted uppercase tracking-wider">目标进度</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button onClick={() => setSelectedTargetMetric('leads')} className="text-left bg-brand-card border border-brand-border rounded-xl p-5 hover:border-emerald-400/50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Target size={14} className="text-emerald-400" />
                    <span className="text-xs text-brand-text-muted">客资量目标</span>
                  </div>
                  {targetProgress.leads.onTrack ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-400"><TrendingUp size={12} />预计达标</span>
                  ) : targetProgress.leads.progress < 0.5 ? (
                    <span className="flex items-center gap-1 text-xs text-red-400"><AlertTriangle size={12} />预计不达标</span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-red-400"><TrendingDown size={12} />预计不达标</span>
                  )}
                </div>
                <div className="text-xl font-bold text-brand-text-primary mb-3">
                  {targetProgress.leads.current.toLocaleString()} / {targetProgress.leads.target.toLocaleString()}
                </div>
                <div className="h-2 bg-brand-border rounded-full overflow-hidden mb-3">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      targetProgress.leads.onTrack ? 'bg-emerald-500' : targetProgress.leads.progress >= 0.6 ? 'bg-amber-500' : 'bg-red-500'
                    )}
                    style={{ width: `${targetProgress.leads.progress * 100}%` }}
                  />
                </div>
                <div className={cn('text-xs mb-1', targetProgress.leads.onTrack ? 'text-emerald-400' : 'text-red-400')}>
                  按当前节奏预计月底: {targetProgress.leads.predicted.toLocaleString()}
                </div>
                <div className="text-xs text-brand-text-muted">
                  {targetProgress.leads.gap > 0 ? `还差 ${targetProgress.leads.gap.toLocaleString()}` : '已达标'}
                </div>
              </button>

              <button onClick={() => setSelectedTargetMetric('dealAmount')} className="text-left bg-brand-card border border-brand-border rounded-xl p-5 hover:border-amber-400/50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Target size={14} className="text-amber-400" />
                    <span className="text-xs text-brand-text-muted">成交金额目标</span>
                  </div>
                  {targetProgress.dealAmount.onTrack ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-400"><TrendingUp size={12} />预计达标</span>
                  ) : targetProgress.dealAmount.progress < 0.5 ? (
                    <span className="flex items-center gap-1 text-xs text-red-400"><AlertTriangle size={12} />预计不达标</span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-red-400"><TrendingDown size={12} />预计不达标</span>
                  )}
                </div>
                <div className="text-xl font-bold text-brand-text-primary mb-3">
                  ¥{Math.round(targetProgress.dealAmount.current).toLocaleString()} / ¥{targetProgress.dealAmount.target.toLocaleString()}
                </div>
                <div className="h-2 bg-brand-border rounded-full overflow-hidden mb-3">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      targetProgress.dealAmount.onTrack ? 'bg-emerald-500' : targetProgress.dealAmount.progress >= 0.6 ? 'bg-amber-500' : 'bg-red-500'
                    )}
                    style={{ width: `${targetProgress.dealAmount.progress * 100}%` }}
                  />
                </div>
                <div className={cn('text-xs mb-1', targetProgress.dealAmount.onTrack ? 'text-emerald-400' : 'text-red-400')}>
                  按当前节奏预计月底: ¥{targetProgress.dealAmount.predicted.toLocaleString()}
                </div>
                <div className="text-xs text-brand-text-muted">
                  {targetProgress.dealAmount.gap > 0 ? `还差 ¥${Math.round(targetProgress.dealAmount.gap).toLocaleString()}` : '已达标'}
                </div>
              </button>

              <button onClick={() => setSelectedTargetMetric('validRate')} className="text-left bg-brand-card border border-brand-border rounded-xl p-5 hover:border-blue-400/50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Target size={14} className="text-blue-400" />
                    <span className="text-xs text-brand-text-muted">有效率目标</span>
                  </div>
                  {targetProgress.validRate.onTrack ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-400"><TrendingUp size={12} />预计达标</span>
                  ) : targetProgress.validRate.progress < 0.5 ? (
                    <span className="flex items-center gap-1 text-xs text-red-400"><AlertTriangle size={12} />预计不达标</span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-red-400"><TrendingDown size={12} />预计不达标</span>
                  )}
                </div>
                <div className="text-xl font-bold text-brand-text-primary mb-3">
                  {(targetProgress.validRate.current * 100).toFixed(1)}% / {(targetProgress.validRate.target * 100).toFixed(1)}%
                </div>
                <div className="h-2 bg-brand-border rounded-full overflow-hidden mb-3">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      targetProgress.validRate.onTrack ? 'bg-emerald-500' : targetProgress.validRate.progress >= 0.6 ? 'bg-amber-500' : 'bg-red-500'
                    )}
                    style={{ width: `${targetProgress.validRate.progress * 100}%` }}
                  />
                </div>
                <div className={cn('text-xs mb-1', targetProgress.validRate.onTrack ? 'text-emerald-400' : 'text-red-400')}>
                  当月有效率: {(targetProgress.validRate.current * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-brand-text-muted">
                  {targetProgress.validRate.gap > 0 ? `还差 ${(targetProgress.validRate.gap * 100).toFixed(1)}%` : '已达标'}
                </div>
              </button>
            </div>

            {selectedTargetMetric && breakdownChartData.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 bg-brand-card border border-brand-border rounded-xl p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Target size={14} className={
                      selectedTargetMetric === 'leads' ? 'text-emerald-400' :
                      selectedTargetMetric === 'dealAmount' ? 'text-amber-400' : 'text-blue-400'
                    } />
                    <span className="text-sm font-medium text-brand-text-primary">
                      {selectedTargetMetric === 'leads' ? '客资量' : selectedTargetMetric === 'dealAmount' ? '成交金额' : '有效率'}每日明细
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedTargetMetric(null)}
                    className="p-1 rounded-md hover:bg-brand-border/50 text-brand-text-muted transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                <ResponsiveContainer width="100%" height={260}>
                  <ComposedChart data={breakdownChartData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={{ stroke: '#334155' }} />
                    <YAxis yAxisId="main" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={{ stroke: '#334155' }} />
                    <YAxis yAxisId="gap" orientation="right" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={{ stroke: '#334155' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1E293B',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#F1F5F9',
                        fontSize: 12,
                      }}
                      formatter={(value: number, name: string) => {
                        if (name === 'actual') return [selectedTargetMetric === 'validRate' ? `${(value * 100).toFixed(1)}%` : value.toLocaleString(), '实际']
                        if (name === 'expected') return [selectedTargetMetric === 'validRate' ? `${(value * 100).toFixed(1)}%` : Math.round(value).toLocaleString(), '期望']
                        if (name === 'cumGap') return [Math.round(value).toLocaleString(), '累计缺口']
                        return [value, name]
                      }}
                    />
                    <Bar yAxisId="main" dataKey="actual" fill={
                      selectedTargetMetric === 'leads' ? '#10B981' :
                      selectedTargetMetric === 'dealAmount' ? '#F59E0B' : '#3B82F6'
                    } fillOpacity={0.7} radius={[2, 2, 0, 0]} barSize={16} />
                    {selectedTargetMetric === 'validRate' ? (
                      <ReferenceLine yAxisId="main" y={monthTarget.validRate} stroke="#F59E0B" strokeDasharray="6 3" label={{ value: '目标', fill: '#F59E0B', fontSize: 11 }} />
                    ) : (
                      <Line yAxisId="main" type="monotone" dataKey="expected" stroke="#F59E0B" strokeDasharray="6 3" dot={false} strokeWidth={1.5} />
                    )}
                    <Area yAxisId="gap" type="monotone" dataKey="cumGap" fill="#EF4444" fillOpacity={0.15} stroke="#EF4444" strokeOpacity={0.4} strokeWidth={1} />
                  </ComposedChart>
                </ResponsiveContainer>

                <div className="flex items-center gap-6 mt-3 pt-3 border-t border-brand-border text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-brand-text-muted">累计实际:</span>
                    <span className="text-brand-text-primary font-medium">
                      {selectedTargetMetric === 'validRate'
                        ? `${(breakdownChartData[breakdownChartData.length - 1].cumActual * 100).toFixed(1)}%`
                        : selectedTargetMetric === 'dealAmount'
                          ? `¥${Math.round(breakdownChartData[breakdownChartData.length - 1].cumActual).toLocaleString()}`
                          : breakdownChartData[breakdownChartData.length - 1].cumActual.toLocaleString()
                      }
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-brand-text-muted">累计应完成:</span>
                    <span className="text-brand-text-primary font-medium">
                      {selectedTargetMetric === 'validRate'
                        ? `${(breakdownChartData[breakdownChartData.length - 1].cumExpected * 100).toFixed(1)}%`
                        : selectedTargetMetric === 'dealAmount'
                          ? `¥${Math.round(breakdownChartData[breakdownChartData.length - 1].cumExpected).toLocaleString()}`
                          : Math.round(breakdownChartData[breakdownChartData.length - 1].cumExpected).toLocaleString()
                      }
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-brand-text-muted">累计缺口:</span>
                    <span className={cn(
                      'font-medium',
                      breakdownChartData[breakdownChartData.length - 1].cumGap > 0 ? 'text-red-400' : 'text-emerald-400'
                    )}>
                      {selectedTargetMetric === 'validRate'
                        ? `${(Math.abs(breakdownChartData[breakdownChartData.length - 1].cumGap) * 100).toFixed(1)}%`
                        : selectedTargetMetric === 'dealAmount'
                          ? `¥${Math.round(Math.abs(breakdownChartData[breakdownChartData.length - 1].cumGap)).toLocaleString()}`
                          : Math.round(Math.abs(breakdownChartData[breakdownChartData.length - 1].cumGap)).toLocaleString()
                      }
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-brand-card border border-brand-border rounded-xl p-5">
            <h3 className="text-sm font-medium text-brand-text-muted uppercase tracking-wider mb-4">
              渠道客资量排名
            </h3>
            <ResponsiveContainer width="100%" height={channelRanking.length * 48}>
              <BarChart data={channelRanking} layout="vertical" margin={{ left: 60, right: 20, top: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: '#94A3B8', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#F1F5F9',
                    fontSize: 12,
                  }}
                  formatter={(value: number) => [`${value} 条`, '客资量']}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                  {channelRanking.map((entry, index) => (
                    <Cell key={index} fill={entry.color} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-brand-card border border-brand-border rounded-xl p-5">
            <h3 className="text-sm font-medium text-brand-text-muted uppercase tracking-wider mb-4">
              项目转化快照
            </h3>
            <div className="flex justify-center">
              <FunnelChart stages={funnelStages} width={400} height={280} />
            </div>
          </div>
        </div>
      </div>

      {activeAlerts.length > 0 && (
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          className="fixed bottom-0 left-0 right-0 z-50"
        >
          <div
            onClick={() => navigate('/alert')}
            className={cn(
              'bg-brand-red/10 border-t border-brand-red/30 backdrop-blur-sm',
              'px-6 py-3 flex items-center gap-3 cursor-pointer',
              'hover:bg-brand-red/15 transition-colors'
            )}
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-red opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-red" />
            </span>
            <div className="overflow-hidden flex-1">
              <motion.div
                animate={{ x: ['0%', '-50%'] }}
                transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}
                className="whitespace-nowrap text-sm text-brand-red font-medium"
              >
                <span className="pr-16">{alertText}</span>
                <span className="pr-16">{alertText}</span>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </PageWrapper>
  )
}
