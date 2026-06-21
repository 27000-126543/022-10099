import { useState, useRef, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { Download, ChevronDown, TrendingUp, TrendingDown, Users, DollarSign, Target, CalendarCheck, MapPin, RefreshCw, Settings, Copy, Percent } from 'lucide-react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import PageWrapper from '@/components/Layout/PageWrapper'
import Sparkline from '@/components/Charts/Sparkline'
import Badge from '@/components/UI/Badge'
import { monthlyReports, getLatestMonth } from '@/data/reports'
import { channels, dailyChannelStats } from '@/data/channels'
import { projects, dailyProjectStats } from '@/data/projects'
import { consultants, consultantDaily } from '@/data/consultants'
import { loadTargets, saveTargets, getDefaultTargets, type MonthlyTarget } from '@/data/targets'
import Modal from '@/components/UI/Modal'

function fmtWan(v: number): string {
  if (v >= 100000000) return (v / 100000000).toFixed(2) + '亿'
  if (v >= 10000) return (v / 10000).toFixed(1) + '万'
  return v.toLocaleString()
}

function ProgressRing({ value, max, size = 80, strokeWidth = 6, color = '#00D4AA' }: {
  value: number; max: number; size?: number; strokeWidth?: number; color?: string
}) {
  const r = (size - strokeWidth) / 2
  const c = 2 * Math.PI * r
  const pct = Math.min(value / max, 1)
  const offset = c * (1 - pct)
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1E293B" strokeWidth={strokeWidth} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth} strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-700" />
    </svg>
  )
}

function KpiCard({ label, displayValue, value, target, color, icon, large = false }: {
  label: string; displayValue: string; value: number; target: number; color: string; icon: React.ReactNode; large?: boolean
}) {
  const ringSize = large ? 100 : 72
  const sw = large ? 8 : 6
  return (
    <div className="bg-brand-card border border-brand-border rounded-xl p-5 flex items-center gap-4">
      <div className="relative shrink-0">
        <ProgressRing value={value} max={target} size={ringSize} strokeWidth={sw} color={color} />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono text-xs text-brand-text-muted">{Math.round((value / target) * 100)}%</span>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span style={{ color }}>{icon}</span>
          <span className="text-xs text-brand-text-muted font-medium">{label}</span>
        </div>
        <div className={`font-mono font-bold text-brand-text-primary tracking-tight truncate ${large ? 'text-2xl' : 'text-xl'}`}>
          {displayValue}
        </div>
      </div>
    </div>
  )
}

