import { useState } from 'react'
import { Cookie, Plus, Sparkles, TrendingDown, TrendingUp } from 'lucide-react'
import type { CalorieSummary } from '../../types'
import { previewTreat } from '../../lib/calculations'
import { formatCalories } from '../../lib/format'
import { cn } from '../../lib/cn'

interface SnackBudgetCardProps {
  summary: CalorieSummary
  onAddTreat: () => void
}

export function SnackBudgetCard({ summary, onAddTreat }: SnackBudgetCardProps) {
  const [treatValue, setTreatValue] = useState('')
  const available = summary.remainingAfterPlanned
  const treatCalories = Number.parseFloat(treatValue)
  const preview = Number.isFinite(treatCalories) && treatCalories > 0
    ? previewTreat(summary.projected, treatCalories, summary.target)
    : null

  return (
    <section className="card relative overflow-hidden p-5" aria-labelledby="snack-budget-title">
      <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-accent-soft/60 blur-2xl" />
      <div className="relative">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-accent">
              <Cookie className="h-4 w-4" />
            </span>
            <div>
              <p className="stat-label">Snack budget</p>
              <h2 id="snack-budget-title" className="text-sm font-semibold text-ink">
                Room for snacks & treats
              </h2>
            </div>
          </div>
          <Sparkles className="h-4 w-4 text-accent/70" />
        </div>

        <div className="mt-4">
          <div className="flex items-baseline gap-1.5">
            <span
              className={cn(
                'num text-4xl font-bold tracking-tight',
                available >= 0 ? 'text-ink' : 'text-red-600 dark:text-red-400',
              )}
            >
              {formatCalories(Math.abs(available))}
            </span>
            <span className="text-sm font-medium text-muted">{available >= 0 ? 'kcal available' : 'kcal over'}</span>
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-muted">
            {available >= 0 ? (
              <>
                After {formatCalories(summary.consumed)} kcal eaten and {formatCalories(summary.planned)} kcal planned.
                This is simply what's left of your daily target — not a separate allowance.
              </>
            ) : (
              <>
                Your eaten and planned food already exceed today's target by{' '}
                <strong className="font-semibold text-red-600 dark:text-red-400">{formatCalories(-available)} kcal</strong>.
              </>
            )}
          </p>
        </div>

        <div className="mt-4 rounded-xl border border-line bg-surface-2/50 p-3">
          <label htmlFor="treat-preview" className="text-[11px] font-semibold text-ink">
            Would a treat fit?
          </label>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="relative flex-1">
              <input
                id="treat-preview"
                type="number"
                min="0"
                step="10"
                inputMode="numeric"
                value={treatValue}
                onChange={(event) => setTreatValue(event.target.value)}
                placeholder="e.g. 300"
                className="input h-9 pr-12 text-sm"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[11px] font-medium text-muted">
                kcal
              </span>
            </div>
            {preview ? (
              <span
                className={cn(
                  'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold',
                  preview.fits
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                    : 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
                )}
              >
                {preview.fits ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                {preview.fits
                  ? `${formatCalories(preview.remainingAfter)} left`
                  : `${formatCalories(preview.overBy)} over`}
              </span>
            ) : null}
          </div>
          {preview ? (
            <p className="mt-1.5 text-[10px] leading-relaxed text-muted">
              Projected total would be {formatCalories(preview.projectedAfter)} kcal
              {preview.fits ? ' — it fits.' : ' — this would take you over target.'}
            </p>
          ) : (
            <p className="mt-1.5 text-[10px] leading-relaxed text-muted">
              Preview any snack or dessert against your remaining planned budget.
            </p>
          )}
        </div>

        <button type="button" onClick={onAddTreat} className="btn-primary mt-3 w-full">
          <Plus className="h-4 w-4" />
          Add a snack or treat
        </button>
      </div>
    </section>
  )
}
