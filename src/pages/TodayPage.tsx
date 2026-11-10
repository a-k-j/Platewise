import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Copy, Plus, RotateCcw, Sparkles } from 'lucide-react'
import type { EntryStatus, MealEntry, MealType } from '../types'
import { MEAL_TYPES, STATUS_MAP } from '../types'
import { isValidDateKey, todayKey } from '../lib/dates'
import { inferMealForNow } from '../lib/mealTime'
import { summarizeEntries } from '../lib/calculations'
import { formatCalories } from '../lib/format'
import { useSettings } from '../hooks/useSettings'
import { useDayEntries } from '../hooks/useMeals'
import { deleteEntry, duplicateEntry, updateEntryStatus } from '../services/mealService'
import { DateNavigator } from '../components/dashboard/DateNavigator'
import { CalorieSummaryCard } from '../components/dashboard/CalorieSummaryCard'
import { SnackBudgetCard } from '../components/dashboard/SnackBudgetCard'
import { MealSection } from '../components/dashboard/MealSection'
import { AddFoodSheet } from '../components/dashboard/AddFoodSheet'
import { EntryEditorSheet } from '../components/dashboard/EntryEditorSheet'
import {
  CopyDayDialog,
  CopyMealDialog,
  SaveCombinationDialog,
} from '../components/dashboard/CopyDialogs'
import { RepeatMealSheet } from '../components/dashboard/RepeatMealSheet'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { useToast } from '../components/ui/ToastProvider'

function mealForNow(): MealType {
  return inferMealForNow()
}

