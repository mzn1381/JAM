import { PolarAngleAxis, RadialBar, RadialBarChart } from 'recharts'
import { useTranslation } from 'react-i18next'

import Button from '../ui/Button'

type ProgressCardProps = {
  purchased: number
  consumed: number
  remaining: number
  titleKey?: string
  centerLabelKey?: string
  remainingLabelKey?: string
  consumedLabelKey?: string
  purchasedLabelKey?: string
}

export default function ProgressCard({
  purchased,
  consumed,
  remaining,
  titleKey = 'dashboard.remainingPackageTitle',
  centerLabelKey = 'dashboard.remainingCalls',
  remainingLabelKey = 'dashboard.remaining',
  consumedLabelKey = 'dashboard.consumed',
  purchasedLabelKey = 'dashboard.purchased',
}: ProgressCardProps) {
  const { t } = useTranslation()

  return (
    <article className="rounded-2xl border border-admin-border bg-white px-6 py-5 shadow-admin-card">
      <h3 className="text-[28px] font-extrabold leading-none tracking-tight text-gray-600">
        {t(titleKey)}
      </h3>

      <div className="mt-5 border-t border-admin-border pt-5">
        <div className="relative mx-auto flex h-[230px] max-w-[230px] items-center justify-center">
          <RadialBarChart
            width={230}
            height={230}
            cx="50%"
            cy="50%"
            innerRadius="74%"
            outerRadius="100%"
            startAngle={90}
            endAngle={-270}
            data={[{ value: remaining, fill: '#00B3A6' }]}
          >
            <PolarAngleAxis
              type="number"
              domain={[0, purchased]}
              tick={false}
            />
            <RadialBar background dataKey="value" cornerRadius={12} />
          </RadialBarChart>

          <div className="absolute flex flex-col items-center justify-center text-center">
            <p className="text-5xl font-extrabold leading-none text-admin-ink">
              {remaining}
            </p>
            <p className="mt-2 text-sm font-medium text-admin-muted">
              {t(centerLabelKey)}
            </p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-admin-border bg-admin-bg px-2 py-2 text-center">
            <p className="text-xs text-admin-muted">{t(remainingLabelKey)}</p>
            <p className="mt-1 text-sm font-bold text-admin-accent">
              {remaining}
            </p>
          </div>
          <div className="rounded-xl border border-admin-border bg-admin-bg px-2 py-2 text-center">
            <p className="text-xs text-admin-muted">{t(consumedLabelKey)}</p>
            <p className="mt-1 text-sm font-bold text-admin-ink">{consumed}</p>
          </div>
          <div className="rounded-xl border border-admin-border bg-admin-bg px-2 py-2 text-center">
            <p className="text-xs text-admin-muted">{t(purchasedLabelKey)}</p>
            <p className="mt-1 text-sm font-bold text-admin-ink">{purchased}</p>
          </div>
        </div>

        <Button fullWidth disabled className="mt-5">
          {t('dashboard.buyNewPackage')}
        </Button>
      </div>
    </article>
  )
}
