import { Copy, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import type { EntryStatus, MealEntry } from '../../types'
import { entryCalories, entryCarbohydrates, entryFat, entryProtein } from '../../lib/calculations'
import { formatCalories, formatMacro, formatQuantity } from '../../lib/format'
import { cn } from '../../lib/cn'
import { ActionMenu } from '../ui/ActionMenu'
import { StatusMenu } from '../ui/StatusMenu'
import { StatusBadge } from '../ui/StatusBadge'

interface MealEntryRowProps {
  entry: MealEntry
  onEdit: () => void
  onStatusChange: (status: EntryStatus) => void
  onDuplicate: () => void
  onRemove: () => void
}

export function MealEntryRow({ entry, onEdit, onStatusChange, onDuplicate, onRemove }: MealEntryRowProps) {
  const macros = [
    entry.proteinSnapshot != null ? `P ${formatMacro(entryProtein(entry))}g` : null,
    entry.carbohydratesSnapshot != null ? `C ${formatMacro(entryCarbohydrates(entry))}g` : null,
    entry.fatSnapshot != null ? `F ${formatMacro(entryFat(entry))}g` : null,
  ].filter(Boolean)

  return (
    <div
      className={cn(
        'group flex items-start gap-2.5 rounded-xl px-2 py-2.5 transition-colors hover:bg-surface-2/60',
        entry.status === 'skipped' && 'opacity-55',
      )}
    >
      <div className="pt-0.5">
        <StatusMenu value={entry.status} onChange={onStatusChange}>
          {({ toggle }) => <StatusBadge status={entry.status} onClick={toggle} />}
        </StatusMenu>
      </div>

      <button type="button" onClick={onEdit} className="min-w-0 flex-1 text-left">
        <div className="flex items-start justify-between gap-3">
          <p
            className={cn(
              'min-w-0 text-sm font-medium leading-snug text-ink',
              entry.status === 'skipped' && 'line-through',
              entry.status === 'option' && 'text-ink/80',
            )}
          >
            {entry.foodNameSnapshot}
          </p>
          <span className="num shrink-0 text-sm font-semibold text-ink">{formatCalories(entryCalories(entry))}</span>
        </div>
        <p className="mt-0.5 truncate text-[11px] font-medium text-muted">
          {formatQuantity(entry.quantity)} × {entry.servingDescriptionSnapshot}
        </p>
        {macros.length > 0 ? (
          <p className="num mt-0.5 text-[10px] font-medium text-muted/80">{macros.join(' · ')}</p>
        ) : null}
        {entry.notes ? <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-muted">{entry.notes}</p> : null}
      </button>

      <div className="-mr-1 -mt-0.5">
        <ActionMenu
          items={[
            { label: 'Edit quantity & details', icon: Pencil, onSelect: onEdit },
            { label: 'Duplicate as option', icon: Copy, onSelect: onDuplicate },
            { label: 'Remove entry', icon: Trash2, onSelect: onRemove, destructive: true },
          ]}
        >
          {({ toggle }) => (
            <button type="button" onClick={toggle} className="icon-btn h-8 w-8" aria-label={`Actions for ${entry.foodNameSnapshot}`}>
              <MoreHorizontal className="h-4 w-4" />
            </button>
          )}
        </ActionMenu>
      </div>
    </div>
  )
}
