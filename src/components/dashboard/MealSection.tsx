import { useState } from 'react'
import { Bookmark, ChevronDown, Copy, MoreHorizontal, Plus } from 'lucide-react'
import type { EntryStatus, MealEntry, MealType } from '../../types'
import { MEAL_TYPE_MAP } from '../../types'
import { summarizeEntries } from '../../lib/calculations'
import { formatCalories } from '../../lib/format'
import { cn } from '../../lib/cn'
import { ActionMenu } from '../ui/ActionMenu'
import { MEAL_ICONS, MEAL_ICON_STYLES } from '../meals/mealIcons'
import { MealEntryRow } from './MealEntryRow'

interface MealSectionProps {
  mealType: MealType
  entries: MealEntry[]
  onAdd: () => void
  onEdit: (entry: MealEntry) => void
  onStatusChange: (entry: MealEntry, status: EntryStatus) => void
  onDuplicate: (entry: MealEntry) => void
  onRemove: (entry: MealEntry) => void
  onCopyMeal: () => void
  onSaveCombination: () => void
}

export function MealSection({
  mealType,
  entries,
  onAdd,
  onEdit,
  onStatusChange,
  onDuplicate,
  onRemove,
  onCopyMeal,
  onSaveCombination,
}: MealSectionProps) {
  const meta = MEAL_TYPE_MAP[mealType]
  const Icon = MEAL_ICONS[mealType]
  const storageKey = `platewise-collapsed-${mealType}`
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(storageKey) === '1'
    } catch {
      return false
    }
  })

  const totals = summarizeEntries(entries, 0)
  const summaryParts: string[] = []
  if (totals.eatenCount > 0) summaryParts.push(`${formatCalories(totals.consumed)} kcal eaten`)
  if (totals.plannedCount > 0) summaryParts.push(`${formatCalories(totals.planned)} kcal planned`)
  if (totals.optionCount > 0) {
    summaryParts.push(`${totals.optionCount} ${totals.optionCount === 1 ? 'option' : 'options'}`)
  }
  if (totals.skippedCount > 0) {
    summaryParts.push(`${totals.skippedCount} skipped`)
  }
  const summary = summaryParts.length > 0 ? summaryParts.join(' · ') : 'No food added yet'

  const toggleCollapsed = () => {
    const next = !collapsed
    setCollapsed(next)
    try {
      localStorage.setItem(storageKey, next ? '1' : '0')
    } catch {
      // Persisting collapse state is a nice-to-have only.
    }
  }

  const handleAdd = () => {
    if (collapsed) {
      setCollapsed(false)
      try {
        localStorage.setItem(storageKey, '0')
      } catch {
        // Ignore storage failures.
      }
    }
    onAdd()
  }

  return (
    <section className="card p-2.5 sm:p-3" aria-labelledby={`meal-${mealType}`}>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={toggleCollapsed}
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-1.5 py-1.5 text-left transition-colors hover:bg-surface-2/60"
          aria-expanded={!collapsed}
        >
          <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', MEAL_ICON_STYLES[mealType])}>
            <Icon className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5">
              <span id={`meal-${mealType}`} className="truncate text-sm font-semibold text-ink">
                {meta.label}
              </span>
              <ChevronDown
                className={cn('h-3.5 w-3.5 shrink-0 text-muted transition-transform', collapsed && '-rotate-90')}
              />
            </span>
            <span className="mt-0.5 block truncate text-[11px] font-medium text-muted">{summary}</span>
          </span>
        </button>

        <button
          type="button"
          onClick={handleAdd}
          className="icon-btn border border-line bg-surface"
          aria-label={`Add food to ${meta.label}`}
        >
          <Plus className="h-4 w-4" />
        </button>

        <ActionMenu
          items={[
            { label: 'Copy this meal…', icon: Copy, onSelect: onCopyMeal, disabled: entries.length === 0 },
            {
              label: 'Save as combination…',
              icon: Bookmark,
              onSelect: onSaveCombination,
              disabled: entries.length === 0,
            },
          ]}
        >
          {({ toggle }) => (
            <button
              type="button"
              onClick={toggle}
              className="icon-btn"
              aria-label={`More actions for ${meta.label}`}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          )}
        </ActionMenu>
      </div>

      {!collapsed ? (
        <div className="mt-1.5">
          {entries.length === 0 ? (
            <button
              type="button"
              onClick={handleAdd}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line px-4 py-5 text-xs font-medium text-muted transition-colors hover:border-accent/40 hover:bg-surface-2/50 hover:text-ink"
            >
              <Plus className="h-3.5 w-3.5" />
              Add food to {meta.shortLabel.toLowerCase()}
            </button>
          ) : (
            <div className="space-y-0.5">
              {entries.map((entry) => (
                <MealEntryRow
                  key={entry.id}
                  entry={entry}
                  onEdit={() => onEdit(entry)}
                  onStatusChange={(status) => onStatusChange(entry, status)}
                  onDuplicate={() => onDuplicate(entry)}
                  onRemove={() => onRemove(entry)}
                />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </section>
  )
}
