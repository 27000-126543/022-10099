import type { MonthlyReport } from '@/types'

export const monthlyReports: MonthlyReport[] = [
  { month: '2025-07', totalLeads: 680, validRate: 0.68, bookingRate: 0.35, arrivalRate: 0.58, totalDealAmount: 1580000, repeatPurchaseRate: 0.22, referralRate: 0.15 },
  { month: '2025-08', totalLeads: 720, validRate: 0.70, bookingRate: 0.37, arrivalRate: 0.60, totalDealAmount: 1720000, repeatPurchaseRate: 0.24, referralRate: 0.16 },
  { month: '2025-09', totalLeads: 690, validRate: 0.66, bookingRate: 0.33, arrivalRate: 0.55, totalDealAmount: 1480000, repeatPurchaseRate: 0.20, referralRate: 0.14 },
  { month: '2025-10', totalLeads: 750, validRate: 0.72, bookingRate: 0.38, arrivalRate: 0.62, totalDealAmount: 1850000, repeatPurchaseRate: 0.25, referralRate: 0.18 },
  { month: '2025-11', totalLeads: 780, validRate: 0.74, bookingRate: 0.40, arrivalRate: 0.64, totalDealAmount: 2010000, repeatPurchaseRate: 0.27, referralRate: 0.19 },
  { month: '2025-12', totalLeads: 820, validRate: 0.73, bookingRate: 0.39, arrivalRate: 0.61, totalDealAmount: 2150000, repeatPurchaseRate: 0.26, referralRate: 0.18 },
  { month: '2026-01', totalLeads: 710, validRate: 0.69, bookingRate: 0.36, arrivalRate: 0.57, totalDealAmount: 1680000, repeatPurchaseRate: 0.23, referralRate: 0.16 },
  { month: '2026-02', totalLeads: 650, validRate: 0.67, bookingRate: 0.34, arrivalRate: 0.56, totalDealAmount: 1420000, repeatPurchaseRate: 0.21, referralRate: 0.15 },
  { month: '2026-03', totalLeads: 760, validRate: 0.71, bookingRate: 0.38, arrivalRate: 0.60, totalDealAmount: 1780000, repeatPurchaseRate: 0.24, referralRate: 0.17 },
  { month: '2026-04', totalLeads: 800, validRate: 0.73, bookingRate: 0.40, arrivalRate: 0.63, totalDealAmount: 1950000, repeatPurchaseRate: 0.26, referralRate: 0.18 },
  { month: '2026-05', totalLeads: 830, validRate: 0.75, bookingRate: 0.41, arrivalRate: 0.65, totalDealAmount: 2180000, repeatPurchaseRate: 0.28, referralRate: 0.20 },
  { month: '2026-06', totalLeads: 850, validRate: 0.74, bookingRate: 0.42, arrivalRate: 0.66, totalDealAmount: 2350000, repeatPurchaseRate: 0.29, referralRate: 0.21 },
  { month: '2026-07', totalLeads: 890, validRate: 0.76, bookingRate: 0.43, arrivalRate: 0.67, totalDealAmount: 2520000, repeatPurchaseRate: 0.30, referralRate: 0.22 },
  { month: '2026-08', totalLeads: 920, validRate: 0.77, bookingRate: 0.44, arrivalRate: 0.68, totalDealAmount: 2680000, repeatPurchaseRate: 0.31, referralRate: 0.23 },
  { month: '2026-09', totalLeads: 900, validRate: 0.75, bookingRate: 0.42, arrivalRate: 0.66, totalDealAmount: 2580000, repeatPurchaseRate: 0.29, referralRate: 0.21 },
  { month: '2026-10', totalLeads: 960, validRate: 0.78, bookingRate: 0.45, arrivalRate: 0.69, totalDealAmount: 2850000, repeatPurchaseRate: 0.32, referralRate: 0.24 },
  { month: '2026-11', totalLeads: 1010, validRate: 0.79, bookingRate: 0.46, arrivalRate: 0.70, totalDealAmount: 3100000, repeatPurchaseRate: 0.33, referralRate: 0.25 },
  { month: '2026-12', totalLeads: 1050, validRate: 0.78, bookingRate: 0.45, arrivalRate: 0.68, totalDealAmount: 3250000, repeatPurchaseRate: 0.32, referralRate: 0.24 },
]

export function getLatestMonth(): MonthlyReport {
  return monthlyReports[monthlyReports.length - 1]
}

export function getPreviousMonth(): MonthlyReport {
  return monthlyReports[monthlyReports.length - 2]
}
