import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  Bookmark,
  BookOpen,
  Check,
  History,
  Info,
  Loader2,
  Plus,
  Search,
  Sparkles,
  Star,
} from 'lucide-react'
import type {
  EntryStatus,
  FoodItem,
  FoodItemInput,
  MealType,
  NutritionBasis,
  SavedMeal,
} from '../../types'
import { ENTRY_STATUSES, FOOD_CATEGORIES, MEAL_TYPES } from '../../types'
import { useFoodItems, useRecentFoods } from '../../hooks/useFoods'
import { useSavedMeals } from '../../hooks/useSavedMeals'
import { addCustomFoodToMeal, addFoodToMeal, addSavedMealToDate } from '../../services/mealService'
import { formatCalories, formatMacro } from '../../lib/format'
import { cn } from '../../lib/cn'
import { hasErrors, validateFoodInput, type ValidationErrors } from '../../lib/validation'
import { Sheet } from '../ui/Sheet'
import { Field, SegmentedControl } from '../ui/Field'
import { EmptyState } from '../ui/EmptyState'
import { useToast } from '../ui/ToastProvider'

type Tab = 'library' | 'saved' | 'custom'
type LibraryFilter = 'all' | 'favourites' | 'recent'

interface CustomState {
  name: string
  category: string
  calories: string
  protein: string
  carbohydrates: string
  fat: string
  fibre: string
  servingDescription: string
  servingQuantity: string
  nutritionBasis: NutritionBasis
  quantity: string
  notes: string
  saveToLibrary: boolean
}

function createCustomState(): CustomState {
  return {
    name: '',
    category: 'Other',
    calories: '',
    protein: '',
    carbohydrates: '',
    fat: '',
    fibre: '',
    servingDescription: '1 serving',
    servingQuantity: '1',
    nutritionBasis: 'per_serving',
    quantity: '1',
    notes: '',
    saveToLibrary: true,
  }
}

