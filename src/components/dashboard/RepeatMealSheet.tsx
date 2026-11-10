import { useMemo, useState } from 'react'
import { Loader2, RotateCcw } from 'lucide-react'
import type { MealType } from '../../types'
import { MEAL_TYPE_MAP } from '../../types'
import { formatShortDate, todayKey } from '../../lib/dates'
import { entryCalories, findRecentMeals } from '../../lib/calculations'
import { formatCalories } from '../../lib/format'
import { useRecentEatenEntries } from '../../hooks/useMeals'
import { copyMealToDate } from '../../services/mealService'
import { Sheet } from '../ui/Sheet'
import { EmptyState } from '../ui/EmptyState'
import { MEAL_ICONS, MEAL_ICON_STYLES } from '../meals/mealIcons'
import { cn } from '../../lib/cn'
import { useToast } from '../ui/ToastProvider'

interface RepeatMealSheetProps {
  open: boolean
  targetDate: string
  onClose: () => void
}

export function RepeatMealSheet({ open, targetDate, onClose }: RepeatMealSheetProps) {
  const { entries } = useRecentEatenEntries(28)
  const { toast } = useToast()
  const [busyKey, setBusyKey] = useState<string | null>(null)

  const recentMeals = useMemo(() => findRecentMeals(entries, todayKey(), 10), [entries])

  const handleRepeat = async (date: string, mealType: MealType) => {
    const key = `${date}-${mealType}`
    setBusyKey(key)
    try {
      const count = await copyMealToDate(date, mealType, targetDate, mealType)
      toast(`${count} ${count === 1 ? 'item' : 'items'} added as planned`, 'success')
      onClose()
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Could not repeat that meal.', 'error')
    } finally {
      setBusyKey(null)
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Repeat a recent meal"
      description="Pick a meal you've eaten before. Its items are added to the selected date as planned."
      size="sm"
    >
      {recentMeals.length === 0 ? (
        <EmptyState
          icon={RotateCcw}
          title="No recent eaten meals"
          description="Once you mark food as eaten, that meal will show up here for quick reuse."
          compact
        />
      ) : (
        <div className="space-y-2">
          {recentMeals.map((meal) => {
            const Icon = MEAL_ICONS[meal.mealType]
            const total = meal.entries.reduce((sum, entry) => sum + entryCalories(entry), 0)
            const key = `${meal.date}-${meal.mealType}`
            return (
              <div key={key} className="rounded-xl border border-line bg-surface p-3">
                <div className="flex items-start gap-2.5">
                  <span
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                      MEAL_ICON_STYLES[meal.mealType],
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">
                      {MEAL_TYPE_MAP[meal.mealType].label}{' '}
                      <span className="font-normal text-muted">· {formatShortDate(meal.date)}</span>
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted">
                      {meal.entries.length} {meal.entries.length === 1 ? 'item' : 'items'} ·{' '}
                      {formatCalories(total)} kcal
                    </p>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-muted">
                      {meal.entries.map((entry) => entry.foodNameSnapshot).join(', ')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleRepeat(meal.date, meal.mealType)}
                    disabled={busyKey === key}
                    className="btn-secondary h-8 shrink-0 px-2.5 text-[11px]"
                  >
                    {busyKey === key ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RotateCcw className="h-3.5 w-3.5" />
                    )}
                    Repeat
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Sheet>
  )
}
