import { ArrowDownRight, ArrowUpRight, CalendarCheck2, Flame, Minus, Target, TrendingUp } from 'lucide-react'
import type { WeekStats } from '../../types'
import { formatShortDate } from '../../lib/dates'
import { formatCalories } from '../../lib/format'
import { cn } from '../../lib/cn'

interface WeeklyStatsProps {
  stats: WeekStats
  target: number
}

function StatCard({
  label,
  value,
  suffix,
  detail,
  icon: Icon,
  tone = 'neutral',
}: {
  label: string
  value: string
  suffix?: string
  detail: string
  icon: typeof Flame
  tone?: 'neutral' | 'good' | 'warn'
}) {
  return (
    <div className="card-flat p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="stat-label">{label}</p>
        <span
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-full',
            tone === 'good'
              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
              : tone === 'warn'
                ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                : 'bg-surface-2 text-muted',
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
      </div>
      <p className="num mt-2 text-2xl font-bold tracking-tight text-ink">
        {value}
        {suffix ? <span className="ml-1 text-xs font-semibold text-muted">{suffix}</span> : null}
      </p>
      <p className="mt-1 text-[11px] leading-snug text-muted">{detail}</p>
    </div>
  )
}

export function WeeklyStats({ stats, target }: WeeklyStatsProps) {
  const average = stats.averageConsumed
  const averageDelta = average == null ? null : average - target
  const untracked = stats.days.length - stats.trackedDays

  const summary =
    stats.trackedDays === 0
      ? 'No meals tracked this week yet. Add food on the Today page and your weekly picture will build itself.'
      : `You tracked ${stats.trackedDays} of ${stats.days.length} days and averaged ${formatCalories(
          average ?? 0,
        )} kcal on those days. ${
          averageDelta == null || Math.abs(averageDelta) < 1
            ? 'That is right on your daily target.'
            : averageDelta > 0
              ? `That is ${formatCalories(averageDelta)} kcal above your ${formatCalories(target)} kcal target.`
              : `That leaves ${formatCalories(-averageDelta)} kcal below your ${formatCalories(target)} kcal target.`
        }`

  return (
    <section className="card p-5 sm:p-6" aria-labelledby="weekly-stats-title">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="stat-label">Summary</p>
          <h2 id="weekly-stats-title" className="mt-1 text-lg font-semibold tracking-tight text-ink">
            How the week went
          </h2>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2/60 px-2.5 py-1 text-[11px] font-semibold text-muted">
          <Target className="h-3 w-3" />
          {formatCalories(target)} kcal target
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <StatCard
          label="Daily average"
          value={average == null ? '—' : formatCalories(average)}
          suffix={average == null ? undefined : 'kcal'}
          detail={
            averageDelta == null
              ? 'No tracked days yet'
              : Math.abs(averageDelta) < 1
                ? 'On target'
                : averageDelta > 0
                  ? `${formatCalories(averageDelta)} kcal above target`
                  : `${formatCalories(-averageDelta)} kcal below target`
          }
          icon={TrendingUp}
          tone={averageDelta != null && averageDelta > 0 ? 'warn' : 'good'}
        />
        <StatCard
          label="Tracked days"
          value={String(stats.trackedDays)}
          suffix={`/ ${stats.days.length}`}
          detail={untracked === 0 ? 'Every day has entries' : `${untracked} untracked, excluded from averages`}
          icon={CalendarCheck2}
        />
        <StatCard
          label="Within target"
          value={stats.trackedDays === 0 ? '—' : String(stats.daysWithinTarget)}
          suffix={stats.trackedDays === 0 ? undefined : `/ ${stats.trackedDays}`}
          detail={
            stats.trackedDays === 0
              ? 'Nothing to compare yet'
              : `${Math.round((stats.daysWithinTarget / stats.trackedDays) * 100)}% of tracked days`
          }
          icon={Target}
          tone={stats.trackedDays > 0 && stats.daysWithinTarget === stats.trackedDays ? 'good' : 'neutral'}
        />
        <StatCard
          label="Week total"
          value={formatCalories(stats.totalConsumed)}
          suffix="kcal"
          detail={`Eaten across ${stats.trackedDays} ${stats.trackedDays === 1 ? 'day' : 'days'}`}
          icon={Flame}
        />
      </div>

      <div className="mt-4 rounded-xl border border-line bg-surface-2/50 p-4">
        <p className="text-xs leading-relaxed text-ink">{summary}</p>

        {stats.trackedDays > 0 ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="flex items-center justify-between gap-3 rounded-lg bg-surface px-3 py-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted">
                <ArrowUpRight className="h-3.5 w-3.5 text-red-500" />
                Highest day
              </span>
              <span className="num text-[11px] font-semibold text-ink">
                {stats.highest ? `${formatShortDate(stats.highest.date)} · ${formatCalories(stats.highest.consumed)}` : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg bg-surface px-3 py-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted">
                <ArrowDownRight className="h-3.5 w-3.5 text-emerald-500" />
                Lowest day
              </span>
              <span className="num text-[11px] font-semibold text-ink">
                {stats.lowest ? `${formatShortDate(stats.lowest.date)} · ${formatCalories(stats.lowest.consumed)}` : '—'}
              </span>
            </div>
          </div>
        ) : null}

        <p className="mt-3 flex items-start gap-1.5 text-[10px] leading-relaxed text-muted">
          <Minus className="mt-0.5 h-3 w-3 shrink-0" />
          Averages and target comparisons only include days with at least one meal entry. Untracked days are never
          treated as zero-calorie days.
        </p>
      </div>
    </section>
  )
}
