import { clsx } from 'clsx'
import type { InputHTMLAttributes, ReactNode } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
  trailingElement?: ReactNode
}

export default function Input({
  label,
  error,
  className,
  trailingElement,
  ...props
}: InputProps) {
  return (
    <div className="space-y-2">
      <label
        className="block text-sm font-semibold text-gray-600"
        htmlFor={props.id}
      >
        {label}
      </label>
      <div className="relative">
        <input
          className={clsx(
            'h-11 w-full rounded-xl border border-admin-border bg-white px-4 pe-12 text-sm text-admin-ink shadow-sm outline-none transition placeholder:text-admin-muted focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/20',
            error && 'border-red-400 focus:border-red-400 focus:ring-red-200',
            className,
          )}
          {...props}
        />
        {trailingElement ? (
          <div className="pointer-events-none absolute inset-y-0 end-3 flex items-center">
            <div className="pointer-events-auto">{trailingElement}</div>
          </div>
        ) : null}
      </div>
      {error ? <p className="text-xs text-red-500">{error}</p> : null}
    </div>
  )
}
