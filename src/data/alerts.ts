import type { AlertItem } from '@/types'
import { loadTargets } from '@/data/targets'
import { channels, dailyChannelStats } from '@/data/channels'

export const alerts: AlertItem[] = [
  {
    id: 'a1',
    type: 'overdue',
    severity: 'high',
    title: '超期线索催办',
    description: '15条线索超过24小时未跟进，其中5条来自短视频渠道',
    date: new Date().toISOString().split('T')[0],
    resolved: false,
    consultantId: 'c3',
  },
  {
    id: 'a2',
    type: 'overdue',
    severity: 'high',
    title: '超期线索预警',
    description: '王思琪名下3条线索超过48小时未首次响应',
    date: new Date().toISOString().split('T')[0],
    resolved: false,
    consultantId: 'c1',
  },
  {
    id: 'a3',
    type: 'decline',
    severity: 'high',
    title: '预约率下滑预警',
    description: '光电项目预约率较上周下降8.2%，当前仅22.5%',
    date: new Date().toISOString().split('T')[0],
    resolved: false,
    projectId: 'laser',
  },
  {
    id: 'a4',
    type: 'decline',
    severity: 'medium',
    title: '到院率下滑预警',
    description: '小红书渠道到院率较上周下降6.1%，当前仅38.2%',
    date: new Date().toISOString().split('T')[0],
    resolved: false,
    channelId: 'xhs',
  },
  {
    id: 'a5',
    type: 'slow_response',
    severity: 'high',
    title: '首响超时预警',
    description: '昨日12条线索首响超过30分钟，占比18.5%',
    date: new Date().toISOString().split('T')[0],
    resolved: false,
  },
  {
    id: 'a6',
    type: 'slow_response',
    severity: 'medium',
    title: '首响超时提醒',
    description: '赵雅琳昨日平均首响42分钟，超出标准值',
    date: new Date().toISOString().split('T')[0],
    resolved: false,
    consultantId: 'c6',
  },
  {
    id: 'a7',
    type: 'channel_shift',
    severity: 'medium',
    title: '渠道质量骤变',
    description: '短视频渠道有效率较前日下降23%，从68%降至52%',
    date: new Date().toISOString().split('T')[0],
    resolved: false,
    channelId: 'dy',
  },
  {
    id: 'a8',
    type: 'channel_shift',
    severity: 'low',
    title: '渠道波动提醒',
    description: '美团渠道到院率较前日上升31%，需关注是否可持续',
    date: new Date().toISOString().split('T')[0],
    resolved: false,
    channelId: 'mt',
  },
  {
    id: 'a9',
    type: 'overdue',
    severity: 'medium',
    title: '超期线索提醒',
    description: '李婉清名下2条线索超过36小时未跟进',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    resolved: true,
    consultantId: 'c2',
  },
  {
    id: 'a10',
    type: 'decline',
    severity: 'low',
    title: '预约率微降提醒',
    description: '皮肤管理预约率较上周下降3.1%，当前28.4%',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    resolved: true,
    projectId: 'skin',
  },
]