function TargetCard({ label, current, target, originalTarget, color, icon, fmt }: {
  label: string; current: number; target: number; originalTarget?: number; color: string; icon: React.ReactNode; fmt: (v: number) => string
}) {
  const pct = Math.min(100, Math.round((current / target) * 100))
  const gap = target - current
  const isCompleted = current >= target
  const hasAdjust = originalTarget !== undefined && originalTarget !== target
  return (
    <div className="bg-brand-card border border-brand-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <span style={{ color }}>{icon}</span>
        <span className="text-sm font-medium text-brand-text-primary">{label}</span>
        {hasAdjust && (
          <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-brand-amber/15 text-brand-amber font-medium">
            已调整
          </span>
        )}
      </div>
      <div className="mb-4">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="font-mono text-2xl font-bold text-brand-text-primary">{fmt(current)}</span>
          <span className="text-xs text-brand-text-muted">/ {fmt(target)}</span>
        </div>
        <div className="h-2 bg-brand-border rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
        </div>
      </div>
      {hasAdjust && (
        <div className="mb-3 px-2.5 py-1.5 bg-brand-card-hover rounded-lg border border-brand-border/50">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-brand-text-muted">原目标</span>
            <span className="font-mono text-brand-text-muted line-through">{fmt(originalTarget!)}</span>
          </div>
          <div className="flex items-center justify-between text-[10px] mt-0.5">
            <span className="text-brand-text-muted">调整后</span>
            <span className="font-mono text-brand-amber">{fmt(target)}</span>
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-brand-text-muted mb-0.5">完成率</p>
          <p className="font-mono font-semibold" style={{ color }}>{pct}%</p>
        </div>
        <div>
          <p className="text-brand-text-muted mb-0.5">差额</p>
          <p className={`font-mono font-semibold ${isCompleted ? 'text-emerald-400' : 'text-brand-text-primary'}`}>
            {isCompleted ? '已达标' : fmt(gap)}
          </p>
        </div>
      </div>
    </div>
  )
}

const rankColors = ['text-yellow-400', 'text-gray-300', 'text-amber-600']

function RankItem({ rank, name, value, maxVal, color, fmtVal }: {
  rank: number; name: string; value: number; maxVal: number; color: string; fmtVal: string
}) {
  const pct = maxVal > 0 ? (value / maxVal) * 100 : 0
  return (
    <div className="flex items-center gap-3 py-2.5">
      <span className={`font-mono font-bold text-sm w-6 text-center ${rank < 3 ? rankColors[rank] : 'text-brand-text-muted'}`}>
        {rank + 1}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-brand-text-primary truncate">{name}</span>
          <span className="font-mono text-sm font-medium text-brand-text-primary ml-2">{fmtVal}</span>
        </div>
        <div className="h-1.5 bg-brand-border rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
        </div>
      </div>
    </div>
  )
}

export default function ReportPage() {
  const location = useLocation()
  const [selectedMonth, setSelectedMonth] = useState(
    (location.state as { month?: string })?.month ?? getLatestMonth().month
  )
  const reportRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState(false)
  const [targetConfig, setTargetConfig] = useState<MonthlyTarget[]>(() => loadTargets())
  const [targetModalOpen, setTargetModalOpen] = useState(false)
  const [editingTarget, setEditingTarget] = useState<MonthlyTarget | null>(null)

  const currentIdx = monthlyReports.findIndex(r => r.month === selectedMonth)
  const current = monthlyReports[currentIdx]
  const previous = currentIdx > 0 ? monthlyReports[currentIdx - 1] : null
  const sparkMonths = monthlyReports.slice(Math.max(0, currentIdx - 5), currentIdx + 1)

  const [year, month] = selectedMonth.split('-').map(Number)
  const sameMonthLastYear = monthlyReports.find(r => r.month === `${year - 1}-${String(month).padStart(2, '0')}`)

  const maxLeads = Math.max(...monthlyReports.map(r => r.totalLeads))
  const maxDeal = Math.max(...monthlyReports.map(r => r.totalDealAmount))

  const defaultTargetsList = getDefaultTargets()
  const monthDefaultTarget = defaultTargetsList.find(t => t.month === selectedMonth)
  const monthTarget = targetConfig.find(t => t.month === selectedMonth)
  const targets = {
    totalLeads: monthTarget?.totalLeads ?? current.totalLeads * 1.15,
    totalDealAmount: monthTarget?.totalDealAmount ?? current.totalDealAmount * 1.15,
    validRate: monthTarget?.validRate ?? Math.min(1, current.validRate * 1.1),
    repeatPurchaseRate: monthTarget?.repeatPurchaseRate ?? Math.min(1, current.repeatPurchaseRate * 1.1),
  }
  const originalTargets = {
    totalLeads: monthDefaultTarget?.totalLeads,
    totalDealAmount: monthDefaultTarget?.totalDealAmount,
    validRate: monthDefaultTarget?.validRate,
    repeatPurchaseRate: monthDefaultTarget?.repeatPurchaseRate,
  }

  const channelRoi = useMemo(() => {
    const ms = dailyChannelStats.filter(s => s.date.startsWith(selectedMonth))
    return channels
      .filter(ch => ch.dailyCost > 0)
      .map(ch => {
        const stats = ms.filter(s => s.channelId === ch.id)
        const totalDeal = stats.reduce((s, d) => s + d.dealAmount, 0)
        const days = new Set(stats.map(s => s.date)).size
        const totalCost = ch.dailyCost * days
        const roi = totalCost > 0 ? totalDeal / totalCost : 0
        return { name: ch.name, value: roi, color: ch.color }
      }).sort((a, b) => b.value - a.value)
  }, [selectedMonth])

  const projectConversion = useMemo(() => {
    const ms = dailyProjectStats.filter(s => s.date.startsWith(selectedMonth))
    return projects.map(p => {
      const stats = ms.filter(s => s.projectId === p.id)
      const totalLeads = stats.reduce((s, d) => s + d.leads, 0)
      const totalClosed = stats.reduce((s, d) => s + d.closed, 0)
      const rate = totalLeads > 0 ? totalClosed / totalLeads : 0
      return { name: p.name, value: rate, color: p.color }
    }).sort((a, b) => b.value - a.value)
  }, [selectedMonth])

  const consultantRanking = useMemo(() => {
    const ms = consultantDaily.filter(s => s.date.startsWith(selectedMonth))
    return consultants.map(c => {
      const stats = ms.filter(s => s.consultantId === c.id)
      const totalDeal = stats.reduce((s, d) => s + d.dealAmount, 0)
      return { name: c.name, value: totalDeal }
    }).sort((a, b) => b.value - a.value)
  }, [selectedMonth])

  const calcChange = (curr: number, prev: number | undefined) => {
    if (prev === undefined || prev === 0) return 0
    return +((curr - prev) / prev * 100).toFixed(1)
  }

  const yoyMetrics = [
    { key: '客资量', curr: current.totalLeads, prev: previous?.totalLeads, yoy: sameMonthLastYear?.totalLeads, spark: sparkMonths.map(r => r.totalLeads), fmt: (v: number) => v.toLocaleString(), sparkColor: '#4A90D9' },
    { key: '有效率', curr: current.validRate, prev: previous?.validRate, yoy: sameMonthLastYear?.validRate, spark: sparkMonths.map(r => r.validRate), fmt: (v: number) => (v * 100).toFixed(1) + '%', sparkColor: '#FFB347' },
    { key: '预约率', curr: current.bookingRate, prev: previous?.bookingRate, yoy: sameMonthLastYear?.bookingRate, spark: sparkMonths.map(r => r.bookingRate), fmt: (v: number) => (v * 100).toFixed(1) + '%', sparkColor: '#4ECDC4' },
    { key: '到院率', curr: current.arrivalRate, prev: previous?.arrivalRate, yoy: sameMonthLastYear?.arrivalRate, spark: sparkMonths.map(r => r.arrivalRate), fmt: (v: number) => (v * 100).toFixed(1) + '%', sparkColor: '#FF6B6B' },
    { key: '成交金额', curr: current.totalDealAmount, prev: previous?.totalDealAmount, yoy: sameMonthLastYear?.totalDealAmount, spark: sparkMonths.map(r => r.totalDealAmount), fmt: (v: number) => fmtWan(v), sparkColor: '#00D4AA' },
    { key: '复购率', curr: current.repeatPurchaseRate, prev: previous?.repeatPurchaseRate, yoy: sameMonthLastYear?.repeatPurchaseRate, spark: sparkMonths.map(r => r.repeatPurchaseRate), fmt: (v: number) => (v * 100).toFixed(1) + '%', sparkColor: '#A78BFA' },
    { key: '转介绍率', curr: current.referralRate, prev: previous?.referralRate, yoy: sameMonthLastYear?.referralRate, spark: sparkMonths.map(r => r.referralRate), fmt: (v: number) => (v * 100).toFixed(1) + '%', sparkColor: '#FF8FA3' },
  ]

  const handleExport = async () => {
    if (!reportRef.current) return
    setExporting(true)
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`月度报告_${selectedMonth}.pdf`)
    } finally {
      setExporting(false)
    }
  }

  return (
    <PageWrapper>
      <div ref={reportRef} id="report-content" className="space-y-6 pb-20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-brand-text-primary">月度复盘报告</h1>
            <p className="text-sm text-brand-text-muted mt-1">{selectedMonth} 数据概览</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const existing = targetConfig.find(t => t.month === selectedMonth)
                setEditingTarget(existing ?? { month: selectedMonth, totalLeads: 0, totalDealAmount: 0, validRate: 0, repeatPurchaseRate: 0 })
                setTargetModalOpen(true)
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-brand-card border border-brand-border text-brand-text-muted rounded-lg text-sm hover:text-brand-text-primary hover:border-brand-emerald/50 transition-colors"
            >
              <Settings size={15} />
              配置目标
            </button>
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="appearance-none bg-brand-card border border-brand-border text-brand-text-primary rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-brand-emerald/50 cursor-pointer"
              >
                {monthlyReports.map(r => (
                  <option key={r.month} value={r.month}>{r.month}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-text-muted pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <KpiCard label="总客资量" displayValue={current.totalLeads.toLocaleString()} value={current.totalLeads} target={maxLeads * 1.15} color="#4A90D9" icon={<Users size={16} />} large />
          <KpiCard label="总成交金额" displayValue={fmtWan(current.totalDealAmount)} value={current.totalDealAmount} target={maxDeal * 1.15} color="#00D4AA" icon={<DollarSign size={16} />} large />
          <KpiCard label="有效率" displayValue={(current.validRate * 100).toFixed(1) + '%'} value={current.validRate} target={1} color="#FFB347" icon={<Target size={16} />} large />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <KpiCard label="预约率" displayValue={(current.bookingRate * 100).toFixed(1) + '%'} value={current.bookingRate} target={1} color="#4ECDC4" icon={<CalendarCheck size={16} />} />
          <KpiCard label="到院率" displayValue={(current.arrivalRate * 100).toFixed(1) + '%'} value={current.arrivalRate} target={1} color="#FF6B6B" icon={<MapPin size={16} />} />
          <KpiCard label="复购贡献率" displayValue={(current.repeatPurchaseRate * 100).toFixed(1) + '%'} value={current.repeatPurchaseRate} target={1} color="#A78BFA" icon={<RefreshCw size={16} />} />
        </div>

        <div className="bg-brand-card border border-brand-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Target size={20} className="text-brand-emerald" />
            <h2 className="text-lg font-bold text-brand-text-primary">目标完成情况</h2>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <TargetCard
              label="总客资量"
              current={current.totalLeads}
              target={targets.totalLeads}
              originalTarget={originalTargets.totalLeads}
              color="#4A90D9"
              icon={<Users size={18} />}
              fmt={v => v.toLocaleString()}
            />
            <TargetCard
              label="总成交金额"
              current={current.totalDealAmount}
              target={targets.totalDealAmount}
              originalTarget={originalTargets.totalDealAmount}
              color="#00D4AA"
              icon={<DollarSign size={18} />}
              fmt={v => fmtWan(v)}
            />
            <TargetCard
              label="有效率"
              current={current.validRate}
              target={targets.validRate}
              originalTarget={originalTargets.validRate}
              color="#FFB347"
              icon={<Target size={18} />}
              fmt={v => (v * 100).toFixed(1) + '%'}
            />
            <TargetCard
              label="复购贡献率"
              current={current.repeatPurchaseRate}
              target={targets.repeatPurchaseRate}
              originalTarget={originalTargets.repeatPurchaseRate}
              color="#A78BFA"
              icon={<RefreshCw size={18} />}
              fmt={v => (v * 100).toFixed(1) + '%'}
            />
          </div>
        </div>

        <div className="bg-brand-card border border-brand-border rounded-xl p-5">
          <h2 className="text-lg font-bold text-brand-text-primary mb-4">环比与同比对比</h2>
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-x-6 pb-3 border-b border-brand-border text-xs text-brand-text-muted font-medium">
            <span>指标</span>
            <span>当月</span>
            <span>上月</span>
            <span>环比</span>
            <span>同比</span>
            <span>趋势</span>
          </div>
          {yoyMetrics.map(m => {
            const momChange = calcChange(m.curr, m.prev)
            const momPositive = momChange >= 0
            const yoyChange = calcChange(m.curr, m.yoy)
            const yoyPositive = yoyChange >= 0
            const hasYoy = m.yoy !== undefined
            return (
              <div key={m.key} className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-x-6 py-3 border-b border-brand-border/50 items-center">
                <span className="text-sm text-brand-text-primary font-medium">{m.key}</span>
                <span className="font-mono text-sm text-brand-text-primary">{m.fmt(m.curr)}</span>
                <span className="font-mono text-sm text-brand-text-muted">{m.prev !== undefined ? m.fmt(m.prev) : '-'}</span>
                <Badge variant={momPositive ? 'emerald' : 'red'} size="sm">
                  {momPositive ? <TrendingUp size={12} className="mr-0.5" /> : <TrendingDown size={12} className="mr-0.5" />}
                  {momPositive ? '+' : ''}{momChange}%
                </Badge>
                {hasYoy ? (
                  <Badge variant={yoyPositive ? 'emerald' : 'red'} size="sm">
                    {yoyPositive ? <TrendingUp size={12} className="mr-0.5" /> : <TrendingDown size={12} className="mr-0.5" />}
                    {yoyPositive ? '+' : ''}{yoyChange}%
                  </Badge>
                ) : (
                  <span className="font-mono text-sm text-brand-text-muted">-</span>
                )}
                <Sparkline data={m.spark} color={m.sparkColor} width={80} height={30} showArea />
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-brand-card border border-brand-border rounded-xl p-5">
            <h3 className="text-sm font-bold text-brand-text-primary mb-3">渠道ROI排名</h3>
            {channelRoi.length > 0 ? channelRoi.slice(0, 5).map((item, i) => (
              <RankItem key={item.name} rank={i} name={item.name} value={item.value} maxVal={channelRoi[0].value} color={item.color} fmtVal={item.value.toFixed(2)} />
            )) : <p className="text-sm text-brand-text-muted">暂无数据</p>}
          </div>

          <div className="bg-brand-card border border-brand-border rounded-xl p-5">
            <h3 className="text-sm font-bold text-brand-text-primary mb-3">项目转化率排名</h3>
            {projectConversion.length > 0 ? projectConversion.slice(0, 5).map((item, i) => (
              <RankItem key={item.name} rank={i} name={item.name} value={item.value} maxVal={projectConversion[0].value} color={item.color} fmtVal={(item.value * 100).toFixed(1) + '%'} />
            )) : <p className="text-sm text-brand-text-muted">暂无数据</p>}
          </div>

          <div className="bg-brand-card border border-brand-border rounded-xl p-5">
            <h3 className="text-sm font-bold text-brand-text-primary mb-3">顾问成交额排名</h3>
            {consultantRanking.length > 0 ? consultantRanking.slice(0, 5).map((item, i) => (
              <RankItem key={item.name} rank={i} name={item.name} value={item.value} maxVal={consultantRanking[0].value} color="#00D4AA" fmtVal={fmtWan(item.value)} />
            )) : <p className="text-sm text-brand-text-muted">暂无数据</p>}
          </div>
        </div>
      </div>

      <Modal
        isOpen={targetModalOpen}
        onClose={() => setTargetModalOpen(false)}
        title={`配置目标 - ${editingTarget?.month ?? selectedMonth}`}
      >
        {editingTarget && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const prevMonthIdx = monthlyReports.findIndex(r => r.month === selectedMonth)
                  if (prevMonthIdx <= 0) return
                  const prevMonth = monthlyReports[prevMonthIdx - 1].month
                  const prevTarget = targetConfig.find(t => t.month === prevMonth) ?? getDefaultTargets().find(t => t.month === prevMonth)
                  if (prevTarget) {
                    setEditingTarget({ ...editingTarget, totalLeads: prevTarget.totalLeads, totalDealAmount: prevTarget.totalDealAmount, validRate: prevTarget.validRate, repeatPurchaseRate: prevTarget.repeatPurchaseRate })
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-brand-card-hover border border-brand-border text-brand-text-muted hover:text-brand-text-primary hover:border-brand-emerald/50 transition-colors"
              >
                <Copy size={12} />
                复制上月目标
              </button>
              <button
                onClick={() => {
                  const pctStr = prompt('输入批量调整百分比（如 10 表示上调10%，-5 表示下调5%）')
                  if (pctStr === null) return
                  const pctVal = parseFloat(pctStr)
                  if (isNaN(pctVal)) return
                  const factor = 1 + pctVal / 100
                  setEditingTarget({
                    ...editingTarget,
                    totalLeads: Math.round(editingTarget.totalLeads * factor),
                    totalDealAmount: Math.round(editingTarget.totalDealAmount * factor),
                    validRate: Math.min(1, parseFloat((editingTarget.validRate * factor).toFixed(4))),
                    repeatPurchaseRate: Math.min(1, parseFloat((editingTarget.repeatPurchaseRate * factor).toFixed(4))),
                  })
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-brand-card-hover border border-brand-border text-brand-text-muted hover:text-brand-text-primary hover:border-brand-amber/50 transition-colors"
              >
                <Percent size={12} />
                批量调整百分比
              </button>
            </div>
            <div>
              <label className="block text-sm text-brand-text-muted mb-1">客资目标</label>
              <input
                type="number"
                value={editingTarget.totalLeads || ''}
                onChange={e => setEditingTarget({ ...editingTarget, totalLeads: Number(e.target.value) })}
                className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-emerald/50"
              />
            </div>
            <div>
              <label className="block text-sm text-brand-text-muted mb-1">成交目标(元)</label>
              <input
                type="number"
                value={editingTarget.totalDealAmount || ''}
                onChange={e => setEditingTarget({ ...editingTarget, totalDealAmount: Number(e.target.value) })}
                className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-emerald/50"
              />
            </div>
            <div>
              <label className="block text-sm text-brand-text-muted mb-1">有效率目标(%)</label>
              <input
                type="number"
                step="0.1"
                value={editingTarget.validRate ? (editingTarget.validRate * 100).toFixed(1) : ''}
                onChange={e => setEditingTarget({ ...editingTarget, validRate: Number(e.target.value) / 100 })}
                className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-emerald/50"
              />
            </div>
            <div>
              <label className="block text-sm text-brand-text-muted mb-1">复购目标(%)</label>
              <input
                type="number"
                step="0.1"
                value={editingTarget.repeatPurchaseRate ? (editingTarget.repeatPurchaseRate * 100).toFixed(1) : ''}
                onChange={e => setEditingTarget({ ...editingTarget, repeatPurchaseRate: Number(e.target.value) / 100 })}
                className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-emerald/50"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setTargetModalOpen(false)}
                className="px-4 py-2 text-sm text-brand-text-muted hover:text-brand-text-primary transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  const updated = [...targetConfig]
                  const idx = updated.findIndex(t => t.month === editingTarget.month)
                  if (idx >= 0) {
                    updated[idx] = editingTarget
                  } else {
                    updated.push(editingTarget)
                  }
                  saveTargets(updated)
                  setTargetConfig(updated)
                  setTargetModalOpen(false)
                }}
                className="px-4 py-2 text-sm bg-brand-emerald text-white rounded-lg hover:bg-brand-emerald/90 transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        )}
      </Modal>

      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 px-5 py-3 bg-brand-emerald text-white font-medium rounded-xl shadow-lg hover:bg-brand-emerald/90 transition-colors disabled:opacity-50"
        >
          <Download size={18} />
          {exporting ? '导出中...' : '导出PDF报告'}
        </button>
      </div>
    </PageWrapper>
  )
}
