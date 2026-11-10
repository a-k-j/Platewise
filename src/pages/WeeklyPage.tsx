import { useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { CalendarDays, ChevronLeft, ChevronRight, Settings2 } from 'lucide-react'
import {
  addDays,
  formatWeekRangeLabel,
  getWeekDates,
  getWeekStartKey,
  getWeekStartOptions,
  isValidDateKey,
  todayKey,
} from '../lib/dates'
import { computeWeekStats } from '../lib/calculations'
import { useSettings } from '../hooks/useSettings'
import { useWeekEntries } from '../hooks/useMeals'
import { WeeklyChart } from '../components/weekly/WeeklyChart'
import { WeeklyStats } from '../components/weekly/WeeklyStats'
import { WeightSection } from '../components/weekly/WeightSection'

export function WeeklyPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { settings } = useSettings()

  const weekParam = searchParams.get('week')
  const anchor = weekParam && isValidDateKey(weekParam) ? weekParam : todayKey()
  const dates = useMemo(() => getWeekDates(anchor, settings.weekStartsOn), [anchor, settings.weekStartsOn])
  const weekStart = dates[0]
  const currentWeekStart = getWeekStartKey(todayKey(), settings.weekStartsOn)

  const { entries } = useWeekEntries(dates)
  const stats = useMemo(
    () => computeWeekStats(dates, entries, settings.dailyCalorieTarget),
    [dates, entries, settings.dailyCalorieTarget],
  )

  const weekStartLabel = getWeekStartOptions().find((option) => option.value === settings.weekStartsOn)?.label ?? 'Monday'

  const changeWeek = (nextStart: string) => {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current)
        if (nextStart === currentWeekStart) next.delete('week')
        else next.set('week', nextStart)
        return next
      },
      { replace: true },
    )
  }

  const shiftWeek = (amount: number) => {
    changeWeek(addDays(weekStart, amount * 7))
  }

  const openDay = (date: string) => {
    navigate(date === todayKey() ? '/' : `/?date=${date}`)
  }

  const isCurrentWeek = weekStart === currentWeekStart

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
              {isCurrentWeek ? 'This week' : 'Weekly view'}
            </p>
            <span className="h-1 w-1 rounded-full bg-line" />
            <Link
              to="/settings"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted transition-colors hover:text-accent"
            >
              Week starts {weekStartLabel}
              <Settings2 className="h-3 w-3 opacity-60" />
            </Link>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-[28px]">
            {formatWeekRangeLabel(dates)}
          </h1>
          <p className="mt-1 text-xs text-muted">
            Eaten and planned calories day by day, with averages that ignore untracked days.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
          <button
            type="button"
            className="icon-btn border border-line bg-surface"
            onClick={() => shiftWeek(-1)}
            aria-label="Previous week"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="icon-btn border border-line bg-surface"
            onClick={() => shiftWeek(1)}
            aria-label="Next week"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <label className="relative inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-xs font-semibold text-ink transition-colors hover:bg-surface-2">
            <CalendarDays className="h-3.5 w-3.5 text-muted" />
            Pick week
            <input
              type="date"
              value={weekStart}
              onChange={(event) => {
                if (event.target.value && isValidDateKey(event.target.value)) {
                  changeWeek(getWeekStartKey(event.target.value, settings.weekStartsOn))
                }
              }}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              aria-label="Pick a week"
            />
          </label>

          {!isCurrentWeek ? (
            <button
              type="button"
              onClick={() => changeWeek(currentWeekStart)}
              className="btn-secondary h-9 px-3 text-xs"
            >
              This week
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <WeeklyChart stats={stats} target={settings.dailyCalorieTarget} onSelectDay={openDay} />
        <WeeklyStats stats={stats} target={settings.dailyCalorieTarget} />
        <WeightSection dates={dates} unit={settings.weightUnit} />
      </div>
    </div>
  )
}
