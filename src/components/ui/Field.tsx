import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface FieldProps {
  label: string
  htmlFor?: string
  error?: string
  hint?: string
  children: ReactNode
  className?: string
}

export function Field({ label, htmlFor, error, hint, children, className }: FieldProps) {
  return (
    <div className={cn('block', className)}>
      <label htmlFor={htmlFor} className="label">
        {label}
      </label>
      {children}
      {error ? <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">{error}</p> : null}
      {!error && hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  )
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string; icon?: ReactNode }[]
  ariaLabel: string
}) {
  return (
    <div className="flex rounded-xl bg-surface-2 p-1" role="tablist" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-semibold transition-all',
            value === option.value
              ? 'bg-surface text-ink shadow-sm'
              : 'text-muted hover:text-ink',
          )}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  )
}
