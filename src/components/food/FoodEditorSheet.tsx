import { useEffect, useState, type FormEvent } from 'react'
import { Loader2, Star } from 'lucide-react'
import type { FoodItem, FoodItemInput, NutritionBasis } from '../../types'
import { FOOD_CATEGORIES } from '../../types'
import { createFood, updateFood } from '../../services/foodService'
import { hasErrors, validateFoodInput, type ValidationErrors } from '../../lib/validation'
import { cn } from '../../lib/cn'
import { Sheet } from '../ui/Sheet'
import { Field, SegmentedControl } from '../ui/Field'
import { useToast } from '../ui/ToastProvider'

interface FoodEditorSheetProps {
  open: boolean
  food: FoodItem | null
  onClose: () => void
}

interface FoodFormState {
  name: string
  category: string
  calories: string
  protein: string
  carbohydrates: string
  fat: string
  servingDescription: string
  servingQuantity: string
  nutritionBasis: NutritionBasis
  isFavourite: boolean
  notes: string
}

function emptyForm(): FoodFormState {
  return {
    name: '',
    category: 'Other',
    calories: '',
    protein: '',
    carbohydrates: '',
    fat: '',
    servingDescription: '1 serving',
    servingQuantity: '1',
    nutritionBasis: 'per_serving',
    isFavourite: false,
    notes: '',
  }
}

function formFromFood(food: FoodItem): FoodFormState {
  return {
    name: food.name,
    category: food.category,
    calories: String(food.calories),
    protein: food.protein == null ? '' : String(food.protein),
    carbohydrates: food.carbohydrates == null ? '' : String(food.carbohydrates),
    fat: food.fat == null ? '' : String(food.fat),
    servingDescription: food.servingDescription,
    servingQuantity: String(food.servingQuantity),
    nutritionBasis: food.nutritionBasis,
    isFavourite: food.isFavourite,
    notes: food.notes,
  }
}

