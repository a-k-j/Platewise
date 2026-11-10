import { useEffect, useState } from 'react'
import { Loader2, Minus, Plus, Trash2 } from 'lucide-react'
import type { EntryStatus, MealEntry, MealType } from '../../types'
import { MEAL_TYPES } from '../../types'
import { formatCalories, formatMacro, formatQuantity } from '../../lib/format'
import { cn } from '../../lib/cn'
import { deleteEntry, updateEntry } from '../../services/mealService'
import { Sheet } from '../ui/Sheet'
import { Field } from '../ui/Field'
import { StatusPicker } from '../ui/StatusMenu'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { useToast } from '../ui/ToastProvider'

interface EntryEditorSheetProps {
  entry: MealEntry | null
  open: boolean
  onClose: () => void
}

export function EntryEditorSheet({ entry, open, onClose }: EntryEditorSheetProps) {
  const { toast } = useToast()
  const [quantity, setQuantity] = useState('1')
  const [status, setStatus] = useState<EntryStatus>('option')
  const [mealType, setMealType] = useState<MealType>('breakfast')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (!entry) return
    setQuantity(formatQuantity(entry.quantity))
    setStatus(entry.status)
    setMealType(entry.mealType)
    setNotes(entry.notes)
    setError('')
    setSaving(false)
    setConfirmDelete(false)
  }, [entry])

  if (!entry) return null

  const parsedQuantity = Number(quantity)
  const safeQuantity = Number.isFinite(parsedQuantity) && parsedQuantity > 0 ? parsedQuantity : 0
  const totalCalories = safeQuantity * entry.caloriesSnapshot
  const macros = [
    entry.proteinSnapshot != null ? `P ${formatMacro(safeQuantity * entry.proteinSnapshot)}g` : null,
    entry.carbohydratesSnapshot != null ? `C ${formatMacro(safeQuantity * entry.carbohydratesSnapshot)}g` : null,
    entry.fatSnapshot != null ? `F ${formatMacro(safeQuantity * entry.fatSnapshot)}g` : null,
  ].filter(Boolean)

  const adjustQuantity = (delta: number) => {
    const next = Math.max(0.1, Math.round((safeQuantity + delta) * 100) / 100)
    setQuantity(formatQuantity(next))
  }

  const handleSave = async () => {
    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      setError('Quantity must be greater than zero.')
      return
    }
    if (parsedQuantity > 100) {
      setError('Quantity looks too large.')
      return
    }
    setError('')
    setSaving(true)
    try {
      await updateEntry(entry.id as number, {
        quantity: parsedQuantity,
        status,
        mealType,
        notes,
      })
      toast(`${entry.foodNameSnapshot} updated`, 'success')
      onClose()
    } catch (saveError) {
      toast(saveError instanceof Error ? saveError.message : 'Could not update that entry.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteEntry(entry.id as number)
      toast(`${entry.foodNameSnapshot} removed`, 'info')
      setConfirmDelete(false)
      onClose()
    } catch (deleteError) {
      toast(deleteError instanceof Error ? deleteError.message : 'Could not remove that entry.', 'error')
    }
  }

  return (
    <>
      <Sheet
        open={open}
        onClose={onClose}
        title="Edit meal entry"
        description="Change quantity, status, or which meal this belongs to."
        footer={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="icon-btn h-10 w-10 border border-line text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
              aria-label="Remove entry"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={saving}>
              Cancel
            </button>
            <button type="button" onClick={() => void handleSave()} className="btn-primary flex-1" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save changes
            </button>
          </div>
        }
      >
        <div className="rounded-2xl border border-line bg-surface-2/50 p-4">
          <p className="text-base font-semibold text-ink">{entry.foodNameSnapshot}</p>
          <p className="mt-0.5 text-xs text-muted">
            1 × {entry.servingDescriptionSnapshot} = {formatCalories(entry.caloriesSnapshot)} kcal
          </p>
          <div className="mt-3 flex items-end justify-between gap-3">
            <div>
              <p className="stat-label">Entry total</p>
              <p className="num text-3xl font-bold tracking-tight text-ink">{formatCalories(totalCalories)}</p>
              <p className="text-[11px] font-medium text-muted">kcal</p>
            </div>
            {macros.length > 0 ? (
              <p className="num text-right text-[11px] font-medium leading-relaxed text-muted">
                {macros.map((macro) => (
                  <span key={macro} className="block">
                    {macro}
                  </span>
                ))}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-4">
          <span className="label">Quantity</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => adjustQuantity(-0.5)}
              className="icon-btn h-11 w-11 shrink-0 border border-line bg-surface"
              aria-label="Decrease quantity"
            >
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
            <button
              type="button"
              onClick={() => adjustQuantity(0.5)}
              className="icon-btn h-11 w-11 shrink-0 border border-line bg-surface"
              aria-label="Increase quantity"
            >
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
                className={cn(
                  'h-7 rounded-full border px-2.5 text-[11px] font-semibold transition-colors',
                  Number(quantity) === preset
                    ? 'border-accent bg-accent-soft text-accent'
                    : 'border-line bg-surface text-muted hover:text-ink',
                )}
              >
                × {preset}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <span className="label">Status</span>
          <StatusPicker value={status} onChange={setStatus} />
        </div>

        <div className="mt-4">
          <Field label="Meal" htmlFor="entry-meal">
            <select
              id="entry-meal"
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
          <Field label="Notes" htmlFor="entry-notes" hint="Optional — preparation, brand, or how it fit your day.">
            <textarea
              id="entry-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={2}
              className="input !h-auto min-h-[72px] resize-y py-2.5"
              placeholder="Add a note…"
            />
          </Field>
        </div>

        <p className="mt-4 text-[10px] leading-relaxed text-muted">
          This entry keeps its own nutrition snapshot. Editing the food library later won't change this history.
        </p>
      </Sheet>

      <ConfirmDialog
        open={confirmDelete}
        title="Remove this entry?"
        description={`“${entry.foodNameSnapshot}” will be removed from ${MEAL_TYPES.find((meal) => meal.value === entry.mealType)?.label.toLowerCase()}. This cannot be undone.`}
        confirmLabel="Remove entry"
        destructive
        onConfirm={handleDelete}
        onClose={() => setConfirmDelete(false)}
      />
    </>
  )
}
