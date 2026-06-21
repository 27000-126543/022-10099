import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, CheckCircle2, Zap, CalendarCheck, Building2, DollarSign } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import PageWrapper from '@/components/Layout/PageWrapper'
import MetricCard from '@/components/UI/MetricCard'
import FunnelChart from '@/components/Charts/FunnelChart'
import { channels, getYesterdayChannelStats } from '@/data/channels'
import { getYesterdayProjectStats } from '@/data/projects'
import { getActiveAlerts } from '@/data/alerts'

export default function OverviewPage() {
  const navigate = useNavigate()

  const yesterdayChannelStats = useMemo(() => getYesterdayChannelStats(), [])
  const yesterdayProjectStats = useMemo(() => getYesterdayProjectStats(), [])
  const activeAlerts = useMemo(() => getActiveAlerts(), [])

  const metrics = useMemo(() => {
    const totalNewLeads = yesterdayChannelStats.reduce((s, c) => s + c.newLeads, 0)
    const totalValidLeads = yesterdayChannelStats.reduce((s, c) => s + c.validLeads, 0)
    const totalBooked = yesterdayChannelStats.reduce((s, c) => s + c.booked, 0)
    const totalArrived = yesterdayChannelStats.reduce((s, c) => s + c.arrived, 0)
    const totalDealAmount = yesterdayChannelStats.reduce((s, c) => s + c.dealAmount, 0)
    const validRate = totalNewLeads > 0 ? (totalValidLeads / totalNewLeads) * 100 : 0
    const fastResponseCount = yesterdayChannelStats.filter(c => c.avgFirstResponseMin < 10).length
    const totalChannelCount = yesterdayChannelStats.length
    const firstResponseRate = totalChannelCount > 0 ? (fastResponseCount / totalChannelCount) * 100 : 0
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
  }, [yesterdayChannelStats])

  const channelRanking = useMemo(() => {
    return yesterdayChannelStats
      .map(stat => {
        const channel = channels.find(c => c.id === stat.channelId)
        return {
          name: channel?.name ?? stat.channelId,
          value: stat.newLeads,
          color: channel?.color ?? '#6B7280',
        }
      })
      .sort((a, b) => b.value - a.value)
  }, [yesterdayChannelStats])

  const funnelStages = useMemo(() => {
    const totalLeads = yesterdayProjectStats.reduce((s, p) => s + p.leads, 0)
    const totalBooked = yesterdayProjectStats.reduce((s, p) => s + p.booked, 0)
    const totalArrived = yesterdayProjectStats.reduce((s, p) => s + p.arrived, 0)
    const totalClosed = yesterdayProjectStats.reduce((s, p) => s + p.closed, 0)

    const bookingRate = totalLeads > 0 ? ((totalBooked / totalLeads) * 100).toFixed(1) + '%' : '-'
    const arrivalRate = totalBooked > 0 ? ((totalArrived / totalBooked) * 100).toFixed(1) + '%' : '-'
    const closeRate = totalArrived > 0 ? ((totalClosed / totalArrived) * 100).toFixed(1) + '%' : '-'

    return [
      { name: '线索', value: totalLeads },
      { name: '预约', value: totalBooked, rate: bookingRate },
      { name: '到院', value: totalArrived, rate: arrivalRate },
      { name: '成交', value: totalClosed, rate: closeRate },
    ]
  }, [yesterdayProjectStats])

  const alertText = useMemo(() => {
    const count = activeAlerts.length
    const titles = activeAlerts.slice(0, 3).map(a => a.title).join('  |  ')
    return `${count}条待处理告警：${titles}`
  }, [activeAlerts])

  return (
    <PageWrapper>
      <div className="space-y-6 pb-14">
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
            value={metrics.totalDealAmount.toLocaleString()}
            unit="¥"
            color="amber"
          />
        </div>

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
