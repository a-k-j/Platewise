import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Copy, Loader2 } from 'lucide-react'
import type { MealType } from '../../types'
import { MEAL_TYPES, MEAL_TYPE_MAP } from '../../types'
import { addDays, formatLongDate } from '../../lib/dates'
import { formatCalories } from '../../lib/format'
import { entryCalories } from '../../lib/calculations'
import { useDayEntries } from '../../hooks/useMeals'
import { copyDayToDate, copyMealToDate, saveMealAsCombination } from '../../services/mealService'
import { Sheet } from '../ui/Sheet'
import { Field } from '../ui/Field'
import { useToast } from '../ui/ToastProvider'

interface CopyDayDialogProps {
  open: boolean
  date: string
  onClose: () => void
}

export function CopyDayDialog({ open, date, onClose }: CopyDayDialogProps) {
  const { toast } = useToast()
  const [targetDate, setTargetDate] = useState(addDays(date, 1))
  const [busy, setBusy] = useState(false)
  const { entries: sourceEntries } = useDayEntries(date)
  const { entries: targetEntries } = useDayEntries(targetDate)

  useEffect(() => {
    if (open) {
      setTargetDate(addDays(date, 1))
      setBusy(false)
    }
  }, [open, date])

  const sameDate = targetDate === date

  const handleCopy = async () => {
    setBusy(true)
    try {
      const count = await copyDayToDate(date, targetDate)
      toast(`${count} ${count === 1 ? 'entry' : 'entries'} copied to ${formatLongDate(targetDate)}`, 'success')
      onClose()
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Could not copy that day.', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Copy day"
      description="Copy every meal entry to another date. Eaten items become planned so they don't double-count."
      size="sm"
      footer={
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="btn-primary flex-1"
            disabled={busy || sameDate || sourceEntries.length === 0}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
            Copy {sourceEntries.length} entries
          </button>
        </div>
      }
    >
      <div className="rounded-xl border border-line bg-surface-2/50 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Copying from</p>
        <p className="mt-0.5 text-sm font-semibold text-ink">{formatLongDate(date)}</p>
        <p className="mt-0.5 text-[11px] text-muted">
          {sourceEntries.length} {sourceEntries.length === 1 ? 'entry' : 'entries'}
          {sourceEntries.length > 0
            ? ` · ${formatCalories(sourceEntries.reduce((total, entry) => total + entryCalories(entry), 0))} kcal considered`
            : ''}
        </p>
      </div>

      <div className="mt-4">
        <Field label="Copy to date" htmlFor="copy-day-target">
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              id="copy-day-target"
              type="date"
              value={targetDate}
              onChange={(event) => setTargetDate(event.target.value)}
              className="input pl-9"
            />
          </div>
        </Field>
        <p className="mt-1.5 text-xs text-muted">{formatLongDate(targetDate)}</p>
      </div>

      {sameDate ? (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:bg-red-500/10 dark:text-red-300">
          Choose a different date.
        </p>
      ) : targetEntries.length > 0 ? (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
          That date already has {targetEntries.length} {targetEntries.length === 1 ? 'entry' : 'entries'}. The copied
          meals will be added alongside them.
        </p>
      ) : null}
    </Sheet>
  )
}

interface CopyMealDialogProps {
  open: boolean
  date: string
  mealType: MealType
  onClose: () => void
}

export function CopyMealDialog({ open, date, mealType, onClose }: CopyMealDialogProps) {
  const { toast } = useToast()
  const [targetDate, setTargetDate] = useState(addDays(date, 1))
  const [targetMealType, setTargetMealType] = useState<MealType>(mealType)
  const [busy, setBusy] = useState(false)
  const { entries } = useDayEntries(date)
  const { entries: targetEntries } = useDayEntries(targetDate)

  useEffect(() => {
    if (open) {
      setTargetDate(addDays(date, 1))
      setTargetMealType(mealType)
      setBusy(false)
    }
  }, [open, date, mealType])

  const sourceEntries = useMemo(() => entries.filter((entry) => entry.mealType === mealType), [entries, mealType])
  const sameTarget = targetDate === date && targetMealType === mealType
  const targetCount = targetEntries.filter((entry) => entry.mealType === targetMealType).length
  const totalCalories = sourceEntries.reduce((total, entry) => total + entryCalories(entry), 0)

  const handleCopy = async () => {
    setBusy(true)
    try {
      const count = await copyMealToDate(date, mealType, targetDate, targetMealType)
      toast(`${count} ${count === 1 ? 'entry' : 'entries'} copied`, 'success')
      onClose()
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Could not copy that meal.', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={`Copy ${MEAL_TYPE_MAP[mealType].label.toLowerCase()}`}
      description="Copy this meal to another date or meal. Eaten items become planned."
      size="sm"
      footer={
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="btn-primary flex-1"
            disabled={busy || sameTarget || sourceEntries.length === 0}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
            Copy meal
          </button>
        </div>
      }
    >
      <div className="rounded-xl border border-line bg-surface-2/50 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Copying</p>
        <p className="mt-0.5 text-sm font-semibold text-ink">{MEAL_TYPE_MAP[mealType].label}</p>
        <p className="mt-0.5 text-[11px] text-muted">
          {formatLongDate(date)} · {sourceEntries.length} {sourceEntries.length === 1 ? 'entry' : 'entries'} ·{' '}
          {formatCalories(totalCalories)} kcal
        </p>
      </div>

      <div className="mt-4 grid gap-3">
        <Field label="Copy to date" htmlFor="copy-meal-date">
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              id="copy-meal-date"
              type="date"
              value={targetDate}
              onChange={(event) => setTargetDate(event.target.value)}
              className="input pl-9"
            />
          </div>
        </Field>
        <Field label="Into meal" htmlFor="copy-meal-type">
          <select
            id="copy-meal-type"
            value={targetMealType}
            onChange={(event) => setTargetMealType(event.target.value as MealType)}
            className="select"
          >
            {MEAL_TYPES.map((meal) => (
              <option key={meal.value} value={meal.value}>
                {meal.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {sameTarget ? (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:bg-red-500/10 dark:text-red-300">
          Choose a different date or meal.
        </p>
      ) : targetCount > 0 ? (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
          That meal already has {targetCount} {targetCount === 1 ? 'entry' : 'entries'}. The copied food will be added
          alongside them.
        </p>
      ) : null}
    </Sheet>
  )
}

interface SaveCombinationDialogProps {
  open: boolean
  date: string
  mealType: MealType
  onClose: () => void
}

export function SaveCombinationDialog({ open, date, mealType, onClose }: SaveCombinationDialogProps) {
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)
  const { entries } = useDayEntries(date)

  const mealEntries = useMemo(() => entries.filter((entry) => entry.mealType === mealType), [entries, mealType])

  useEffect(() => {
    if (open) {
      setName(`${MEAL_TYPE_MAP[mealType].label} combo`)
      setDescription('')
      setBusy(false)
    }
  }, [open, mealType])

  const handleSave = async () => {
    setBusy(true)
    try {
      await saveMealAsCombination(date, mealType, name, description)
      toast('Meal combination saved', 'success')
      onClose()
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Could not save that combination.', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Save meal as combination"
      description="Reuse this exact set of foods later from the Saved tab in Add food."
      size="sm"
      footer={
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            className="btn-primary flex-1"
            disabled={busy || !name.trim() || mealEntries.length === 0}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save combination
          </button>
        </div>
      }
    >
      <div className="rounded-xl border border-line bg-surface-2/50 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Saving</p>
        <p className="mt-0.5 text-sm font-semibold text-ink">
          {MEAL_TYPE_MAP[mealType].label} · {mealEntries.length} {mealEntries.length === 1 ? 'item' : 'items'}
        </p>
        <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted">
          {mealEntries.map((entry) => entry.foodNameSnapshot).join(', ')}
        </p>
      </div>

      <div className="mt-4 space-y-3">
        <Field label="Combination name" htmlFor="combo-name">
          <input
            id="combo-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="input"
            placeholder="e.g. Weekday breakfast"
          />
        </Field>
        <Field label="Description" htmlFor="combo-description" hint="Optional.">
          <input
            id="combo-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="input"
            placeholder="What makes this meal useful?"
          />
        </Field>
      </div>
    </Sheet>
  )
}