export function generateTargetRiskAlerts(): AlertItem[] {
  const result: AlertItem[] = []
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const targets = loadTargets()
  const monthTarget = targets.find(t => t.month === currentMonth)
  const today = now.toISOString().split('T')[0]
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const daysElapsed = now.getDate()
  const progressRatio = daysElapsed / daysInMonth

  if (monthTarget && monthTarget.totalDealAmount > 0) {
    const monthStats = dailyChannelStats.filter(s => s.date.startsWith(currentMonth))
    const actualDealAmount = monthStats.reduce((sum, s) => sum + s.dealAmount, 0)
    const expectedDealAmount = progressRatio * monthTarget.totalDealAmount
    const completionRatio = actualDealAmount / monthTarget.totalDealAmount

    if (actualDealAmount < expectedDealAmount && completionRatio < 0.8) {
      const pct = Math.round(completionRatio * 100)
      const severity: AlertItem['severity'] = completionRatio < 0.6 ? 'high' : 'medium'
      result.push({
        id: `tr_deal_${currentMonth}`,
        type: 'target_risk',
        severity,
        title: '成交金额低于进度',
        description: `${currentMonth}月成交金额仅完成目标的${pct}%，按当前节奏月底预计存在缺口风险`,
        date: today,
        resolved: false,
        targetMonth: currentMonth,
      })
    }
  }

  let budgetConfig: { channelId: string; monthlyBudget: number; roiThreshold: number }[] = []
  try {
    const raw = localStorage.getItem('channel_budget_config')
    if (raw) budgetConfig = JSON.parse(raw)
  } catch { /* ignore */ }

  const paidChannels = channels.filter(ch => ch.dailyCost > 0)
  for (const channel of paidChannels) {
    const config = budgetConfig.find(c => c.channelId === channel.id)
    const threshold = config?.roiThreshold ?? 1.0

    const recentDays = 7
    const recentStats: { roi: number }[] = []
    for (let i = 0; i < recentDays; i++) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const dayStats = dailyChannelStats.filter(s => s.channelId === channel.id && s.date === dateStr)
      const totalDeal = dayStats.reduce((sum, s) => sum + s.dealAmount, 0)
      const cost = channel.dailyCost
      const roi = cost > 0 ? totalDeal / cost : 0
      recentStats.push({ roi })
    }

    let consecutiveBelowThreshold = 0
    let maxConsecutive = 0
    for (const stat of recentStats) {
      if (stat.roi < threshold) {
        consecutiveBelowThreshold++
        maxConsecutive = Math.max(maxConsecutive, consecutiveBelowThreshold)
      } else {
        consecutiveBelowThreshold = 0
      }
    }

    if (maxConsecutive >= 3) {
      const latestRoi = recentStats[0]?.roi ?? 0
      result.push({
        id: `tr_roi_${channel.id}_${currentMonth}`,
        type: 'target_risk',
        severity: 'medium',
        title: `${channel.name}ROI连续低于阈值`,
        description: `${channel.name}渠道ROI连续${maxConsecutive}天低于${threshold}，当前${latestRoi.toFixed(2)}，建议评估投放策略`,
        date: today,
        resolved: false,
        channelId: channel.id,
        targetMonth: currentMonth,
      })
    }
  }

  if (monthTarget && monthTarget.validRate > 0) {
    const monthStats = dailyChannelStats.filter(s => s.date.startsWith(currentMonth))
    const totalNewLeads = monthStats.reduce((sum, s) => sum + s.newLeads, 0)
    const totalValidLeads = monthStats.reduce((sum, s) => sum + s.validLeads, 0)
    const actualValidRate = totalNewLeads > 0 ? totalValidLeads / totalNewLeads : 0

    if (actualValidRate < monthTarget.validRate - 0.05) {
      result.push({
        id: `tr_validrate_${currentMonth}`,
        type: 'target_risk',
        severity: 'low',
        title: '有效率目标进度偏慢',
        description: `${currentMonth}月有效率${(actualValidRate * 100).toFixed(1)}%，低于目标${(monthTarget.validRate * 100).toFixed(1)}%，建议优化渠道筛选条件`,
        date: today,
        resolved: false,
        targetMonth: currentMonth,
      })
    }
  }

  return result
}

export function getActiveAlerts(): AlertItem[] {
  const staticActive = alerts.filter(a => !a.resolved)
  const dynamicTargetRisk = generateTargetRiskAlerts()
  return [...staticActive, ...dynamicTargetRisk]
}

export function getAlertsByType(type: AlertItem['type']): AlertItem[] {
  const staticByType = alerts.filter(a => a.type === type)
  if (type === 'target_risk') {
    return [...staticByType, ...generateTargetRiskAlerts()]
  }
  return staticByType
}
