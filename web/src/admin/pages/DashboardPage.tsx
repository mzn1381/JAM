import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Bar,
  BarChart,
} from 'recharts'
import { useTranslation } from 'react-i18next'
import { CalendarDays, CheckCircle2, Users2 } from 'lucide-react'

import ChartCard from '../components/dashboard/ChartCard'
import ProgressCard from '../components/dashboard/ProgressCard'
import StatCard from '../components/dashboard/StatCard'
import DashboardLayout from '../components/layout/DashboardLayout'
import { useAuth } from '../hooks/useAuth'
import { formatBackendDate } from '../utils/dateTime'
import { useDashboardQuery } from '../hooks/useDashboardQuery'
import { getErrorMessage } from '../utils/httpError'
import { modelDistribution } from '../utils/dashboardData'

function formatDayLabel(dateValue: string, locale: string): string {
  return formatBackendDate(dateValue, locale) ?? dateValue
}

export default function DashboardPage() {
  const { t, i18n } = useTranslation()
  const { user, organizationId } = useAuth()

  const dashboardQuery = useDashboardQuery({
    userId: user?.id ?? '',
    organizationId,
    enabled: Boolean(user?.id) && Boolean(organizationId),
  })

  const dashboardData = dashboardQuery.data?.data
  const availableMessages = dashboardData?.wallet.available_messages ?? 0
  const availableSessions = dashboardData?.wallet.available_sessions ?? 0
  const totalAvailable = availableMessages + availableSessions
  const monthCalls = dashboardData?.month_count ?? 0
  const todayCalls = dashboardData?.today_count ?? 0

  const isDashboardLoading = dashboardQuery.isPending
  const hasDashboardError = dashboardQuery.isError

  const dailyUsageChartData = (dashboardData?.daily_usage ?? []).map(
    (item) => ({
      day: formatDayLabel(item.date, i18n.language),
      value: item.count,
    }),
  )

  // TODO: replace this placeholder when backend exposes dashboard success rate.
  const successRatePlaceholder = '99.8%'

  const statCards = [
    {
      key: 'month-calls',
      labelKey: 'dashboard.thisMonth',
      value: isDashboardLoading ? '...' : monthCalls.toLocaleString(),
      suffixKey: 'dashboard.apiCalls',
      icon: CalendarDays,
    },
    {
      key: 'today-calls',
      labelKey: 'dashboard.today',
      value: isDashboardLoading ? '...' : todayCalls.toLocaleString(),
      suffixKey: 'dashboard.apiCalls',
      icon: CalendarDays,
    },
    {
      key: 'success-rate',
      labelKey: 'dashboard.successRequests',
      value: successRatePlaceholder,
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

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {hasDashboardError ? (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {getErrorMessage(dashboardQuery.error)}
          </div>
        ) : null}

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <ProgressCard
            purchased={isDashboardLoading ? 0 : totalAvailable}
            consumed={isDashboardLoading ? 0 : availableSessions}
            remaining={isDashboardLoading ? 0 : availableMessages}
            titleKey="dashboard.remainingPackageTitle"
            centerLabelKey="dashboard.remainingMessages"
            remainingLabelKey="dashboard.remainingMessages"
            consumedLabelKey="dashboard.remainingSessions"
            purchasedLabelKey="dashboard.totalAvailable"
          />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:col-span-2">
            {statCards.map((item) => (
              <StatCard
                key={item.key}
                labelKey={item.labelKey}
                value={item.value}
                suffixKey={item.suffixKey}
                icon={item.icon}
              />
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <ChartCard title={t('dashboard.modelsDistribution')}>
            <div className="grid h-[290px] grid-cols-1 items-center gap-3 sm:grid-cols-[1.1fr_1fr]">
              <div className="space-y-2">
                {modelDistribution.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                      aria-hidden="true"
                    />
                    <span className="font-semibold text-admin-ink">
                      {item.name}
                    </span>
                    <span className="text-admin-muted">({item.value}%)</span>
                  </div>
                ))}
              </div>

              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={modelDistribution}
                    dataKey="value"
                    innerRadius={55}
                    outerRadius={82}
                    stroke="none"
                    paddingAngle={2}
                  >
                    {modelDistribution.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title={t('dashboard.dailyUsage')}>
            <div className="h-[290px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyUsageChartData} barCategoryGap="24%">
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {dailyUsageChartData.map((entry, index) => (
                      <Cell
                        key={`${entry.day}-${index}`}
                        fill={index === 1 ? '#0B7A74' : '#BFD2D7'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </section>

        <footer className="pb-1 text-center text-xs font-medium text-admin-muted">
          {t('dashboard.footer')}
        </footer>
      </div>
    </DashboardLayout>
  )
}
