import { CircleDashed, Clock3, Check, SkipForward, type LucideIcon } from 'lucide-react'
import type { EntryStatus } from '../../types'
import { cn } from '../../lib/cn'

export const STATUS_STYLES: Record<
  EntryStatus,
  { label: string; icon: LucideIcon; badge: string; dot: string; soft: string }
> = {
  option: {
    label: 'Option',
    icon: CircleDashed,
    badge: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
    dot: 'bg-sky-500',
    soft: 'bg-sky-50 dark:bg-sky-500/10',
  },
  planned: {
    label: 'Planned',
    icon: Clock3,
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
    dot: 'bg-amber-500',
    soft: 'bg-amber-50 dark:bg-amber-500/10',
  },
  eaten: {
    label: 'Eaten',
    icon: Check,
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
    dot: 'bg-emerald-500',
    soft: 'bg-emerald-50 dark:bg-emerald-500/10',
  },
  skipped: {
    label: 'Skipped',
    icon: SkipForward,
    badge: 'bg-stone-200 text-stone-600 dark:bg-stone-500/20 dark:text-stone-300',
    dot: 'bg-stone-400',
    soft: 'bg-stone-100 dark:bg-stone-500/10',
  },
}

interface StatusBadgeProps {
  status: EntryStatus
  onClick?: () => void
  className?: string
}

export function StatusBadge({ status, onClick, className }: StatusBadgeProps) {
  const meta = STATUS_STYLES[status]
  const Icon = meta.icon
  const classes = cn('pill transition-colors', meta.badge, onClick && 'hover:opacity-80 active:scale-95', className)

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={classes} aria-label={`Status: ${meta.label}. Change status`}>
        <Icon className="h-3 w-3" />
        {meta.label}
      </button>
    )
  }

  return (
    <span className={classes}>
      <Icon className="h-3 w-3" />
      {meta.label}
    </span>
  )
}
