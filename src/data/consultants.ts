import type { Consultant, ConsultantDaily } from '@/types'

export const consultants: Consultant[] = [
  { id: 'c1', name: '王思琪', avatar: '👩‍💼' },
  { id: 'c2', name: '李婉清', avatar: '👩‍🦰' },
  { id: 'c3', name: '张梦瑶', avatar: '👩‍🎨' },
  { id: 'c4', name: '陈雨薇', avatar: '👩‍🏫' },
  { id: 'c5', name: '刘诗涵', avatar: '👩‍💻' },
  { id: 'c6', name: '赵雅琳', avatar: '👩‍🔬' },
  { id: 'c7', name: '黄晓萱', avatar: '👩‍🎤' },
  { id: 'c8', name: '周文静', avatar: '👩‍⚖️' },
]

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

function generateConsultantDaily(): ConsultantDaily[] {
  const result: ConsultantDaily[] = []
  const today = new Date()
  const startDate = new Date('2025-07-01')
  const totalDays = Math.floor((today.getTime() - startDate.getTime()) / 86400000) + 1

  for (let dayOffset = 0; dayOffset < totalDays; dayOffset++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + dayOffset)
    const dateStr = date.toISOString().split('T')[0]
    const daySeed = dayOffset * 17

    const monthIndex = date.getMonth() + (date.getFullYear() - 2025) * 12 - 6
    const monthMultiplier = 0.8 + Math.max(0, monthIndex) * 0.025

    for (let i = 0; i < consultants.length; i++) {
      const c = consultants[i]
      const seed = daySeed + i * 31
      const activeLeads = Math.max(1, Math.round((8 + seededRandom(seed) * 12) * monthMultiplier))
      const avgFirstResponseMin = Math.round(3 + seededRandom(seed + 1) * 30)
      const booked = Math.max(0, Math.round((2 + seededRandom(seed + 2) * 5) * monthMultiplier))
      const arrived = Math.max(0, Math.round(booked * (0.5 + seededRandom(seed + 3) * 0.3)))
      const closed = Math.max(0, Math.round(arrived * (0.3 + seededRandom(seed + 4) * 0.3)))
      const dealAmount = Math.round(closed * (6000 + seededRandom(seed + 5) * 18000))
      const repeatPurchase = Math.max(0, Math.round(seededRandom(seed + 6) * 3 * monthMultiplier))
      const referralCount = Math.max(0, Math.round(seededRandom(seed + 7) * 4 * monthMultiplier))

      result.push({
        consultantId: c.id,
        date: dateStr,
        activeLeads,
        avgFirstResponseMin,
        booked,
        arrived,
        closed,
        dealAmount,
        repeatPurchase,
        referralCount,
      })
    }
  }

  return result
}

export const consultantDaily = generateConsultantDaily()

export function getYesterdayConsultantStats(): ConsultantDaily[] {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const dateStr = yesterday.toISOString().split('T')[0]
  return consultantDaily.filter(s => s.date === dateStr)
}
