import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Check } from 'lucide-react'
import type { EntryStatus } from '../../types'
import { ENTRY_STATUSES } from '../../types'
import { cn } from '../../lib/cn'
import { STATUS_STYLES } from './StatusBadge'

interface StatusMenuProps {
  value: EntryStatus
  onChange: (status: EntryStatus) => void
  children: (controls: { open: boolean; toggle: () => void }) => ReactNode
  align?: 'left' | 'right'
}

export function StatusMenu({ value, onChange, children, align = 'left' }: StatusMenuProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div className="relative" ref={containerRef}>
      {children({ open, toggle: () => setOpen((current) => !current) })}
      {open ? (
        <div
          className={cn(
            'absolute top-full z-30 mt-1.5 w-52 rounded-xl border border-line bg-surface p-1.5 shadow-xl animate-fade-in',
            align === 'right' ? 'right-0' : 'left-0',
          )}
          role="menu"
        >
          <p className="px-2.5 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
            Change status
          </p>
          {ENTRY_STATUSES.map((status) => {
            const meta = STATUS_STYLES[status.value]
            const Icon = meta.icon
            return (
              <button
                key={status.value}
                type="button"
                role="menuitem"
                onClick={() => {
                  onChange(status.value)
                  setOpen(false)
                }}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-surface-2',
                  value === status.value && 'bg-surface-2',
                )}
              >
                <span className={cn('flex h-6 w-6 items-center justify-center rounded-full', meta.badge)}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="flex-1 font-medium text-ink">{status.label}</span>
                {value === status.value ? <Check className="h-3.5 w-3.5 text-accent" /> : null}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

export function StatusPicker({
  value,
  onChange,
}: {
  value: EntryStatus
  onChange: (status: EntryStatus) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {ENTRY_STATUSES.map((status) => {
        const meta = STATUS_STYLES[status.value]
        const Icon = meta.icon
        const active = value === status.value
        return (
          <button
            key={status.value}
            type="button"
            onClick={() => onChange(status.value)}
            className={cn(
              'flex items-start gap-2.5 rounded-xl border p-3 text-left transition-all',
              active
                ? 'border-accent bg-accent-soft/60 ring-1 ring-accent/20'
                : 'border-line bg-surface hover:bg-surface-2',
            )}
            aria-pressed={active}
          >
            <span className={cn('mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full', meta.badge)}>
              <Icon className="h-3.5 w-3.5" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-ink">{status.label}</span>
              <span className="mt-0.5 block text-[11px] leading-snug text-muted">{status.description}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
