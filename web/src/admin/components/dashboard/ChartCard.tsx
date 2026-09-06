import type { PropsWithChildren } from 'react'

type ChartCardProps = PropsWithChildren<{
  title: string
}>

export default function ChartCard({ title, children }: ChartCardProps) {
  return (
    <article className="rounded-2xl border border-admin-border bg-white px-6 py-5 shadow-admin-card">
      <h3 className="text-[24px] font-extrabold leading-none tracking-tight text-gray-600">
        {title}
      </h3>
      <div className="mt-5 border-t border-admin-border pt-5">{children}</div>
    </article>
  )
}
