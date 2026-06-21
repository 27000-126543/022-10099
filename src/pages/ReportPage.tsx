import { useState, useRef, useMemo } from 'react'
import { Download, ChevronDown, TrendingUp, TrendingDown, Users, DollarSign, Target, CalendarCheck, MapPin, RefreshCw } from 'lucide-react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import PageWrapper from '@/components/Layout/PageWrapper'
import Sparkline from '@/components/Charts/Sparkline'
import Badge from '@/components/UI/Badge'
import { monthlyReports, getLatestMonth, getPreviousMonth } from '@/data/reports'
import { channels, dailyChannelStats } from '@/data/channels'
import { projects, dailyProjectStats } from '@/data/projects'
import { consultants, consultantDaily } from '@/data/consultants'

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
  const [selectedMonth, setSelectedMonth] = useState(getLatestMonth().month)
  const reportRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState(false)

  const currentIdx = monthlyReports.findIndex(r => r.month === selectedMonth)
  const current = monthlyReports[currentIdx]
  const previous = currentIdx > 0 ? monthlyReports[currentIdx - 1] : null
  const sparkMonths = monthlyReports.slice(Math.max(0, currentIdx - 5), currentIdx + 1)

  const maxLeads = Math.max(...monthlyReports.map(r => r.totalLeads))
  const maxDeal = Math.max(...monthlyReports.map(r => r.totalDealAmount))

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

  const momMetrics = [
    { key: '客资量', curr: current.totalLeads, prev: previous?.totalLeads, spark: sparkMonths.map(r => r.totalLeads), fmt: (v: number) => v.toLocaleString(), sparkColor: '#4A90D9' },
    { key: '有效率', curr: current.validRate, prev: previous?.validRate, spark: sparkMonths.map(r => r.validRate), fmt: (v: number) => (v * 100).toFixed(1) + '%', sparkColor: '#FFB347' },
    { key: '预约率', curr: current.bookingRate, prev: previous?.bookingRate, spark: sparkMonths.map(r => r.bookingRate), fmt: (v: number) => (v * 100).toFixed(1) + '%', sparkColor: '#4ECDC4' },
    { key: '到院率', curr: current.arrivalRate, prev: previous?.arrivalRate, spark: sparkMonths.map(r => r.arrivalRate), fmt: (v: number) => (v * 100).toFixed(1) + '%', sparkColor: '#FF6B6B' },
    { key: '成交金额', curr: current.totalDealAmount, prev: previous?.totalDealAmount, spark: sparkMonths.map(r => r.totalDealAmount), fmt: (v: number) => fmtWan(v), sparkColor: '#00D4AA' },
    { key: '复购率', curr: current.repeatPurchaseRate, prev: previous?.repeatPurchaseRate, spark: sparkMonths.map(r => r.repeatPurchaseRate), fmt: (v: number) => (v * 100).toFixed(1) + '%', sparkColor: '#A78BFA' },
    { key: '转介绍率', curr: current.referralRate, prev: previous?.referralRate, spark: sparkMonths.map(r => r.referralRate), fmt: (v: number) => (v * 100).toFixed(1) + '%', sparkColor: '#FF8FA3' },
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
      <div ref={reportRef} className="space-y-6 pb-20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-brand-text-primary">月度复盘报告</h1>
            <p className="text-sm text-brand-text-muted mt-1">{selectedMonth} 数据概览</p>
          </div>
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
          <h2 className="text-lg font-bold text-brand-text-primary mb-4">环比对比</h2>
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-6 pb-3 border-b border-brand-border text-xs text-brand-text-muted font-medium">
            <span>指标</span>
            <span>当月</span>
            <span>上月</span>
            <span>变化</span>
            <span>趋势</span>
          </div>
          {momMetrics.map(m => {
            const change = calcChange(m.curr, m.prev)
            const isPositive = change >= 0
            return (
              <div key={m.key} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-6 py-3 border-b border-brand-border/50 items-center">
                <span className="text-sm text-brand-text-primary font-medium">{m.key}</span>
                <span className="font-mono text-sm text-brand-text-primary">{m.fmt(m.curr)}</span>
                <span className="font-mono text-sm text-brand-text-muted">{m.prev !== undefined ? m.fmt(m.prev) : '-'}</span>
                <Badge variant={isPositive ? 'emerald' : 'red'} size="sm">
                  {isPositive ? <TrendingUp size={12} className="mr-0.5" /> : <TrendingDown size={12} className="mr-0.5" />}
                  {isPositive ? '+' : ''}{change}%
                </Badge>
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
