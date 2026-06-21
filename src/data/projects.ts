import type { Project, DailyProjectStats, LostReason } from '@/types'

export const projects: Project[] = [
  { id: 'inject', name: '注射美容', color: '#00D4AA' },
  { id: 'laser', name: '光电项目', color: '#4A90D9' },
  { id: 'surgery', name: '手术类', color: '#F5A623' },
  { id: 'skin', name: '皮肤管理', color: '#FF6B6B' },
  { id: 'antiaging', name: '抗衰项目', color: '#A78BFA' },
]

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

function generateDailyProjectStats(): DailyProjectStats[] {
  const stats: DailyProjectStats[] = []
  const startDate = new Date('2025-07-01')
  const endDate = new Date('2026-12-31')
  const baseLeads: Record<string, number> = {
    inject: 28, laser: 22, surgery: 10, skin: 20, antiaging: 15,
  }
  const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / 86400000) + 1

  for (let dayOffset = 0; dayOffset < totalDays; dayOffset++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + dayOffset)
    const dateStr = date.toISOString().split('T')[0]
    const daySeed = dayOffset * 13

    const monthIndex = date.getMonth() + (date.getFullYear() - 2025) * 12 - 6
    const monthMultiplier = 0.8 + Math.max(0, monthIndex) * 0.02

    for (const project of projects) {
      const seed = daySeed + project.id.charCodeAt(0)
      const base = baseLeads[project.id] * monthMultiplier
      const variance = seededRandom(seed) * 0.3 - 0.15
      const leads = Math.max(1, Math.round(base * (1 + variance)))
      const bookingRate = 0.25 + seededRandom(seed + 1) * 0.2
      const booked = Math.round(leads * bookingRate)
      const arrivalRate = 0.5 + seededRandom(seed + 2) * 0.25
      const arrived = Math.round(booked * arrivalRate)
      const closeRate = 0.4 + seededRandom(seed + 3) * 0.25
      const closed = Math.round(arrived * closeRate)
      const unitPrice = project.id === 'surgery' ? 25000 : project.id === 'inject' ? 8000 : project.id === 'laser' ? 6000 : project.id === 'antiaging' ? 15000 : 3000
      const dealAmount = Math.round(closed * unitPrice * (0.8 + seededRandom(seed + 4) * 0.4))

      stats.push({ projectId: project.id, date: dateStr, leads, booked, arrived, closed, dealAmount })
    }
  }

  return stats
}

export const dailyProjectStats = generateDailyProjectStats()

export const lostReasons: LostReason[] = [
  { projectId: 'inject', reason: '价格顾虑', count: 45 },
  { projectId: 'inject', reason: '犹豫对比', count: 32 },
  { projectId: 'inject', reason: '时间冲突', count: 18 },
  { projectId: 'inject', reason: '信任不足', count: 12 },
  { projectId: 'laser', reason: '担心副作用', count: 38 },
  { projectId: 'laser', reason: '价格顾虑', count: 28 },
  { projectId: 'laser', reason: '效果存疑', count: 22 },
  { projectId: 'laser', reason: '时间冲突', count: 15 },
  { projectId: 'surgery', reason: '安全顾虑', count: 52 },
  { projectId: 'surgery', reason: '价格顾虑', count: 35 },
  { projectId: 'surgery', reason: '恢复期长', count: 28 },
  { projectId: 'surgery', reason: '家人反对', count: 20 },
  { projectId: 'skin', reason: '价格顾虑', count: 25 },
  { projectId: 'skin', reason: '效果不明显', count: 18 },
  { projectId: 'skin', reason: '时间冲突', count: 14 },
  { projectId: 'skin', reason: '转去竞品', count: 10 },
  { projectId: 'antiaging', reason: '价格顾虑', count: 30 },
  { projectId: 'antiaging', reason: '效果存疑', count: 22 },
  { projectId: 'antiaging', reason: '犹豫对比', count: 16 },
  { projectId: 'antiaging', reason: '信任不足', count: 12 },
]

export function getYesterdayProjectStats(): DailyProjectStats[] {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const dateStr = yesterday.toISOString().split('T')[0]
  return dailyProjectStats.filter(s => s.date === dateStr)
}
