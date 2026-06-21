export interface MonthlyTarget {
  month: string
  totalLeads: number
  totalDealAmount: number
  validRate: number
  repeatPurchaseRate: number
}

const STORAGE_KEY = 'monthly_targets'

const defaultTargets: MonthlyTarget[] = [
  { month: '2025-07', totalLeads: 800, totalDealAmount: 1800000, validRate: 0.72, repeatPurchaseRate: 0.25 },
  { month: '2025-08', totalLeads: 840, totalDealAmount: 1950000, validRate: 0.74, repeatPurchaseRate: 0.26 },
  { month: '2025-09', totalLeads: 810, totalDealAmount: 1700000, validRate: 0.70, repeatPurchaseRate: 0.24 },
  { month: '2025-10', totalLeads: 880, totalDealAmount: 2100000, validRate: 0.76, repeatPurchaseRate: 0.27 },
  { month: '2025-11', totalLeads: 920, totalDealAmount: 2300000, validRate: 0.78, repeatPurchaseRate: 0.29 },
  { month: '2025-12', totalLeads: 960, totalDealAmount: 2450000, validRate: 0.77, repeatPurchaseRate: 0.28 },
  { month: '2026-01', totalLeads: 830, totalDealAmount: 1920000, validRate: 0.73, repeatPurchaseRate: 0.25 },
  { month: '2026-02', totalLeads: 780, totalDealAmount: 1650000, validRate: 0.71, repeatPurchaseRate: 0.23 },
  { month: '2026-03', totalLeads: 890, totalDealAmount: 2050000, validRate: 0.75, repeatPurchaseRate: 0.26 },
  { month: '2026-04', totalLeads: 940, totalDealAmount: 2250000, validRate: 0.77, repeatPurchaseRate: 0.28 },
  { month: '2026-05', totalLeads: 970, totalDealAmount: 2500000, validRate: 0.79, repeatPurchaseRate: 0.30 },
  { month: '2026-06', totalLeads: 1000, totalDealAmount: 2700000, validRate: 0.80, repeatPurchaseRate: 0.32 },
  { month: '2026-07', totalLeads: 1040, totalDealAmount: 2900000, validRate: 0.81, repeatPurchaseRate: 0.33 },
  { month: '2026-08', totalLeads: 1080, totalDealAmount: 3100000, validRate: 0.82, repeatPurchaseRate: 0.34 },
  { month: '2026-09', totalLeads: 1060, totalDealAmount: 2980000, validRate: 0.80, repeatPurchaseRate: 0.32 },
  { month: '2026-10', totalLeads: 1120, totalDealAmount: 3300000, validRate: 0.83, repeatPurchaseRate: 0.35 },
  { month: '2026-11', totalLeads: 1180, totalDealAmount: 3550000, validRate: 0.84, repeatPurchaseRate: 0.36 },
  { month: '2026-12', totalLeads: 1220, totalDealAmount: 3750000, validRate: 0.83, repeatPurchaseRate: 0.35 },
]

export function loadTargets(): MonthlyTarget[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore */
  }
  return [...defaultTargets]
}

export function saveTargets(targets: MonthlyTarget[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(targets))
  } catch {
    /* ignore quota errors */
  }
}

export function getTargetForMonth(month: string): MonthlyTarget | undefined {
  const all = loadTargets()
  return all.find(t => t.month === month)
}

export function upsertTarget(target: MonthlyTarget): void {
  const all = loadTargets()
  const idx = all.findIndex(t => t.month === target.month)
  if (idx >= 0) {
    all[idx] = target
  } else {
    all.push(target)
  }
  saveTargets(all)
}

export function getDefaultTargets(): MonthlyTarget[] {
  return [...defaultTargets]
}
