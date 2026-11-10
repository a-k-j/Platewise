import { Copy, MoreHorizontal, Pencil, Plus, Star, Trash2 } from 'lucide-react'
import type { FoodItem } from '../../types'
import { formatCalories, formatMacro } from '../../lib/format'
import { cn } from '../../lib/cn'
import { ActionMenu } from '../ui/ActionMenu'

interface FoodCardProps {
  food: FoodItem
  onAdd: () => void
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
  onToggleFavourite: () => void
}

export function FoodCard({ food, onAdd, onEdit, onDuplicate, onDelete, onToggleFavourite }: FoodCardProps) {
  const macros = [
    food.protein != null ? `P ${formatMacro(food.protein)}g` : null,
    food.carbohydrates != null ? `C ${formatMacro(food.carbohydrates)}g` : null,
    food.fat != null ? `F ${formatMacro(food.fat)}g` : null,
    food.fibre != null ? `Fib ${formatMacro(food.fibre)}g` : null,
  ].filter(Boolean)

  return (
    <article className="card-flat group flex flex-col p-4 transition-shadow hover:shadow-card">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-sm font-semibold text-ink">{food.name}</h3>
            {food.isFavourite ? <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" /> : null}
          </div>
          <p className="mt-0.5 truncate text-[11px] font-medium text-muted">
            {food.category} · {food.servingDescription}
          </p>
        </div>
        <div className="-mr-1 -mt-1 flex items-center">
          <button
            type="button"
            onClick={onToggleFavourite}
            className="icon-btn h-8 w-8"
            aria-label={food.isFavourite ? `Remove ${food.name} from favourites` : `Add ${food.name} to favourites`}
          >
            <Star className={cn('h-4 w-4', food.isFavourite && 'fill-amber-400 text-amber-400')} />
          </button>
          <ActionMenu
            items={[
              { label: 'Edit food', icon: Pencil, onSelect: onEdit },
              { label: 'Duplicate food', icon: Copy, onSelect: onDuplicate },
              { label: 'Add to a meal', icon: Plus, onSelect: onAdd },
              { label: 'Delete food', icon: Trash2, onSelect: onDelete, destructive: true },
            ]}
          >
            {({ toggle }) => (
              <button type="button" onClick={toggle} className="icon-btn h-8 w-8" aria-label={`Actions for ${food.name}`}>
                <MoreHorizontal className="h-4 w-4" />
              </button>
            )}
          </ActionMenu>
        </div>
      </div>

      <div className="mt-3 flex flex-1 items-end justify-between gap-3">
        <div>
          <p className="flex items-baseline gap-1">
            <span className="num text-2xl font-bold tracking-tight text-ink">{formatCalories(food.calories)}</span>
            <span className="text-[11px] font-medium text-muted">kcal</span>
          </p>
          <p className="text-[10px] font-medium text-muted">
            {food.nutritionBasis === 'per_100g' ? 'per 100 g' : 'per serving'}
          </p>
          {macros.length > 0 ? (
            <p className="num mt-1 text-[10px] font-medium text-muted/80">{macros.join(' · ')}</p>
          ) : null}
        </div>
        <button type="button" onClick={onAdd} className="btn-secondary h-8 shrink-0 px-2.5 text-[11px]">
          <Plus className="h-3.5 w-3.5" />
          Add
        </button>
      </div>

      {food.notes ? (
        <p className="mt-2 line-clamp-2 border-t border-line/70 pt-2 text-[10px] leading-relaxed text-muted">
          {food.notes}
        </p>
      ) : null}
    </article>
  )
}
