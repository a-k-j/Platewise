import { useEffect, useState } from 'react'
import { CalendarDays, Loader2, Minus, Plus } from 'lucide-react'
import type { EntryStatus, FoodItem, MealType } from '../../types'
import { ENTRY_STATUSES, MEAL_TYPES } from '../../types'
import { todayKey } from '../../lib/dates'
import { formatCalories, formatMacro, formatQuantity } from '../../lib/format'
import { addFoodToMeal } from '../../services/mealService'
import { Sheet } from '../ui/Sheet'
import { Field } from '../ui/Field'
import { useToast } from '../ui/ToastProvider'

interface FoodAddDialogProps {
  open: boolean
  food: FoodItem | null
  onClose: () => void
  defaultMeal?: MealType
}

export function FoodAddDialog({ open, food, onClose, defaultMeal = 'lunch' }: FoodAddDialogProps) {
  const { toast } = useToast()
  const [date, setDate] = useState(todayKey())
  const [mealType, setMealType] = useState<MealType>(defaultMeal)
  const [quantity, setQuantity] = useState('1')
  const [status, setStatus] = useState<EntryStatus>('planned')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setDate(todayKey())
    setMealType(defaultMeal)
    setQuantity('1')
    setStatus('planned')
    setNotes('')
    setError('')
    setSaving(false)
  }, [open, defaultMeal, food])

  if (!food) return null

  const parsedQuantity = Number(quantity)
  const safeQuantity = Number.isFinite(parsedQuantity) && parsedQuantity > 0 ? parsedQuantity : 0
  const totalCalories = safeQuantity * food.calories

  const adjust = (delta: number) => {
    const next = Math.max(0.1, Math.round((safeQuantity + delta) * 100) / 100)
    setQuantity(formatQuantity(next))
  }

  const handleAdd = async () => {
    if (food.id == null) return
    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      setError('Quantity must be greater than zero.')
      return
    }
    setSaving(true)
    try {
      await addFoodToMeal(food.id, { date, mealType, quantity: parsedQuantity, status, notes })
      toast(`${food.name} added as ${status}`, 'success')
      onClose()
    } catch (addError) {
      toast(addError instanceof Error ? addError.message : 'Could not add that food.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const macros = [
    food.protein != null ? `P ${formatMacro(food.protein * safeQuantity)}g` : null,
    food.carbohydrates != null ? `C ${formatMacro(food.carbohydrates * safeQuantity)}g` : null,
    food.fat != null ? `F ${formatMacro(food.fat * safeQuantity)}g` : null,
  ].filter(Boolean)

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Add to a meal"
      description={`${food.name} · ${food.servingDescription}`}
      size="sm"
      footer={
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={saving}>
            Cancel
          </button>
          <button type="button" onClick={() => void handleAdd()} className="btn-primary flex-1" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add {formatCalories(totalCalories)} kcal
          </button>
        </div>
      }
    >
      <div className="rounded-xl border border-line bg-surface-2/50 p-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="stat-label">This addition</p>
            <p className="num text-2xl font-bold tracking-tight text-ink">{formatCalories(totalCalories)}</p>
            <p className="text-[10px] font-medium text-muted">kcal</p>
          </div>
          {macros.length > 0 ? (
            <p className="num text-right text-[10px] font-medium leading-relaxed text-muted">
              {macros.map((macro) => (
                <span key={macro} className="block">
                  {macro}
                </span>
              ))}
            </p>
          ) : null}
        </div>
        <p className="mt-2 text-[11px] text-muted">
          1 × {food.servingDescription} = {formatCalories(food.calories)} kcal
          {food.nutritionBasis === 'per_100g' ? ' (per 100 g)' : ''}
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field label="Date" htmlFor="library-add-date">
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              id="library-add-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="input pl-9"
            />
          </div>
        </Field>
        <Field label="Meal" htmlFor="library-add-meal">
          <select
            id="library-add-meal"
            value={mealType}
            onChange={(event) => setMealType(event.target.value as MealType)}
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

      <div className="mt-4">
        <span className="label">Quantity</span>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => adjust(-0.5)} className="icon-btn h-11 w-11 border border-line bg-surface" aria-label="Decrease quantity">
            <Minus className="h-4 w-4" />
          </button>
          <input
            type="number"
            min="0.1"
            step="0.25"
            inputMode="decimal"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            className="input h-11 text-center text-base font-semibold"
            aria-label="Quantity"
          />
          <button type="button" onClick={() => adjust(0.5)} className="icon-btn h-11 w-11 border border-line bg-surface" aria-label="Increase quantity">
            <Plus className="h-4 w-4" />
          </button>
        </div>
        {error ? <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">{error}</p> : null}
        <div className="mt-2 flex gap-1.5">
          {[0.5, 1, 1.5, 2].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setQuantity(formatQuantity(preset))}
              className="h-7 rounded-full border border-line bg-surface px-2.5 text-[11px] font-semibold text-muted transition-colors hover:text-ink"
            >
              × {preset}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <Field label="Status" htmlFor="library-add-status" hint="Options and skipped food don't count toward totals.">
          <select
            id="library-add-status"
            value={status}
            onChange={(event) => setStatus(event.target.value as EntryStatus)}
            className="select"
          >
            {ENTRY_STATUSES.map((entryStatus) => (
              <option key={entryStatus.value} value={entryStatus.value}>
                {entryStatus.label} — {entryStatus.description}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="mt-4">
        <Field label="Notes" htmlFor="library-add-notes" hint="Optional.">
          <input
            id="library-add-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="input"
            placeholder="Add a note…"
          />
        </Field>
      </div>
    </Sheet>
  )
}
