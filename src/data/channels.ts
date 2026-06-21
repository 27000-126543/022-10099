import type { Channel, DailyChannelStats } from '@/types'

export const channels: Channel[] = [
  { id: 'dy', name: '短视频', color: '#FF6B6B', dailyCost: 2800 },
  { id: 'xhs', name: '小红书', color: '#FF8FA3', dailyCost: 1500 },
  { id: 'mt', name: '美团', color: '#FFB347', dailyCost: 1200 },
  { id: 'pyq', name: '朋友圈', color: '#4ECDC4', dailyCost: 800 },
  { id: 'zjs', name: '转介绍', color: '#00D4AA', dailyCost: 0 },
  { id: 'zrdy', name: '自然到院', color: '#4A90D9', dailyCost: 0 },
]

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

function generateDailyChannelStats(): DailyChannelStats[] {
  const stats: DailyChannelStats[] = []
  const startDate = new Date('2025-07-01')
  const endDate = new Date('2026-12-31')
  const baseLeads: Record<string, number> = {
    dy: 35, xhs: 22, mt: 18, pyq: 12, zjs: 8, zrdy: 5,
  }
  const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / 86400000) + 1

  for (let dayOffset = 0; dayOffset < totalDays; dayOffset++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + dayOffset)
    const dateStr = date.toISOString().split('T')[0]
    const daySeed = dayOffset * 7

    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const monthIndex = monthKey === '2025-07' ? 0 : monthKey === '2025-08' ? 1 : monthKey === '2025-09' ? 2 : monthKey === '2025-10' ? 3 : monthKey === '2025-11' ? 4 : monthKey === '2025-12' ? 5 : monthKey === '2026-01' ? 6 : monthKey === '2026-02' ? 7 : monthKey === '2026-03' ? 8 : monthKey === '2026-04' ? 9 : monthKey === '2026-05' ? 10 : monthKey === '2026-06' ? 11 : monthKey === '2026-07' ? 12 : monthKey === '2026-08' ? 13 : monthKey === '2026-09' ? 14 : monthKey === '2026-10' ? 15 : monthKey === '2026-11' ? 16 : 17
    const monthMultiplier = 0.8 + monthIndex * 0.02

    for (const channel of channels) {
      const seed = daySeed + channel.id.charCodeAt(0)
      const base = baseLeads[channel.id] * monthMultiplier
      const variance = seededRandom(seed) * 0.3 - 0.15
      const newLeads = Math.max(1, Math.round(base * (1 + variance)))
      const validRate = 0.55 + seededRandom(seed + 1) * 0.25
      const validLeads = Math.round(newLeads * validRate)
      const bookingRate = 0.3 + seededRandom(seed + 2) * 0.2
      const booked = Math.round(validLeads * bookingRate)
      const arrivalRate = 0.5 + seededRandom(seed + 3) * 0.2
      const arrived = Math.round(booked * arrivalRate)
      const dealRate = 0.4 + seededRandom(seed + 4) * 0.2
      const dealAmount = Math.round(arrived * dealRate * (8000 + seededRandom(seed + 5) * 12000))

      stats.push({
        channelId: channel.id,
        date: dateStr,
        newLeads,
        validLeads,
        booked,
        arrived,
        dealAmount,
        avgFirstResponseMin: Math.round(5 + seededRandom(seed + 6) * 25),
      })
    }
  }

  return stats
}

export const dailyChannelStats = generateDailyChannelStats()

export function getYesterdayChannelStats(): DailyChannelStats[] {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const dateStr = yesterday.toISOString().split('T')[0]
  return dailyChannelStats.filter(s => s.date === dateStr)
}

export function getChannelStatsByDateRange(startDate: string, endDate: string): DailyChannelStats[] {
  return dailyChannelStats.filter(s => s.date >= startDate && s.date <= endDate)
}