function optionalNumber(value: string): number | null {
  if (!value.trim()) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function savedMealCalories(savedMeal: SavedMeal): number {
  return savedMeal.items.reduce((total, item) => total + item.quantity * item.caloriesSnapshot, 0)
}

interface AddFoodSheetProps {
  open: boolean
  onClose: () => void
  date: string
  initialMeal: MealType
}

export function AddFoodSheet({ open, onClose, date, initialMeal }: AddFoodSheetProps) {
  const { foods } = useFoodItems()
  const { foods: recentFoods } = useRecentFoods()
  const { savedMeals } = useSavedMeals()
  const { toast } = useToast()

  const [tab, setTab] = useState<Tab>('library')
  const [filter, setFilter] = useState<LibraryFilter>('all')
  const [mealType, setMealType] = useState<MealType>(initialMeal)
  const [status, setStatus] = useState<EntryStatus>('option')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [addedCount, setAddedCount] = useState(0)
  const [justAdded, setJustAdded] = useState<number | null>(null)
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [custom, setCustom] = useState<CustomState>(createCustomState)
  const [customErrors, setCustomErrors] = useState<ValidationErrors>({})

  useEffect(() => {
    if (!open) return
    setTab('library')
    setFilter('all')
    setMealType(initialMeal)
    setStatus('option')
    setSearch('')
    setCategory('all')
    setAddedCount(0)
    setJustAdded(null)
    setBusyKey(null)
    setCustom(createCustomState())
    setCustomErrors({})
  }, [open, initialMeal])

  const categories = useMemo(() => {
    const unique = new Set<string>(FOOD_CATEGORIES)
    foods.forEach((food) => unique.add(food.category))
    return [...unique].sort((a, b) => a.localeCompare(b))
  }, [foods])

  const filteredFoods = useMemo(() => {
    const source = filter === 'recent' ? recentFoods : foods
    const term = search.trim().toLowerCase()
    return source.filter((food) => {
      if (filter === 'favourites' && !food.isFavourite) return false
      if (category !== 'all' && food.category !== category) return false
      if (!term) return true
      return (
        food.name.toLowerCase().includes(term) ||
        food.category.toLowerCase().includes(term) ||
        food.servingDescription.toLowerCase().includes(term)
      )
    })
  }, [foods, recentFoods, filter, search, category])

  const handleAddFood = async (food: FoodItem) => {
    if (food.id == null) return
    setBusyKey(`food-${food.id}`)
    try {
      await addFoodToMeal(food.id, {
        date,
        mealType,
        quantity: 1,
        status,
      })
      setAddedCount((count) => count + 1)
      setJustAdded(food.id)
      window.setTimeout(() => setJustAdded((current) => (current === food.id ? null : current)), 1400)
      toast(`${food.name} added as ${status}`, 'success')
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Could not add that food.', 'error')
    } finally {
      setBusyKey(null)
    }
  }

  const handleAddSavedMeal = async (savedMeal: SavedMeal) => {
    if (savedMeal.id == null) return
    setBusyKey(`saved-${savedMeal.id}`)
    try {
      const count = await addSavedMealToDate(savedMeal.id, date, mealType, status)
      setAddedCount((current) => current + count)
      toast(`${savedMeal.name} added as ${status} (${count} items)`, 'success')
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Could not add that combination.', 'error')
    } finally {
      setBusyKey(null)
    }
  }

  const handleCustomSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const quantity = Number(custom.quantity)
    const input: FoodItemInput = {
      name: custom.name,
      category: custom.category,
      calories: Number(custom.calories),
      protein: optionalNumber(custom.protein),
      carbohydrates: optionalNumber(custom.carbohydrates),
      fat: optionalNumber(custom.fat),
      fibre: optionalNumber(custom.fibre),
      servingDescription: custom.servingDescription,
      servingQuantity: Number(custom.servingQuantity),
      nutritionBasis: custom.nutritionBasis,
      isFavourite: false,
      notes: custom.notes,
    }
    const errors = validateFoodInput(input)
    if (!Number.isFinite(quantity) || quantity <= 0) errors.quantity = 'Quantity must be greater than zero.'
    setCustomErrors(errors)
    if (hasErrors(errors)) return

    setBusyKey('custom')
    try {
      await addCustomFoodToMeal(input, {
        date,
        mealType,
        quantity,
        status,
        notes: '',
        saveToLibrary: custom.saveToLibrary,
      })
      toast(`${input.name.trim()} added as ${status}`, 'success')
      setAddedCount((count) => count + 1)
      setCustom(createCustomState())
      setCustomErrors({})
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Could not add that food.', 'error')
    } finally {
      setBusyKey(null)
    }
  }

  const footer = (
    <div className="space-y-2.5">
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Meal</span>
          <select
            value={mealType}
            onChange={(event) => setMealType(event.target.value as MealType)}
            className="select h-9 text-xs"
          >
            {MEAL_TYPES.map((meal) => (
              <option key={meal.value} value={meal.value}>
                {meal.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Add as</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as EntryStatus)}
            className="select h-9 text-xs"
          >
            {ENTRY_STATUSES.map((entryStatus) => (
              <option key={entryStatus.value} value={entryStatus.value}>
                {entryStatus.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] leading-snug text-muted">
          {addedCount > 0 ? (
            <span className="font-semibold text-accent">
              {addedCount} {addedCount === 1 ? 'item' : 'items'} added
            </span>
          ) : (
            'Tap a food to add it instantly.'
          )}
        </p>
        <button type="button" onClick={onClose} className="btn-primary h-9 px-4 text-xs">
          Done
        </button>
      </div>
    </div>
  )

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Add food"
      description="Browse your library, reuse a saved combination, or add something custom."
      footer={footer}
      size="md"
    >
      <SegmentedControl
        value={tab}
        onChange={setTab}
        ariaLabel="Add food source"
        options={[
          { value: 'library', label: 'Library', icon: <BookOpen className="h-3.5 w-3.5" /> },
          { value: 'saved', label: 'Saved', icon: <Bookmark className="h-3.5 w-3.5" /> },
          { value: 'custom', label: 'Custom', icon: <Plus className="h-3.5 w-3.5" /> },
        ]}
      />

      {tab === 'library' ? (
        <div className="mt-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search foods…"
              className="input pl-9"
              aria-label="Search foods"
            />
          </div>

          <div className="mt-2 flex items-center gap-2">
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="select h-9 flex-1 text-xs"
              aria-label="Filter by category"
            >
              <option value="all">All categories</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <div className="flex shrink-0 rounded-lg bg-surface-2 p-0.5">
              {(
                [
                  { value: 'all', label: 'All' },
                  { value: 'favourites', label: 'Favourites' },
                  { value: 'recent', label: 'Recent' },
                ] as { value: LibraryFilter; label: string }[]
              ).map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setFilter(item.value)}
                  className={cn(
                    'h-8 rounded-md px-2 text-[10px] font-semibold transition-colors',
                    filter === item.value ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink',
                  )}
                >
                  {item.value === 'recent' ? <History className="mr-1 inline h-3 w-3" /> : null}
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3">
            {filteredFoods.length === 0 ? (
              <EmptyState
                icon={filter === 'favourites' ? Star : Search}
                title={
                  filter === 'favourites'
                    ? 'No favourite foods yet'
                    : filter === 'recent'
                      ? 'No recently used foods'
                      : 'No foods match'
                }
                description={
                  filter === 'favourites'
                    ? 'Star foods in the library to find them quickly here.'
                    : filter === 'recent'
                      ? 'Foods you add to meals will appear here for quick reuse.'
                      : 'Try a different search or category, or create a custom food.'
                }
                action={
                  filter === 'favourites' ? null : (
                    <button type="button" onClick={() => setTab('custom')} className="btn-secondary h-9 px-3 text-xs">
                      <Plus className="h-3.5 w-3.5" />
                      Create custom food
                    </button>
                  )
                }
                compact
              />
            ) : (
              <div className="divide-y divide-line/70">
                {filteredFoods.map((food) => {
                  const isAdded = justAdded === food.id
                  const isBusy = busyKey === `food-${food.id}`
                  return (
                    <button
                      key={food.id}
                      type="button"
                      onClick={() => void handleAddFood(food)}
                      disabled={isBusy}
                      className="flex w-full items-center gap-3 rounded-lg px-1.5 py-2.5 text-left transition-colors hover:bg-surface-2/70 disabled:opacity-60"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-medium text-ink">{food.name}</p>
                          {food.isFavourite ? <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400" /> : null}
                        </div>
                        <p className="truncate text-[11px] text-muted">
                          {food.category} · {food.servingDescription}
                          {food.nutritionBasis === 'per_100g' ? ' · per 100 g' : ''}
                        </p>
                        {food.protein != null || food.carbohydrates != null || food.fat != null || food.fibre != null ? (
                          <p className="num mt-0.5 text-[10px] text-muted/80">
                            {[
                              food.protein != null ? `P ${formatMacro(food.protein)}g` : null,
                              food.carbohydrates != null ? `C ${formatMacro(food.carbohydrates)}g` : null,
                              food.fat != null ? `F ${formatMacro(food.fat)}g` : null,
                              food.fibre != null ? `Fib ${formatMacro(food.fibre)}g` : null,
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <div className="text-right">
                          <p className="num text-sm font-semibold text-ink">{formatCalories(food.calories)}</p>
                          <p className="text-[10px] text-muted">kcal</p>
                        </div>
                        <span
                          className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-full transition-colors',
                            isAdded
                              ? 'bg-emerald-500 text-white'
                              : 'bg-accent-soft text-accent',
                          )}
                        >
                          {isBusy ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : isAdded ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <p className="mt-4 flex items-start gap-1.5 text-[10px] leading-relaxed text-muted">
            <Info className="mt-0.5 h-3 w-3 shrink-0" />
            Adding with quantity 1. Tap an entry on Today to change its quantity or details.
          </p>
        </div>
      ) : null}

      {tab === 'saved' ? (
        <div className="mt-4">
          {savedMeals.length === 0 ? (
            <EmptyState
              icon={Bookmark}
              title="No saved combinations yet"
              description="Save a whole meal from Today to reuse it in one tap. Combinations store their own nutrition snapshots."
              compact
            />
          ) : (
            <div className="space-y-2">
              {savedMeals.map((savedMeal) => {
                const isBusy = busyKey === `saved-${savedMeal.id}`
                return (
                  <div key={savedMeal.id} className="rounded-xl border border-line bg-surface p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-semibold text-ink">{savedMeal.name}</p>
                          <span className="pill shrink-0 bg-surface-2 text-muted">
                            {MEAL_TYPES.find((meal) => meal.value === savedMeal.mealType)?.shortLabel}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-muted">
                          {savedMeal.items.length} {savedMeal.items.length === 1 ? 'item' : 'items'} ·{' '}
                          {formatCalories(savedMealCalories(savedMeal))} kcal
                        </p>
                        <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-muted">
                          {savedMeal.items.map((item) => item.foodNameSnapshot).join(', ')}
                        </p>
                        {savedMeal.description ? (
                          <p className="mt-1 line-clamp-1 text-[10px] text-muted/80">{savedMeal.description}</p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleAddSavedMeal(savedMeal)}
                        disabled={isBusy}
                        className="btn-secondary h-8 shrink-0 px-2.5 text-[11px]"
                      >
                        {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                        Add
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          <p className="mt-4 flex items-start gap-1.5 text-[10px] leading-relaxed text-muted">
            <Sparkles className="mt-0.5 h-3 w-3 shrink-0" />
            Combinations are added as {status} to {MEAL_TYPES.find((meal) => meal.value === mealType)?.label.toLowerCase()}.
          </p>
        </div>
      ) : null}

      {tab === 'custom' ? (
        <form className="mt-4 space-y-3.5" onSubmit={(event) => void handleCustomSubmit(event)}>
          <Field label="Food name" htmlFor="custom-name" error={customErrors.name}>
            <input
              id="custom-name"
              value={custom.name}
              onChange={(event) => setCustom((current) => ({ ...current, name: event.target.value }))}
              placeholder="e.g. Homemade paneer wrap"
              className="input"
              autoComplete="off"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Category" htmlFor="custom-category" error={customErrors.category}>
              <select
                id="custom-category"
                value={custom.category}
                onChange={(event) => setCustom((current) => ({ ...current, category: event.target.value }))}
                className="select"
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Quantity to add" htmlFor="custom-quantity" error={customErrors.quantity}>
              <input
                id="custom-quantity"
                type="number"
                min="0.1"
                step="0.25"
                inputMode="decimal"
                value={custom.quantity}
                onChange={(event) => setCustom((current) => ({ ...current, quantity: event.target.value }))}
                className="input"
              />
            </Field>
          </div>

          <div className="rounded-xl border border-line bg-surface-2/40 p-3">
            <SegmentedControl
              value={custom.nutritionBasis}
              onChange={(value) =>
                setCustom((current) => ({
                  ...current,
                  nutritionBasis: value,
                  servingDescription:
                    value === 'per_100g' && current.servingDescription === '1 serving'
                      ? '100 g'
                      : current.servingDescription,
                  servingQuantity:
                    value === 'per_100g' && current.servingQuantity === '1' ? '100' : current.servingQuantity,
                }))
              }
              ariaLabel="Nutrition basis"
              options={[
                { value: 'per_serving', label: 'Per serving' },
                { value: 'per_100g', label: 'Per 100 g' },
              ]}
            />
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Field label="Serving description" htmlFor="custom-serving" error={customErrors.servingDescription}>
                <input
                  id="custom-serving"
                  value={custom.servingDescription}
                  onChange={(event) =>
                    setCustom((current) => ({ ...current, servingDescription: event.target.value }))
                  }
                  placeholder="e.g. 1 bowl (250 g)"
                  className="input"
                />
              </Field>
              <Field label="Serving size (g/ml)" htmlFor="custom-serving-size" error={customErrors.servingQuantity}>
                <input
                  id="custom-serving-size"
                  type="number"
                  min="1"
                  step="1"
                  inputMode="decimal"
                  value={custom.servingQuantity}
                  onChange={(event) =>
                    setCustom((current) => ({ ...current, servingQuantity: event.target.value }))
                  }
                  className="input"
                />
              </Field>
            </div>
          </div>

          <Field label="Calories" htmlFor="custom-calories" error={customErrors.calories}>
            <input
              id="custom-calories"
              type="number"
              min="0"
              step="1"
              inputMode="decimal"
              value={custom.calories}
              onChange={(event) => setCustom((current) => ({ ...current, calories: event.target.value }))}
              placeholder="0"
              className="input"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Protein (g)" htmlFor="custom-protein" error={customErrors.protein}>
              <input
                id="custom-protein"
                type="number"
                min="0"
                step="0.1"
                inputMode="decimal"
                value={custom.protein}
                onChange={(event) => setCustom((current) => ({ ...current, protein: event.target.value }))}
                placeholder="Optional"
                className="input"
              />
            </Field>
            <Field label="Carbs (g)" htmlFor="custom-carbs" error={customErrors.carbohydrates}>
              <input
                id="custom-carbs"
                type="number"
                min="0"
                step="0.1"
                inputMode="decimal"
                value={custom.carbohydrates}
                onChange={(event) => setCustom((current) => ({ ...current, carbohydrates: event.target.value }))}
                placeholder="Optional"
                className="input"
              />
            </Field>
            <Field label="Fat (g)" htmlFor="custom-fat" error={customErrors.fat}>
              <input
                id="custom-fat"
                type="number"
                min="0"
                step="0.1"
                inputMode="decimal"
                value={custom.fat}
                onChange={(event) => setCustom((current) => ({ ...current, fat: event.target.value }))}
                placeholder="Optional"
                className="input"
              />
            </Field>
            <Field label="Fibre (g)" htmlFor="custom-fibre" error={customErrors.fibre}>
              <input
                id="custom-fibre"
                type="number"
                min="0"
                step="0.1"
                inputMode="decimal"
                value={custom.fibre}
                onChange={(event) => setCustom((current) => ({ ...current, fibre: event.target.value }))}
                placeholder="Optional"
                className="input"
              />
            </Field>
          </div>

          <Field label="Notes" htmlFor="custom-notes">
            <input
              id="custom-notes"
              value={custom.notes}
              onChange={(event) => setCustom((current) => ({ ...current, notes: event.target.value }))}
              placeholder="Optional — brand, preparation, etc."
              className="input"
            />
          </Field>

          <label className="flex items-start gap-2.5 rounded-xl border border-line bg-surface p-3">
            <input
              type="checkbox"
              checked={custom.saveToLibrary}
              onChange={(event) => setCustom((current) => ({ ...current, saveToLibrary: event.target.checked }))}
              className="mt-0.5 h-4 w-4 accent-teal-600"
            />
            <span>
              <span className="block text-xs font-semibold text-ink">Save to food library</span>
              <span className="mt-0.5 block text-[10px] leading-relaxed text-muted">
                Reuse this food later. The meal entry keeps its own snapshot either way.
              </span>
            </span>
          </label>

          <div className="flex items-center justify-between gap-3 rounded-xl bg-accent-soft/50 px-3 py-2.5">
            <p className="text-[11px] leading-snug text-ink">
              Added as <strong className="font-semibold">{status}</strong> to{' '}
              <strong className="font-semibold">
                {MEAL_TYPES.find((meal) => meal.value === mealType)?.label.toLowerCase()}
              </strong>
              .
            </p>
            <span className="num shrink-0 text-sm font-bold text-ink">
              {formatCalories((Number(custom.calories) || 0) * (Number(custom.quantity) || 0))} kcal
            </span>
          </div>

          <button type="submit" disabled={busyKey === 'custom'} className="btn-primary w-full">
            {busyKey === 'custom' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add custom food
          </button>
          <p className="text-center text-[10px] leading-relaxed text-muted">
            Nutrition values are stored as entered. Use approximate reference values when exact data isn't available.
          </p>
        </form>
      ) : null}
    </Sheet>
  )
}
