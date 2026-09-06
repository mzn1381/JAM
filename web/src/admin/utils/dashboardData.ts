import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  KeyRound,
  LayoutGrid,
  Package,
  ReceiptText,
  Settings,
  Users2,
  Waypoints,
} from 'lucide-react'

import type { MenuItem, StatItem } from '../types/dashboard'

export const sidebarMenuItems: MenuItem[] = [
  {
    key: 'dashboard',
    labelKey: 'menu.dashboard',
    icon: LayoutGrid,
    path: '/dashboard',
  },
  {
    key: 'apiKeys',
    labelKey: 'menu.apiKeys',
    icon: KeyRound,
    path: '/api-keys',
  },
  { key: 'apiUsage', labelKey: 'menu.apiUsage', icon: Waypoints },
  { key: 'reports', labelKey: 'menu.reports', icon: BarChart3 },
  { key: 'packages', labelKey: 'menu.packages', icon: Package },
  { key: 'billing', labelKey: 'menu.billing', icon: ReceiptText },
  { key: 'settings', labelKey: 'menu.settings', icon: Settings },
]

export const dashboardStats: StatItem[] = [
  {
    key: 'month-calls',
    labelKey: 'dashboard.thisMonth',
    value: '2,813',
    suffixKey: 'dashboard.apiCalls',
    icon: CalendarDays,
  },
  {
    key: 'today-calls',
    labelKey: 'dashboard.today',
    value: '124',
    suffixKey: 'dashboard.apiCalls',
    icon: CalendarDays,
  },
  {
    key: 'success-rate',
    labelKey: 'dashboard.successRequests',
    value: '99.8%',
    suffixKey: 'dashboard.apiCalls',
    icon: CheckCircle2,
  },
  {
    key: 'active-users',
    labelKey: 'dashboard.activeUsers',
    value: '18',
    suffixKey: 'dashboard.apiCalls',
    icon: Users2,
  },
]

export const packageUsage = {
  purchased: 3000,
  consumed: 813,
  remaining: 2187,
}

export const modelDistribution = [
  { name: 'GPT-5', value: 45, color: '#11B2A5' },
  { name: 'Claude', value: 25, color: '#F6B742' },
  { name: 'Gemini', value: 20, color: '#5A6171' },
  { name: 'Other', value: 10, color: '#D8DDE7' },
]

export const dailyUsage = [
  { day: 'Sat', value: 62 },
  { day: 'Sun', value: 92 },
  { day: 'Mon', value: 48 },
  { day: 'Tue', value: 72 },
  { day: 'Wed', value: 24 },
  { day: 'Thu', value: 42 },
  { day: 'Fri', value: 20 },
]
