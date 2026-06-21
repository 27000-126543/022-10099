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

  for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
    const date = new Date(today)
    date.setDate(date.getDate() - dayOffset)
    const dateStr = date.toISOString().split('T')[0]
    const daySeed = dayOffset * 17

    for (let i = 0; i < consultants.length; i++) {
      const c = consultants[i]
      const seed = daySeed + i * 31
      const activeLeads = Math.round(8 + seededRandom(seed) * 12)
      const avgFirstResponseMin = Math.round(3 + seededRandom(seed + 1) * 30)
      const booked = Math.round(2 + seededRandom(seed + 2) * 5)
      const arrived = Math.round(booked * (0.5 + seededRandom(seed + 3) * 0.3))
      const closed = Math.round(arrived * (0.3 + seededRandom(seed + 4) * 0.3))
      const dealAmount = Math.round(closed * (6000 + seededRandom(seed + 5) * 18000))
      const repeatPurchase = Math.round(seededRandom(seed + 6) * 3)
      const referralCount = Math.round(seededRandom(seed + 7) * 4)

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
