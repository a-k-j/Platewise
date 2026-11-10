import { AlertTriangle, ArrowUpRight, Clock3, Flame, Target } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { CalorieSummary } from '../../types'
import { calorieProgressPercent, projectedProgressPercent } from '../../lib/calculations'
import { formatCalories } from '../../lib/format'
import { cn } from '../../lib/cn'
import { ProgressRing } from '../ui/ProgressRing'

function RemainingValue({ value, tone }: { value: number; tone: 'accent' | 'amber' }) {
  if (value >= 0) {
    return (
      <span className={cn('num text-sm font-bold', tone === 'accent' ? 'text-accent' : 'text-amber-600 dark:text-amber-400')}>
        {formatCalories(value)} kcal
      </span>
    )
  }
  return (
    <span className="num inline-flex items-center gap-1 text-sm font-bold text-red-600 dark:text-red-400">
      <ArrowUpRight className="h-3.5 w-3.5" />
      Over by {formatCalories(-value)}
    </span>
  )
}

export function CalorieSummaryCard({ summary }: { summary: CalorieSummary }) {
  const consumedPercent = calorieProgressPercent(summary.consumed, summary.target)
  const projectedPercent = projectedProgressPercent(summary.projected, summary.target)
  const plannedWidth = Math.max(0, projectedPercent - consumedPercent)
  const optionsNote =
    summary.optionCount + summary.skippedCount > 0
      ? [
          summary.optionCount > 0
            ? `${summary.optionCount} ${summary.optionCount === 1 ? 'option' : 'options'} (${formatCalories(summary.optionCalories)} kcal)`
            : null,
          summary.skippedCount > 0
            ? `${summary.skippedCount} skipped (${formatCalories(summary.skippedCalories)} kcal)`
            : null,
        ]
          .filter(Boolean)
          .join(' · ')
      : null

  return (
    <section className="card overflow-hidden p-5 sm:p-6" aria-labelledby="calorie-summary-title">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="stat-label">Daily budget</p>
          <h2 id="calorie-summary-title" className="mt-1 text-lg font-semibold tracking-tight text-ink">
            Calorie summary
          </h2>
        </div>
        <Link
          to="/settings"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-surface-2/60 px-2.5 py-1 text-[11px] font-semibold text-muted transition-colors hover:text-ink"
        >
          <Target className="h-3 w-3" />
          {formatCalories(summary.target)} kcal
        </Link>
      </div>

      <div className="mt-5 flex flex-col items-center gap-6 sm:flex-row sm:items-center">
        <ProgressRing consumed={summary.consumed} planned={summary.planned} target={summary.target} />

        <div className="w-full min-w-0 flex-1">
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/70 p-2.5 dark:border-emerald-500/20 dark:bg-emerald-500/10">
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-emerald-700 dark:text-emerald-300">
                Consumed
              </p>
              <p className="num mt-1 text-xl font-bold tracking-tight text-ink">{formatCalories(summary.consumed)}</p>
              <p className="text-[10px] font-medium text-emerald-700/80 dark:text-emerald-300/80">actual kcal</p>
            </div>
            <div className="rounded-xl border border-amber-200/70 bg-amber-50/70 p-2.5 dark:border-amber-500/20 dark:bg-amber-500/10">
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-amber-700 dark:text-amber-300">
                Planned
              </p>
              <p className="num mt-1 text-xl font-bold tracking-tight text-ink">{formatCalories(summary.planned)}</p>
              <p className="text-[10px] font-medium text-amber-700/80 dark:text-amber-300/80">not yet eaten</p>
            </div>
            <div className="rounded-xl border border-line bg-surface-2/60 p-2.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted">Projected</p>
              <p className="num mt-1 text-xl font-bold tracking-tight text-ink">{formatCalories(summary.projected)}</p>
              <p className="text-[10px] font-medium text-muted">eaten + planned</p>
            </div>
          </div>

          <div className="mt-3 divide-y divide-line rounded-xl border border-line bg-surface">
            <div className="flex items-center justify-between gap-3 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Flame className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-xs font-medium text-muted">Remaining after eaten</span>
              </div>
              <RemainingValue value={summary.remainingAfterConsumed} tone="accent" />
            </div>
            <div className="flex items-center justify-between gap-3 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Clock3 className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-xs font-medium text-muted">Remaining after planned</span>
              </div>
              <RemainingValue value={summary.remainingAfterPlanned} tone="amber" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5">
        <div className="relative h-2.5 overflow-hidden rounded-full bg-surface-2">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-accent transition-all duration-500"
            style={{ width: `${consumedPercent}%` }}
          />
          <div
            className="absolute inset-y-0 rounded-full bg-amber-400 transition-all duration-500 dark:bg-amber-500"
            style={{ left: `${consumedPercent}%`, width: `${plannedWidth}%` }}
          />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-medium text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-accent" />
            Eaten
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-400 dark:bg-amber-500" />
            Planned
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-line" />
            Target {formatCalories(summary.target)}
          </span>
        </div>
      </div>

      {summary.overConsumedBy > 0 ? (
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-medium text-red-800 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            You are <strong className="font-bold">{formatCalories(summary.overConsumedBy)} kcal over</strong> today's
            target. You can still log food — the total will keep the overage visible.
          </p>
        </div>
      ) : summary.overProjectedBy > 0 ? (
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-medium text-amber-900 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Your planned food would put you{' '}
            <strong className="font-bold">{formatCalories(summary.overProjectedBy)} kcal over</strong> target.
          </p>
        </div>
      ) : null}

      {optionsNote ? (
        <p className="mt-3 text-[11px] leading-relaxed text-muted">
          Not counted toward totals: {optionsNote}.
        </p>
      ) : null}
    </section>
  )
}