function optionalNumber(value: string): number | null {
  if (!value.trim()) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function FoodEditorSheet({ open, food, onClose }: FoodEditorSheetProps) {
  const { toast } = useToast()
  const [form, setForm] = useState<FoodFormState>(emptyForm)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(food ? formFromFood(food) : emptyForm())
    setErrors({})
    setSaving(false)
  }, [open, food])

  const categories = Array.from(new Set([...FOOD_CATEGORIES, food?.category].filter(Boolean) as string[])).sort(
    (a, b) => a.localeCompare(b),
  )

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const input: FoodItemInput = {
      name: form.name,
      category: form.category,
      calories: Number(form.calories),
      protein: optionalNumber(form.protein),
      carbohydrates: optionalNumber(form.carbohydrates),
      fat: optionalNumber(form.fat),
      servingDescription: form.servingDescription,
      servingQuantity: Number(form.servingQuantity),
      nutritionBasis: form.nutritionBasis,
      isFavourite: form.isFavourite,
      notes: form.notes,
    }
    const validation = validateFoodInput(input)
    setErrors(validation)
    if (hasErrors(validation)) return

    setSaving(true)
    try {
      if (food?.id != null) {
        await updateFood(food.id, input)
        toast(`${input.name.trim()} updated`, 'success')
      } else {
        await createFood(input)
        toast(`${input.name.trim()} added to the library`, 'success')
      }
      onClose()
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Could not save that food.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const caloriesLabel =
    form.nutritionBasis === 'per_100g' ? 'Calories per 100 g' : 'Calories per serving'

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={food ? 'Edit food' : 'New food'}
      description={
        food
          ? 'Changes apply to future entries only. Past meal entries keep their original nutrition snapshots.'
          : 'Add a food you eat regularly. You can use approximate values and refine them later.'
      }
      footer={
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={saving}>
            Cancel
          </button>
          <button type="submit" form="food-editor-form" className="btn-primary flex-1" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {food ? 'Save changes' : 'Add food'}
          </button>
        </div>
      }
    >
      <form id="food-editor-form" onSubmit={(event) => void handleSubmit(event)} className="space-y-3.5">
        <Field label="Food name" htmlFor="food-name" error={errors.name}>
          <input
            id="food-name"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            className="input"
            placeholder="e.g. Paneer wrap"
            autoComplete="off"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Category" htmlFor="food-category" error={errors.category}>
            <select
              id="food-category"
              value={form.category}
              onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
              className="select"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Serving description" htmlFor="food-serving" error={errors.servingDescription}>
            <input
              id="food-serving"
              value={form.servingDescription}
              onChange={(event) =>
                setForm((current) => ({ ...current, servingDescription: event.target.value }))
              }
              className="input"
              placeholder="e.g. 1 bowl (250 g)"
            />
          </Field>
        </div>

        <div className="rounded-xl border border-line bg-surface-2/40 p-3">
          <SegmentedControl
            value={form.nutritionBasis}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                nutritionBasis: value,
                servingDescription:
                  value === 'per_100g' && current.servingDescription === '1 serving'
                    ? '100 g'
                    : value === 'per_serving' && current.servingDescription === '100 g'
                      ? '1 serving'
                      : current.servingDescription,
                servingQuantity:
                  value === 'per_100g' && current.servingQuantity === '1'
                    ? '100'
                    : value === 'per_serving' && current.servingQuantity === '100'
                      ? '1'
                      : current.servingQuantity,
              }))
            }
            ariaLabel="Nutrition basis"
            options={[
              { value: 'per_serving', label: 'Per serving' },
              { value: 'per_100g', label: 'Per 100 g' },
            ]}
          />
          <div className="mt-3">
            <Field
              label="Serving size (g/ml)"
              htmlFor="food-serving-size"
              error={errors.servingQuantity}
              hint="Reference size for one serving. Quantity in a meal is a multiple of the basis."
            >
              <input
                id="food-serving-size"
                type="number"
                min="1"
                step="1"
                inputMode="decimal"
                value={form.servingQuantity}
                onChange={(event) =>
                  setForm((current) => ({ ...current, servingQuantity: event.target.value }))
                }
                className="input"
              />
            </Field>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label={caloriesLabel} htmlFor="food-calories" error={errors.calories}>
            <input
              id="food-calories"
              type="number"
              min="0"
              step="1"
              inputMode="decimal"
              value={form.calories}
              onChange={(event) => setForm((current) => ({ ...current, calories: event.target.value }))}
              className="input"
              placeholder="0"
            />
          </Field>
          <Field label="Protein (g)" htmlFor="food-protein" error={errors.protein}>
            <input
              id="food-protein"
              type="number"
              min="0"
              step="0.1"
              inputMode="decimal"
              value={form.protein}
              onChange={(event) => setForm((current) => ({ ...current, protein: event.target.value }))}
              className="input"
              placeholder="Optional"
            />
          </Field>
          <Field label="Carbohydrates (g)" htmlFor="food-carbs" error={errors.carbohydrates}>
            <input
              id="food-carbs"
              type="number"
              min="0"
              step="0.1"
              inputMode="decimal"
              value={form.carbohydrates}
              onChange={(event) =>
                setForm((current) => ({ ...current, carbohydrates: event.target.value }))
              }
              className="input"
              placeholder="Optional"
            />
          </Field>
          <Field label="Fat (g)" htmlFor="food-fat" error={errors.fat}>
            <input
              id="food-fat"
              type="number"
              min="0"
              step="0.1"
              inputMode="decimal"
              value={form.fat}
              onChange={(event) => setForm((current) => ({ ...current, fat: event.target.value }))}
              className="input"
              placeholder="Optional"
            />
          </Field>
        </div>

        <Field label="Notes" htmlFor="food-notes" hint="Optional — brand, preparation method, or a reminder.">
          <textarea
            id="food-notes"
            value={form.notes}
            onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
            rows={2}
            className="input !h-auto min-h-[68px] resize-y py-2.5"
            placeholder="Add a note…"
          />
        </Field>

        <button
          type="button"
          onClick={() => setForm((current) => ({ ...current, isFavourite: !current.isFavourite }))}
          className={cn(
            'flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors',
            form.isFavourite
              ? 'border-amber-300 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10'
              : 'border-line bg-surface hover:bg-surface-2',
          )}
          aria-pressed={form.isFavourite}
        >
          <Star
            className={cn(
              'h-4 w-4',
              form.isFavourite ? 'fill-amber-400 text-amber-400' : 'text-muted',
            )}
          />
          <span className="flex-1">
            <span className="block text-xs font-semibold text-ink">Favourite food</span>
            <span className="mt-0.5 block text-[10px] text-muted">Pin it for quick access when adding food.</span>
          </span>
        </button>
      </form>
    </Sheet>
  )
}
