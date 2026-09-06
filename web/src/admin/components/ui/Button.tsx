import { clsx } from 'clsx'
import type { ButtonHTMLAttributes } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'secondary'
  fullWidth?: boolean
}

export default function Button({
  className,
  variant = 'primary',
  fullWidth,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex h-12 items-center justify-center rounded-xl px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
        variant === 'primary' &&
          'bg-admin-accent text-white shadow-[0_12px_30px_-15px_rgba(0,179,166,0.95)] hover:bg-admin-accent/90 focus-visible:ring-admin-accent',
        variant === 'ghost' &&
          'bg-transparent text-admin-sidebar-foreground hover:bg-white/10 focus-visible:ring-white',
        variant === 'secondary' &&
          'border border-admin-accent bg-white text-admin-accent hover:bg-admin-accent/10 focus-visible:ring-admin-accent',
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    />
  )
}
