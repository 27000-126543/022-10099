import { useState, useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  Legend,
} from 'recharts'
import { Users, Clock, Filter, Repeat, UserPlus } from 'lucide-react'
import PageWrapper from '@/components/Layout/PageWrapper'
import MetricCard from '@/components/UI/MetricCard'
import Badge from '@/components/UI/Badge'
import HeatmapChart from '@/components/Charts/HeatmapChart'
import FunnelChart from '@/components/Charts/FunnelChart'
import RingChart from '@/components/Charts/RingChart'
import { consultants, consultantDaily } from '@/data/consultants'

const RESPONSE_BUCKETS = [
  { label: '<5分钟', min: 0, max: 5 },
  { label: '5-10分钟', min: 5, max: 10 },
  { label: '10-30分钟', min: 10, max: 30 },
  { label: '>30分钟', min: 30, max: Infinity },
]

export default function PersonnelPage() {
  const [selectedConsultantId, setSelectedConsultantId] = useState(consultants[0].id)

  const heatmapData = useMemo(() => {
    const today = new Date()
    const dates: string[] = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      dates.push(d.toISOString().split('T')[0])
    }

    const xLabels = dates.map(d => {
      const parts = d.split('-')
      return `${parts[1]}-${parts[2]}`
    })
    const yLabels = consultants.map(c => c.name)

    const data = dates.flatMap(date =>
      consultants.map(c => {
        const record = consultantDaily.find(r => r.consultantId === c.id && r.date === date)
        return { x: `${date.split('-')[1]}-${date.split('-')[2]}`, y: c.name, value: record?.activeLeads ?? 0 }
      })
    )

    return { data, xLabels, yLabels }
  }, [])

  const responseData = useMemo(() => {
    const avgByConsultant = consultants.map(c => {
      const records = consultantDaily.filter(r => r.consultantId === c.id)
      const avg = records.length > 0 ? records.reduce((s, r) => s + r.avgFirstResponseMin, 0) / records.length : 0
      return { id: c.id, avg }
    })

    const bucketCounts = RESPONSE_BUCKETS.map(bucket => {
      const count = avgByConsultant.filter(c => c.avg >= bucket.min && c.avg < bucket.max).length
      return { name: bucket.label, count, isSlow: bucket.min >= 10 }
    })

    const overallAvg = avgByConsultant.reduce((s, c) => s + c.avg, 0) / avgByConsultant.length

    return { bucketCounts, overallAvg }
  }, [])

  const funnelData = useMemo(() => {
    const records = consultantDaily.filter(r => r.consultantId === selectedConsultantId)
    const booked = records.reduce((s, r) => s + r.booked, 0)
    const arrived = records.reduce((s, r) => s + r.arrived, 0)
    const closed = records.reduce((s, r) => s + r.closed, 0)

    const allRecords = consultantDaily
    const teamBooked = allRecords.reduce((s, r) => s + r.booked, 0)
    const teamArrived = allRecords.reduce((s, r) => s + r.arrived, 0)
    const teamClosed = allRecords.reduce((s, r) => s + r.closed, 0)
    const teamCount = consultants.length

    return {
      personal: [
        { name: '预约', value: booked, rate: '' },
        { name: '到店', value: arrived, rate: booked > 0 ? `${((arrived / booked) * 100).toFixed(1)}%` : '0%' },
        { name: '成交', value: closed, rate: arrived > 0 ? `${((closed / arrived) * 100).toFixed(1)}%` : '0%' },
      ],
      teamAvg: {
        booked: Math.round(teamBooked / teamCount),
        arrived: Math.round(teamArrived / teamCount),
        closed: Math.round(teamClosed / teamCount),
      },
    }
  }, [selectedConsultantId])

  const repeatPurchaseData = useMemo(() => {
    const allRecords = consultantDaily
    const totalDealAmount = allRecords.reduce((s, r) => s + r.dealAmount, 0)
    const repeatRecords = allRecords.filter(r => r.repeatPurchase > 0)
    const repeatAmount = repeatRecords.reduce((s, r) => s + r.dealAmount * (r.repeatPurchase / (r.closed || 1)), 0)
    const pct = totalDealAmount > 0 ? (repeatAmount / totalDealAmount) * 100 : 0

    return { amount: Math.round(repeatAmount), pct }
  }, [])

  const referralData = useMemo(() => {
    const allRecords = consultantDaily
    const totalActiveLeads = allRecords.reduce((s, r) => s + r.activeLeads, 0)
    const totalReferrals = allRecords.reduce((s, r) => s + r.referralCount, 0)
    const pct = totalActiveLeads > 0 ? (totalReferrals / totalActiveLeads) * 100 : 0

    return { count: totalReferrals, pct }
  }, [])

  const selectedConsultant = consultants.find(c => c.id === selectedConsultantId) ?? consultants[0]

  return (
    <PageWrapper>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Users size={24} className="text-brand-emerald" />
          <h1 className="text-2xl font-bold text-brand-text-primary">人员追踪</h1>
        </div>

        <section className="bg-brand-card border border-brand-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="emerald">热力图</Badge>
            <h2 className="text-lg font-semibold text-brand-text-primary">顾问饱和度</h2>
          </div>
          <HeatmapChart
            data={heatmapData.data}
            xLabels={heatmapData.xLabels}
            yLabels={heatmapData.yLabels}
          />
        </section>

        <section className="bg-brand-card border border-brand-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="amber">响应</Badge>
            <h2 className="text-lg font-semibold text-brand-text-primary">首响时长分布</h2>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={responseData.bucketCounts} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 12 }} />
              <YAxis tick={{ fill: '#94A3B8', fontSize: 12 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: 8 }}
                labelStyle={{ color: '#F1F5F9' }}
                itemStyle={{ color: '#00D4AA' }}
              />
              <Legend />
              <Bar dataKey="count" name="顾问人数" radius={[4, 4, 0, 0]}>
                {responseData.bucketCounts.map((entry, index) => (
                  <Cell key={index} fill={entry.isSlow ? '#EF4444' : '#00D4AA'} />
                ))}
              </Bar>
              <ReferenceLine
                y={responseData.overallAvg}
                stroke="#FBBF24"
                strokeDasharray="6 3"
                strokeWidth={2}
                label={{
                  value: `均值 ${responseData.overallAvg.toFixed(1)}分钟`,
                  position: 'right',
                  fill: '#FBBF24',
                  fontSize: 12,
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </section>

        <section className="bg-brand-card border border-brand-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Badge variant="blue">转化</Badge>
              <h2 className="text-lg font-semibold text-brand-text-primary">个人转化漏斗</h2>
            </div>
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-brand-text-muted" />
              <select
                value={selectedConsultantId}
                onChange={e => setSelectedConsultantId(e.target.value)}
                className="bg-brand-surface border border-brand-border rounded-lg px-3 py-1.5 text-sm text-brand-text-primary focus:outline-none focus:border-brand-emerald"
              >
                {consultants.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="relative">
            <FunnelChart stages={funnelData.personal} width={440} height={260} />

            <svg
              className="absolute top-0 left-0 pointer-events-none"
              width={440}
              height={260}
              viewBox="0 0 440 260"
            >
              {(() => {
                const team = funnelData.teamAvg
                const maxVal = Math.max(team.booked, 1)
                const stageH = (260 - 2 * 4) / 3
                const cx = 220
                const minRatio = 0.3
                const stages = [
                  { value: team.booked },
                  { value: team.arrived },
                  { value: team.closed },
                ]
                return stages.map((stage, i) => {
                  const ratio = Math.max(stage.value / maxVal, minRatio)
                  const halfW = (ratio * 440) / 2
                  const y = i * (stageH + 4) + stageH / 2 + 4
                  return (
                    <g key={i}>
                      <line
                        x1={cx - halfW}
                        y1={y}
                        x2={cx + halfW}
                        y2={y}
                        stroke="#FBBF24"
                        strokeWidth={2}
                        strokeDasharray="6 3"
                      />
                      <text
                        x={cx + halfW + 6}
                        y={y + 4}
                        fill="#FBBF24"
                        fontSize={10}
                      >
                        均值 {stage.value}
                      </text>
                    </g>
                  )
                })
              })()}
            </svg>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-brand-card border border-brand-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Repeat size={16} className="text-brand-emerald" />
              <h2 className="text-lg font-semibold text-brand-text-primary">老客复购贡献</h2>
            </div>
            <RingChart
              data={[
                { name: '复购', value: repeatPurchaseData.pct, color: '#00D4AA' },
                { name: '其他', value: 100 - repeatPurchaseData.pct, color: '#1E293B' },
              ]}
              size={160}
              strokeWidth={18}
              centerValue={`${repeatPurchaseData.pct.toFixed(1)}%`}
              centerLabel="复购占比"
            />
            <div className="mt-4 text-center">
              <p className="text-sm text-brand-text-muted">复购金额</p>
              <p className="text-xl font-bold font-mono text-brand-text-primary">
                ¥{repeatPurchaseData.amount.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="bg-brand-card border border-brand-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <UserPlus size={16} className="text-brand-blue" />
              <h2 className="text-lg font-semibold text-brand-text-primary">转介绍占比</h2>
            </div>
            <RingChart
              data={[
                { name: '转介绍', value: referralData.pct, color: '#3B82F6' },
                { name: '其他', value: 100 - referralData.pct, color: '#1E293B' },
              ]}
              size={160}
              strokeWidth={18}
              centerValue={`${referralData.pct.toFixed(1)}%`}
              centerLabel="转介绍占比"
            />
            <div className="mt-4 text-center">
              <p className="text-sm text-brand-text-muted">转介绍数</p>
              <p className="text-xl font-bold font-mono text-brand-text-primary">
                {referralData.count}
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
