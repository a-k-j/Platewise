import { useEffect, useState } from 'react'
import { CalendarDays, Loader2, Scale } from 'lucide-react'
import type { WeightEntry } from '../../types'
import { todayKey } from '../../lib/dates'
import { validateWeightDraft, hasErrors, type ValidationErrors } from '../../lib/validation'
import { updateWeightEntry, upsertWeightEntry } from '../../services/weightService'
import { Sheet } from '../ui/Sheet'
import { Field } from '../ui/Field'
import { useToast } from '../ui/ToastProvider'

interface WeightEditorSheetProps {
  open: boolean
  entry: WeightEntry | null
  onClose: () => void
}

export function WeightEditorSheet({ open, entry, onClose }: WeightEditorSheetProps) {
  const { toast } = useToast()
  const [date, setDate] = useState(todayKey())
  const [weight, setWeight] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setDate(entry?.date ?? todayKey())
    setWeight(entry ? entry.weightKg.toFixed(1) : '')
    setNotes(entry?.notes ?? '')
    setErrors({})
    setSaving(false)
  }, [open, entry])

  const handleSave = async () => {
    const weightKg = Number(weight)
    const draft = { date, weightKg, notes }
    const validation = validateWeightDraft(draft)
    setErrors(validation)
    if (hasErrors(validation)) return

    setSaving(true)
    try {
      if (entry?.id != null) {
        await updateWeightEntry(entry.id, draft)
        toast('Weight updated', 'success')
      } else {
        await upsertWeightEntry(draft)
        toast('Weight logged', 'success')
      }
      onClose()
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Could not save that weight.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={entry ? 'Edit weight' : 'Log weight'}
      description="One entry per date. Saving a date that already exists updates that entry."
      size="sm"
      footer={
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={saving}>
            Cancel
          </button>
          <button type="button" onClick={() => void handleSave()} className="btn-primary flex-1" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Scale className="h-4 w-4" />}
            {entry ? 'Save changes' : 'Log weight'}
          </button>
        </div>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Date" htmlFor="weight-date" error={errors.date}>
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              id="weight-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="input pl-9"
            />
          </div>
        </Field>
        <Field label="Weight (kg)" htmlFor="weight-value" error={errors.weightKg}>
          <div className="relative">
            <input
              id="weight-value"
              type="number"
              min="0.1"
              step="0.1"
              inputMode="decimal"
              value={weight}
              onChange={(event) => setWeight(event.target.value)}
              className="input pr-12"
              placeholder="e.g. 72.5"
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium text-muted">
              kg
            </span>
          </div>
        </Field>
      </div>

      <div className="mt-4">
        <Field label="Notes" htmlFor="weight-notes" hint="Optional — time of day, context, etc.">
          <input
            id="weight-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="input"
            placeholder="e.g. Morning, after walk"
          />
        </Field>
      </div>

      <p className="mt-4 rounded-lg bg-surface-2 px-3 py-2 text-[10px] leading-relaxed text-muted">
        Weight entries are independent of meals. You can log weight on days with no food tracking, and you never have
        to log daily.
      </p>
    </Sheet>
  )
}
