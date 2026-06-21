import { useState, useMemo } from 'react'
import { ChevronDown } from 'lucide-react'
import PageWrapper from '@/components/Layout/PageWrapper'
import FunnelChart from '@/components/Charts/FunnelChart'
import RingChart from '@/components/Charts/RingChart'
import Badge from '@/components/UI/Badge'
import { projects, dailyProjectStats, lostReasons } from '@/data/projects'

const ALL_PROJECTS = 'all'
const ALL_OPTION = { id: ALL_PROJECTS, name: '全部项目', color: '#00D4AA' }
const projectOptions = [ALL_OPTION, ...projects]

const RING_COLORS = ['#FF6B6B', '#F5A623', '#4A90D9', '#A78BFA', '#00D4AA', '#FF9FF3', '#54A0FF', '#5F27CD']

export default function FunnelPage() {
  const [selectedProject, setSelectedProject] = useState(ALL_PROJECTS)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const selectedName = projectOptions.find(p => p.id === selectedProject)?.name ?? '全部项目'

  const funnelStages = useMemo(() => {
    const filtered = selectedProject === ALL_PROJECTS
      ? dailyProjectStats
      : dailyProjectStats.filter(s => s.projectId === selectedProject)

    const leads = filtered.reduce((s, d) => s + d.leads, 0)
    const booked = filtered.reduce((s, d) => s + d.booked, 0)
    const arrived = filtered.reduce((s, d) => s + d.arrived, 0)
    const closed = filtered.reduce((s, d) => s + d.closed, 0)

    const bookingRate = leads > 0 ? (booked / leads * 100).toFixed(1) + '%' : '-'
    const arrivalRate = booked > 0 ? (arrived / booked * 100).toFixed(1) + '%' : '-'
    const closeRate = arrived > 0 ? (closed / arrived * 100).toFixed(1) + '%' : '-'

    return [
      { name: '线索', value: leads, rate: undefined },
      { name: '预约', value: booked, rate: bookingRate },
      { name: '到院', value: arrived, rate: arrivalRate },
      { name: '成交', value: closed, rate: closeRate },
    ]
  }, [selectedProject])

  const filteredLostReasons = useMemo(() => {
    const reasons = selectedProject === ALL_PROJECTS
      ? lostReasons
      : lostReasons.filter(r => r.projectId === selectedProject)

    const merged = new Map<string, number>()
    for (const r of reasons) {
      merged.set(r.reason, (merged.get(r.reason) ?? 0) + r.count)
    }

    return Array.from(merged.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
  }, [selectedProject])

  const ringData = useMemo(() => {
    return filteredLostReasons.slice(0, 6).map((r, i) => ({
      name: r.reason,
      value: r.count,
      color: RING_COLORS[i % RING_COLORS.length],
    }))
  }, [filteredLostReasons])

  const lostTotal = filteredLostReasons.reduce((s, r) => s + r.count, 0)

  const comparisonRows = useMemo(() => {
    const rows = projects.map(p => {
      const stats = dailyProjectStats.filter(s => s.projectId === p.id)
      const leads = stats.reduce((s, d) => s + d.leads, 0)
      const booked = stats.reduce((s, d) => s + d.booked, 0)
      const arrived = stats.reduce((s, d) => s + d.arrived, 0)
      const closed = stats.reduce((s, d) => s + d.closed, 0)
      const dealAmount = stats.reduce((s, d) => s + d.dealAmount, 0)
      const bookingRate = leads > 0 ? booked / leads : 0
      const arrivalRate = booked > 0 ? arrived / booked : 0
      const closeRate = arrived > 0 ? closed / arrived : 0
      const unitPrice = closed > 0 ? dealAmount / closed : 0
      return { ...p, leads, bookingRate, arrivalRate, closeRate, unitPrice, dealAmount }
    })

    const avgLeads = rows.reduce((s, r) => s + r.leads, 0) / rows.length
    const avgBookingRate = rows.reduce((s, r) => s + r.bookingRate, 0) / rows.length
    const avgArrivalRate = rows.reduce((s, r) => s + r.arrivalRate, 0) / rows.length
    const avgCloseRate = rows.reduce((s, r) => s + r.closeRate, 0) / rows.length
    const avgUnitPrice = rows.reduce((s, r) => s + r.unitPrice, 0) / rows.length
    const avgDealAmount = rows.reduce((s, r) => s + r.dealAmount, 0) / rows.length

    return { rows, averages: { avgLeads, avgBookingRate, avgArrivalRate, avgCloseRate, avgUnitPrice, avgDealAmount } }
  }, [])

  const maxLostCount = filteredLostReasons.length > 0 ? filteredLostReasons[0].count : 1

  return (
    <PageWrapper>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-brand-text-primary">项目漏斗分析</h1>
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-card border border-brand-border text-sm text-brand-text-primary hover:border-brand-border-light transition-colors"
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: projectOptions.find(p => p.id === selectedProject)?.color }} />
              {selectedName}
              <ChevronDown className="w-4 h-4 text-brand-text-muted" />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-1 z-10 min-w-[160px] rounded-lg bg-brand-card border border-brand-border shadow-lg shadow-black/30 py-1">
                {projectOptions.map(p => (
                  <button
                    key={p.id}
                    onClick={() => { setSelectedProject(p.id); setDropdownOpen(false) }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-brand-text-primary hover:bg-brand-card-hover transition-colors"
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="section-title">项目转化漏斗</h2>
          <div className="flex justify-center">
            <FunnelChart stages={funnelStages} width={480} height={320} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="section-title">流失原因分布</h2>
            {ringData.length > 0 ? (
              <RingChart
                data={ringData}
                size={200}
                strokeWidth={24}
                centerLabel="流失总数"
                centerValue={lostTotal.toLocaleString()}
              />
            ) : (
              <div className="flex items-center justify-center h-[260px] text-brand-text-muted text-sm">暂无数据</div>
            )}
          </div>

          <div className="card">
            <h2 className="section-title">流失原因详情</h2>
            <div className="flex flex-wrap gap-2">
              {filteredLostReasons.map(r => {
                const ratio = r.count / maxLostCount
                const variant: 'red' | 'amber' | 'gray' = ratio > 0.7 ? 'red' : ratio > 0.4 ? 'amber' : 'gray'
                const size: 'md' | 'sm' = ratio > 0.5 ? 'md' : 'sm'
                return (
                  <Badge key={r.reason} variant={variant} size={size}>
                    {r.reason}
                    <span className="ml-1 font-mono opacity-70">{r.count}</span>
                  </Badge>
                )
              })}
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="section-title">项目对比表</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border">
                  <th className="text-left py-3 px-4 text-brand-text-muted font-medium">项目名</th>
                  <th className="text-right py-3 px-4 text-brand-text-muted font-medium">线索数</th>
                  <th className="text-right py-3 px-4 text-brand-text-muted font-medium">预约率</th>
                  <th className="text-right py-3 px-4 text-brand-text-muted font-medium">到院率</th>
                  <th className="text-right py-3 px-4 text-brand-text-muted font-medium">成交率</th>
                  <th className="text-right py-3 px-4 text-brand-text-muted font-medium">客单价</th>
                  <th className="text-right py-3 px-4 text-brand-text-muted font-medium">成交金额</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.rows.map(row => {
                  const belowAvg = {
                    leads: row.leads < comparisonRows.averages.avgLeads,
                    bookingRate: row.bookingRate < comparisonRows.averages.avgBookingRate,
                    arrivalRate: row.arrivalRate < comparisonRows.averages.avgArrivalRate,
                    closeRate: row.closeRate < comparisonRows.averages.avgCloseRate,
                    unitPrice: row.unitPrice < comparisonRows.averages.avgUnitPrice,
                    dealAmount: row.dealAmount < comparisonRows.averages.avgDealAmount,
                  }

                  const cellCls = (isBelow: boolean) =>
                    `text-right py-3 px-4 font-mono ${isBelow ? 'bg-brand-red/10 text-brand-red' : 'text-brand-text-primary'}`

                  return (
                    <tr key={row.id} className="border-b border-brand-border/50 hover:bg-brand-card-hover transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: row.color }} />
                          <span className="text-brand-text-primary">{row.name}</span>
                        </div>
                      </td>
                      <td className={cellCls(belowAvg.leads)}>{row.leads.toLocaleString()}</td>
                      <td className={cellCls(belowAvg.bookingRate)}>{(row.bookingRate * 100).toFixed(1)}%</td>
                      <td className={cellCls(belowAvg.arrivalRate)}>{(row.arrivalRate * 100).toFixed(1)}%</td>
                      <td className={cellCls(belowAvg.closeRate)}>{(row.closeRate * 100).toFixed(1)}%</td>
                      <td className={cellCls(belowAvg.unitPrice)}>¥{Math.round(row.unitPrice).toLocaleString()}</td>
                      <td className={cellCls(belowAvg.dealAmount)}>¥{row.dealAmount.toLocaleString()}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
