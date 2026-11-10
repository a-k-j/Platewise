import { cn } from '../../lib/cn'
import { formatCalories } from '../../lib/format'

interface ProgressRingProps {
  consumed: number
  planned: number
  target: number
}

export function ProgressRing({ consumed, planned, target }: ProgressRingProps) {
  const safeTarget = Math.max(1, target)
  const consumedPercent = Math.max(0, Math.min(100, (consumed / safeTarget) * 100))
  const projectedPercent = Math.max(0, Math.min(100, ((consumed + planned) / safeTarget) * 100))
  const plannedPercent = Math.max(0, projectedPercent - consumedPercent)
  const isOver = consumed > target

  return (
    <div className="relative h-40 w-40 shrink-0">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="60" cy="60" r="50" fill="none" strokeWidth="10" className="stroke-line" />
        {plannedPercent > 0 ? (
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray={`${plannedPercent} ${100 - plannedPercent}`}
            strokeDashoffset={-consumedPercent}
            className="stroke-amber-400 dark:stroke-amber-500"
          />
        ) : null}
        {consumedPercent > 0 ? (
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray={`${consumedPercent} ${100 - consumedPercent}`}
            className={isOver ? 'stroke-red-500' : 'stroke-accent'}
          />
        ) : null}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="stat-label">Consumed</span>
        <span className={cn('num mt-0.5 text-3xl font-bold tracking-tight', isOver ? 'text-red-600 dark:text-red-400' : 'text-ink')}>
          {formatCalories(consumed)}
        </span>
        <span className="num text-xs font-medium text-muted">of {formatCalories(target)} kcal</span>
      </div>
    </div>
  )
}