export function TodayPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { settings } = useSettings()
  const { toast } = useToast()

  const dateParam = searchParams.get('date')
  const date = dateParam && isValidDateKey(dateParam) ? dateParam : todayKey()

  const { entries } = useDayEntries(date)
  const summary = useMemo(() => summarizeEntries(entries, settings.dailyCalorieTarget), [entries, settings.dailyCalorieTarget])

  const entriesByMeal = useMemo(() => {
    const grouped = Object.fromEntries(MEAL_TYPES.map((meal) => [meal.value, [] as MealEntry[]])) as Record<
      MealType,
      MealEntry[]
    >
    for (const entry of entries) {
      grouped[entry.mealType].push(entry)
    }
    return grouped
  }, [entries])

  const [addOpen, setAddOpen] = useState(false)
  const [addMeal, setAddMeal] = useState<MealType>('breakfast')
  const [editingEntry, setEditingEntry] = useState<MealEntry | null>(null)
  const [copyDayOpen, setCopyDayOpen] = useState(false)
  const [copyMeal, setCopyMeal] = useState<MealType | null>(null)
  const [saveCombo, setSaveCombo] = useState<MealType | null>(null)
  const [repeatOpen, setRepeatOpen] = useState(false)
  const [pendingRemove, setPendingRemove] = useState<MealEntry | null>(null)

  const changeDate = (nextDate: string) => {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current)
        if (nextDate === todayKey()) next.delete('date')
        else next.set('date', nextDate)
        return next
      },
      { replace: true },
    )
  }

  const openAdd = (meal: MealType = mealForNow()) => {
    setAddMeal(meal)
    setAddOpen(true)
  }

  const handleStatusChange = async (entry: MealEntry, status: EntryStatus) => {
    try {
      await updateEntryStatus(entry.id as number, status)
      toast(`${entry.foodNameSnapshot} marked ${STATUS_MAP[status].label.toLowerCase()}`, 'success')
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Could not change that status.', 'error')
    }
  }

  const handleDuplicate = async (entry: MealEntry) => {
    try {
      await duplicateEntry(entry.id as number)
      toast(`${entry.foodNameSnapshot} duplicated as an option`, 'success')
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Could not duplicate that entry.', 'error')
    }
  }

  const handleRemove = async () => {
    if (!pendingRemove) return
    try {
      await deleteEntry(pendingRemove.id as number)
      toast(`${pendingRemove.foodNameSnapshot} removed`, 'info')
      setPendingRemove(null)
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Could not remove that entry.', 'error')
    }
  }

  return (
    <div>
      <DateNavigator date={date} target={settings.dailyCalorieTarget} onChangeDate={changeDate} />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => openAdd()} className="btn-primary h-10 px-3.5 text-xs">
          <Plus className="h-4 w-4" />
          Add food
        </button>
        <button type="button" onClick={() => setCopyDayOpen(true)} className="btn-secondary h-10 px-3 text-xs">
          <Copy className="h-3.5 w-3.5" />
          Copy day
        </button>
        <button type="button" onClick={() => setRepeatOpen(true)} className="btn-secondary h-10 px-3 text-xs">
          <RotateCcw className="h-3.5 w-3.5" />
          Repeat a meal
        </button>
        <span className="ml-auto hidden text-[11px] font-medium text-muted sm:inline">
          {entries.length} {entries.length === 1 ? 'entry' : 'entries'} · {formatCalories(summary.projected)} kcal
          projected
        </span>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <CalorieSummaryCard summary={summary} />
        <SnackBudgetCard summary={summary} onAddTreat={() => openAdd('treats')} />
      </div>

      {entries.length === 0 ? (
        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-dashed border-line bg-surface/60 p-4 sm:flex-row sm:items-center">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
            <Sparkles className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">Start by collecting a few options</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted">
              Add foods as <strong className="font-semibold text-ink">options</strong> while you decide, promote them to{' '}
              <strong className="font-semibold text-ink">planned</strong>, then mark them{' '}
              <strong className="font-semibold text-ink">eaten</strong>. Only eaten and planned food affects your
              calorie totals.
            </p>
          </div>
          <button type="button" onClick={() => openAdd('breakfast')} className="btn-secondary h-9 shrink-0 px-3 text-xs">
            Add breakfast
          </button>
        </div>
      ) : null}

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-2">
        {MEAL_TYPES.map((meal) => (
          <MealSection
            key={meal.value}
            mealType={meal.value}
            entries={entriesByMeal[meal.value]}
            onAdd={() => openAdd(meal.value)}
            onEdit={setEditingEntry}
            onStatusChange={(entry, status) => void handleStatusChange(entry, status)}
            onDuplicate={(entry) => void handleDuplicate(entry)}
            onRemove={setPendingRemove}
            onCopyMeal={() => setCopyMeal(meal.value)}
            onSaveCombination={() => setSaveCombo(meal.value)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => openAdd()}
        className="fixed right-4 z-30 flex h-14 items-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-accent-ink shadow-float transition-transform active:scale-95 lg:hidden"
        style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom))' }}
      >
        <Plus className="h-5 w-5" />
        Add food
      </button>

      <AddFoodSheet open={addOpen} onClose={() => setAddOpen(false)} date={date} initialMeal={addMeal} />

      <EntryEditorSheet
        entry={editingEntry}
        open={Boolean(editingEntry)}
        onClose={() => setEditingEntry(null)}
      />

      <CopyDayDialog open={copyDayOpen} date={date} onClose={() => setCopyDayOpen(false)} />

      <CopyMealDialog
        open={copyMeal !== null}
        date={date}
        mealType={copyMeal ?? 'breakfast'}
        onClose={() => setCopyMeal(null)}
      />

      <SaveCombinationDialog
        open={saveCombo !== null}
        date={date}
        mealType={saveCombo ?? 'breakfast'}
        onClose={() => setSaveCombo(null)}
      />

      <RepeatMealSheet open={repeatOpen} targetDate={date} onClose={() => setRepeatOpen(false)} />

      <ConfirmDialog
        open={pendingRemove !== null}
        title="Remove this entry?"
        description={
          pendingRemove
            ? `“${pendingRemove.foodNameSnapshot}” will be removed from this day. This cannot be undone.`
            : ''
        }
        confirmLabel="Remove entry"
        destructive
        onConfirm={handleRemove}
        onClose={() => setPendingRemove(null)}
      />
    </div>
  )
}
