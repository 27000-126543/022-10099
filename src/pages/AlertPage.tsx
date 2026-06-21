import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, TrendingDown, Timer, Activity, ChevronUp, Target } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AlertItem } from '@/types'
import PageWrapper from '@/components/Layout/PageWrapper'
import MetricCard from '@/components/UI/MetricCard'
import AlertCard from '@/components/UI/AlertCard'
import Badge from '@/components/UI/Badge'
import { alerts, getActiveAlerts, getAlertsByType } from '@/data/alerts'
import { consultants } from '@/data/consultants'
import { channels } from '@/data/channels'

type AlertType = 'all' | 'overdue' | 'decline' | 'slow_response' | 'channel_shift' | 'target_risk'

const tabLabels: { key: AlertType; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'overdue', label: '超期线索' },
  { key: 'decline', label: '指标下滑' },
  { key: 'slow_response', label: '首响超时' },
  { key: 'channel_shift', label: '渠道骤变' },
  { key: 'target_risk', label: '目标风险' },
]

const severityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }

const overdueLeads = [
  { source: '短视频', consultant: '王思琪', hours: 52, status: '未跟进' },
  { source: '小红书', consultant: '王思琪', hours: 49, status: '未跟进' },
  { source: '短视频', consultant: '张梦瑶', hours: 38, status: '未跟进' },
  { source: '朋友圈', consultant: '张梦瑶', hours: 30, status: '跟进中' },
  { source: '美团', consultant: '李婉清', hours: 36, status: '未跟进' },
  { source: '转介绍', consultant: '陈雨薇', hours: 26, status: '跟进中' },
  { source: '短视频', consultant: '赵雅琳', hours: 28, status: '未跟进' },
]

export default function AlertPage() {
  const [activeTab, setActiveTab] = useState<AlertType>('all')
  const [selectedOverdueId, setSelectedOverdueId] = useState<string | null>(null)
  const navigate = useNavigate()

  const activeAlerts = getActiveAlerts()
  const overdueCount = getAlertsByType('overdue').filter(a => !a.resolved).length
  const declineCount = getAlertsByType('decline').filter(a => !a.resolved).length
  const slowResponseCount = getAlertsByType('slow_response').filter(a => !a.resolved).length
  const channelShiftCount = getAlertsByType('channel_shift').filter(a => !a.resolved).length
  const targetRiskCount = getAlertsByType('target_risk').filter(a => !a.resolved).length

  const filteredAlerts = activeTab === 'all'
    ? activeAlerts
    : activeAlerts.filter(a => a.type === activeTab)

  const sortedAlerts = [...filteredAlerts].sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  )

  const getActionLabel = (type: AlertItem['type']) =>
    type === 'overdue' ? '催办' : '查看'

  const handleCardClick = (type: AlertType) => {
    setActiveTab(type)
  }

  return (
    <PageWrapper>
      <div className="space-y-6">
        <h1 className="text-xl font-bold text-brand-text-primary">异常预警</h1>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <button onClick={() => handleCardClick('overdue')} className="text-left">
            <MetricCard
              icon={<Clock size={18} />}
              label="超期线索"
              value={overdueCount}
              color="red"
            />
          </button>
          <button onClick={() => handleCardClick('decline')} className="text-left">
            <MetricCard
              icon={<TrendingDown size={18} />}
              label="指标下滑"
              value={declineCount}
              color="amber"
            />
          </button>
          <button onClick={() => handleCardClick('slow_response')} className="text-left">
            <MetricCard
              icon={<Timer size={18} />}
              label="首响超时"
              value={slowResponseCount}
              color="amber"
            />
          </button>
          <button onClick={() => handleCardClick('channel_shift')} className="text-left">
            <MetricCard
              icon={<Activity size={18} />}
              label="渠道骤变"
              value={channelShiftCount}
              color="blue"
            />
          </button>
          <button onClick={() => handleCardClick('target_risk')} className="text-left">
            <MetricCard
              icon={<Target size={18} />}
              label="目标风险"
              value={targetRiskCount}
              color="red"
            />
          </button>
        </div>

        <div className="flex gap-1 border-b border-brand-border">
          {tabLabels.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="relative px-4 py-2.5 text-sm font-medium transition-colors"
            >
              <span className={activeTab === tab.key ? 'text-brand-emerald' : 'text-brand-text-muted'}>
                {tab.label}
              </span>
              {activeTab === tab.key && (
                <motion.div
                  layoutId="alert-tab-underline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-emerald"
                />
              )}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {sortedAlerts.map(alert => (
              <motion.div
                key={alert.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <AlertCard
                  severity={alert.severity}
                  title={alert.title}
                  description={alert.description}
                  time={alert.date}
                  type={getActionLabel(alert.type)}
                  onAction={() => {
                    if (alert.type === 'overdue') {
                      setSelectedOverdueId(prev => prev === alert.id ? null : alert.id)
                    } else if (alert.type === 'target_risk') {
                      if (alert.channelId) {
                        navigate('/channel')
                      } else if (alert.targetMonth) {
                        navigate('/report', { state: { month: alert.targetMonth } })
                      } else {
                        navigate('/report')
                      }
                    }
                  }}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {selectedOverdueId && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="bg-brand-card border border-brand-border rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-brand-border">
                  <h3 className="text-sm font-semibold text-brand-text-primary">超期线索明细</h3>
                  <button
                    onClick={() => setSelectedOverdueId(null)}
                    className="text-brand-text-muted hover:text-brand-text-primary transition-colors"
                  >
                    <ChevronUp size={16} />
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-brand-border">
                        <th className="text-left px-5 py-2.5 text-xs font-medium text-brand-text-muted">线索来源</th>
                        <th className="text-left px-5 py-2.5 text-xs font-medium text-brand-text-muted">分配顾问</th>
                        <th className="text-left px-5 py-2.5 text-xs font-medium text-brand-text-muted">超期时长</th>
                        <th className="text-left px-5 py-2.5 text-xs font-medium text-brand-text-muted">状态</th>
                        <th className="text-right px-5 py-2.5 text-xs font-medium text-brand-text-muted">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overdueLeads.map((lead, idx) => (
                        <tr
                          key={idx}
                          className={cn(
                            'border-b border-brand-border last:border-b-0 transition-colors hover:bg-brand-card/80',
                            lead.hours > 48 && 'border-l-2 border-l-brand-red'
                          )}
                        >
                          <td className="px-5 py-3 text-brand-text-primary">{lead.source}</td>
                          <td className="px-5 py-3 text-brand-text-primary">{lead.consultant}</td>
                          <td className="px-5 py-3">
                            <span className={lead.hours > 48 ? 'text-brand-red font-medium' : 'text-brand-text-primary'}>
                              {lead.hours}小时
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <Badge variant={lead.status === '未跟进' ? 'red' : 'amber'}>
                              {lead.status}
                            </Badge>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <button className="text-xs font-medium px-3 py-1 rounded-lg bg-brand-emerald/15 text-brand-emerald hover:bg-brand-emerald/25 transition-colors">
                              催办
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageWrapper>
  )
}
