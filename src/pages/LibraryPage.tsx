import { useMemo, useState } from 'react'
import { Info, Plus, Search, Star, UtensilsCrossed } from 'lucide-react'
import type { FoodItem } from '../types'
import { FOOD_CATEGORIES } from '../types'
import { formatCalories } from '../lib/format'
import { inferMealForNow } from '../lib/mealTime'
import { useFoodItems, useRecentFoods } from '../hooks/useFoods'
import { deleteFood, duplicateFood, toggleFavourite } from '../services/foodService'
import { FoodCard } from '../components/food/FoodCard'
import { FoodEditorSheet } from '../components/food/FoodEditorSheet'
import { FoodAddDialog } from '../components/food/FoodAddDialog'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { EmptyState } from '../components/ui/EmptyState'
import { useToast } from '../components/ui/ToastProvider'

export function LibraryPage() {
  const { foods, isLoading } = useFoodItems()
  const { foods: recentFoods } = useRecentFoods(80)
  const { toast } = useToast()

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [favouritesOnly, setFavouritesOnly] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingFood, setEditingFood] = useState<FoodItem | null>(null)
  const [addingFood, setAddingFood] = useState<FoodItem | null>(null)
  const [pendingDelete, setPendingDelete] = useState<FoodItem | null>(null)

  const categories = useMemo(() => {
    const unique = new Set<string>(FOOD_CATEGORIES)
    foods.forEach((food) => unique.add(food.category))
    return [...unique].sort((a, b) => a.localeCompare(b))
  }, [foods])

  const filteredFoods = useMemo(() => {
    const term = search.trim().toLowerCase()
    return foods.filter((food) => {
      if (favouritesOnly && !food.isFavourite) return false
      if (category !== 'all' && food.category !== category) return false
      if (!term) return true
      return (
        food.name.toLowerCase().includes(term) ||
        food.category.toLowerCase().includes(term) ||
        food.servingDescription.toLowerCase().includes(term) ||
        food.notes.toLowerCase().includes(term)
      )
    })
  }, [foods, search, category, favouritesOnly])

  const favouriteCount = foods.filter((food) => food.isFavourite).length
  const showRecent = search.trim() === '' && category === 'all' && !favouritesOnly && recentFoods.length > 0

  const openCreate = () => {
    setEditingFood(null)
    setEditorOpen(true)
  }

  const openEdit = (food: FoodItem) => {
    setEditingFood(food)
    setEditorOpen(true)
  }

  const handleToggleFavourite = async (food: FoodItem) => {
    try {
      await toggleFavourite(food.id as number)
      toast(food.isFavourite ? `${food.name} removed from favourites` : `${food.name} added to favourites`, 'success')
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Could not update favourite.', 'error')
    }
  }

  const handleDuplicate = async (food: FoodItem) => {
    try {
      await duplicateFood(food.id as number)
      toast(`${food.name} duplicated`, 'success')
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Could not duplicate that food.', 'error')
    }
  }

  const handleDelete = async () => {
    if (!pendingDelete) return
    try {
      await deleteFood(pendingDelete.id as number)
      toast(`${pendingDelete.name} deleted from the library`, 'info')
      setPendingDelete(null)
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Could not delete that food.', 'error')
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">Your foods</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-[28px]">Food library</h1>
          <p className="mt-1 text-xs text-muted">
            {foods.length} {foods.length === 1 ? 'food' : 'foods'} · {favouriteCount} favourite
            {favouriteCount === 1 ? '' : 's'}
          </p>
        </div>
        <button type="button" onClick={openCreate} className="btn-primary h-10 self-start px-3.5 text-xs sm:self-auto">
          <Plus className="h-4 w-4" />
          New food
        </button>
      </div>

      <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-sky-200/80 bg-sky-50/70 px-3.5 py-3 text-[11px] leading-relaxed text-sky-900 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-200">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Starter foods use <strong className="font-semibold">approximate reference values</strong>. Edit them to match
          your brands, recipes, and serving sizes. Nutrition values are never fetched from an API.
        </p>
      </div>

      {showRecent ? (
        <section className="mt-4" aria-labelledby="recent-foods-title">
          <h2 id="recent-foods-title" className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted">
            Recently used
          </h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {recentFoods.slice(0, 8).map((food) => (
              <button
                key={food.id}
                type="button"
                onClick={() => setAddingFood(food)}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-[11px] font-medium text-ink transition-colors hover:border-accent/40 hover:bg-surface-2"
              >
                <span className="truncate">{food.name}</span>
                <span className="num text-[10px] text-muted">{formatCalories(food.calories)}</span>
                <Plus className="h-3 w-3 text-accent" />
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, category, or note…"
            className="input pl-9"
            aria-label="Search food library"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="select h-11 flex-1 text-xs sm:w-44 sm:flex-none"
            aria-label="Filter by category"
          >
            <option value="all">All categories</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setFavouritesOnly((current) => !current)}
            className={
              favouritesOnly
                ? 'btn h-11 shrink-0 border border-amber-300 bg-amber-50 px-3 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300'
                : 'btn-secondary h-11 shrink-0 px-3 text-xs'
            }
            aria-pressed={favouritesOnly}
          >
            <Star className={favouritesOnly ? 'h-4 w-4 fill-amber-400 text-amber-400' : 'h-4 w-4'} />
            Favourites
          </button>
        </div>
      </div>

      <p className="mt-3 text-[11px] font-medium text-muted">
        Showing {filteredFoods.length} of {foods.length} foods
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filteredFoods.map((food) => (
          <FoodCard
            key={food.id}
            food={food}
            onAdd={() => setAddingFood(food)}
            onEdit={() => openEdit(food)}
            onDuplicate={() => void handleDuplicate(food)}
            onDelete={() => setPendingDelete(food)}
            onToggleFavourite={() => void handleToggleFavourite(food)}
          />
        ))}
      </div>

      {!isLoading && filteredFoods.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={favouritesOnly ? Star : UtensilsCrossed}
            title={favouritesOnly ? 'No favourite foods yet' : 'No foods match'}
            description={
              favouritesOnly
                ? 'Tap the star on any food card to pin it here for quick access.'
                : 'Try a different search or category, or add a new food to your library.'
            }
            action={
              <button type="button" onClick={openCreate} className="btn-secondary h-9 px-3 text-xs">
                <Plus className="h-3.5 w-3.5" />
                New food
              </button>
            }
          />
        </div>
      ) : null}

      <FoodEditorSheet open={editorOpen} food={editingFood} onClose={() => setEditorOpen(false)} />

      <FoodAddDialog
        open={addingFood !== null}
        food={addingFood}
        defaultMeal={inferMealForNow()}
        onClose={() => setAddingFood(null)}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this food?"
        description={
          pendingDelete
            ? `“${pendingDelete.name}” will be removed from the library. Past meal entries keep their nutrition snapshots and will not change.`
            : ''
        }
        confirmLabel="Delete food"
        destructive
        onConfirm={handleDelete}
        onClose={() => setPendingDelete(null)}
      />
    </div>
  )
}
