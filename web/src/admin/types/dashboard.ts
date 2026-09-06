import type { LucideIcon } from 'lucide-react'

export type MenuItem = {
  key: string
  labelKey: string
  icon: LucideIcon
  path?: string
}

export type StatItem = {
  key: string
  labelKey: string
  value: string
  suffixKey: string
  icon: LucideIcon
}

export type Wallet = {
  available_messages: number
  available_sessions: number
  updated_at: string
}

export type DailyUsage = {
  date: string
  units: number
  count: number
}

export type DashboardData = {
  user_id: string
  organization_id: string
  wallet: Wallet
  today_count: number
  month_count: number
  month_start: string
  month_end: string
  daily_usage: DailyUsage[]
}

export type DashboardRequest = {
  user_id?: string
  organization_id?: string
}

export type DashboardResponse = {
  data: DashboardData
  success: boolean
  message: string
  errorCode: number
  traceId: string
}
