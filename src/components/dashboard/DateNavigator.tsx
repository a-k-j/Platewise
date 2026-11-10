import { CalendarDays, ChevronLeft, ChevronRight, Flame, Settings2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { addDays, formatLongDate, formatRelativeDay, isTodayKey, todayKey } from '../../lib/dates'
import { formatCalories } from '../../lib/format'

interface DateNavigatorProps {
  date: string
  target: number
  onChangeDate: (date: string) => void
}

export function DateNavigator({ date, target, onChangeDate }: DateNavigatorProps) {
  const isToday = isTodayKey(date)

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
            {isToday ? 'Today' : formatRelativeDay(date)}
          </p>
          <span className="h-1 w-1 rounded-full bg-line" />
          <Link
            to="/settings"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted transition-colors hover:text-accent"
          >
            <Flame className="h-3 w-3" />
            {formatCalories(target)} kcal target
            <Settings2 className="h-3 w-3 opacity-60" />
          </Link>
        </div>
        <h1 className="mt-1 truncate text-2xl font-bold tracking-tight text-ink sm:text-[28px]">
          {formatLongDate(date)}
        </h1>
      </div>

      <div className="flex items-center gap-1.5 self-start sm:self-auto">
        <button
          type="button"
          className="icon-btn border border-line bg-surface"
          onClick={() => onChangeDate(addDays(date, -1))}
          aria-label="Previous day"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => onChangeDate(addDays(date, 1))}
          className="icon-btn border border-line bg-surface"
          aria-label="Next day"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        <label className="relative inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-xs font-semibold text-ink transition-colors hover:bg-surface-2">
          <CalendarDays className="h-3.5 w-3.5 text-muted" />
          Pick date
          <input
            type="date"
            value={date}
            onChange={(event) => {
              if (event.target.value) onChangeDate(event.target.value)
            }}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            aria-label="Pick a date"
          />
        </label>

        {!isToday ? (
          <button
            type="button"
            onClick={() => onChangeDate(todayKey())}
            className="btn-secondary h-9 px-3 text-xs"
          >
            Today
          </button>
        ) : null}
      </div>
    </div>
  )
}
