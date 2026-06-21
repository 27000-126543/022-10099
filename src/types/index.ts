export interface Channel {
  id: string
  name: string
  color: string
  dailyCost: number
}

export interface DailyChannelStats {
  channelId: string
  date: string
  newLeads: number
  validLeads: number
  booked: number
  arrived: number
  dealAmount: number
  avgFirstResponseMin: number
}

export interface Project {
  id: string
  name: string
  color: string
}

export interface DailyProjectStats {
  projectId: string
  date: string
  leads: number
  booked: number
  arrived: number
  closed: number
  dealAmount: number
}

export interface LostReason {
  projectId: string
  reason: string
  count: number
}

export interface Consultant {
  id: string
  name: string
  avatar: string
}

export interface ConsultantDaily {
  consultantId: string
  date: string
  activeLeads: number
  avgFirstResponseMin: number
  booked: number
  arrived: number
  closed: number
  dealAmount: number
  repeatPurchase: number
  referralCount: number
}

export interface AlertItem {
  id: string
  type: 'overdue' | 'decline' | 'slow_response' | 'channel_shift' | 'target_risk'
  severity: 'high' | 'medium' | 'low'
  title: string
  description: string
  date: string
  resolved: boolean
  consultantId?: string
  channelId?: string
  projectId?: string
  targetMonth?: string
}

export interface MonthlyReport {
  month: string
  totalLeads: number
  validRate: number
  bookingRate: number
  arrivalRate: number
  totalDealAmount: number
  repeatPurchaseRate: number
  referralRate: number
}

export interface LeadDetail {
  id: string
  name: string
  channelId: string
  projectId: string
  consultantId: string
  concernTags: string[]
  followUpCount: number
  status: 'new' | 'contacted' | 'booked' | 'arrived' | 'closed' | 'lost'
  createdAt: string
  firstResponseMin: number
}

export interface MetricData {
  label: string
  value: number
  unit?: string
  change: number
  icon: string
}
