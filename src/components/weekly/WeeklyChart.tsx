import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { WeekStats } from '../../types'
import { formatWeekdayNarrow, formatShortDate } from '../../lib/dates'
import { formatCalories } from '../../lib/format'

interface WeeklyChartProps {
  stats: WeekStats
  target: number
  onSelectDay: (date: string) => void
}

interface ChartDatum {
  date: string
  day: string
  consumed: number
  planned: number
  projected: number
  tracked: boolean
}

interface TooltipPayloadItem {
  payload?: ChartDatum
}

interface WeeklyTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  target: number
}

function WeeklyTooltip({ active, payload, target }: WeeklyTooltipProps) {
  const datum = payload?.[0]?.payload
  if (!active || !datum) return null

  const remaining = target - datum.consumed
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2.5 text-xs shadow-card">
      <p className="font-semibold text-ink">{formatShortDate(datum.date)}</p>
      {!datum.tracked ? (
        <p className="mt-1 text-muted">Nothing tracked</p>
      ) : (
        <div className="mt-1.5 space-y-1">
          <p className="flex items-center justify-between gap-6 text-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-teal-500" />
              Eaten
            </span>
            <span className="num font-semibold text-ink">{formatCalories(datum.consumed)}</span>
          </p>
          <p className="flex items-center justify-between gap-6 text-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              Planned
            </span>
            <span className="num font-semibold text-ink">{formatCalories(datum.planned)}</span>
          </p>
          <p className="flex items-center justify-between gap-6 border-t border-line pt-1 text-muted">
            <span>Projected</span>
            <span className="num font-semibold text-ink">{formatCalories(datum.projected)}</span>
          </p>
          <p className="flex items-center justify-between gap-6 text-muted">
            <span>{remaining >= 0 ? 'Under target' : 'Over target'}</span>
            <span className="num font-semibold text-ink">{formatCalories(Math.abs(remaining))}</span>
          </p>
        </div>
      )}
      <p className="mt-1.5 text-[10px] font-medium text-muted">Tap to open this day</p>
    </div>
  )
}

export function WeeklyChart({ stats, target, onSelectDay }: WeeklyChartProps) {
  const data: ChartDatum[] = stats.days.map((day) => ({
    date: day.date,
    day: formatWeekdayNarrow(day.date),
    consumed: Math.round(day.consumed),
    planned: Math.round(day.planned),
    projected: Math.round(day.projected),
    tracked: day.tracked,
  }))

  const maxValue = Math.max(target, ...data.map((day) => day.projected), 1)
  const yMax = Math.ceil((maxValue * 1.12) / 100) * 100

  const handleChartClick = (state: { activePayload?: { payload?: ChartDatum }[] }) => {
    const datum = state.activePayload?.[0]?.payload
    if (datum) onSelectDay(datum.date)
  }

  return (
    <section className="card p-5 sm:p-6" aria-labelledby="weekly-chart-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="stat-label">Week at a glance</p>
          <h2 id="weekly-chart-title" className="mt-1 text-lg font-semibold tracking-tight text-ink">
            Daily calories
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-medium text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-teal-500" />
            Eaten
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            Planned
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-3 rounded-full bg-stone-400" />
            Target {formatCalories(target)}
          </span>
        </div>
      </div>

      <div className="mt-5 h-[260px] w-full sm:h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 12, right: 4, bottom: 0, left: -18 }}
            barCategoryGap="24%"
            onClick={handleChartClick}
            className="cursor-pointer"
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgb(var(--line))" />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'rgb(var(--muted))', fontSize: 11, fontWeight: 600 }}
              dy={6}
            />
            <YAxis
              domain={[0, yMax]}
              tickLine={false}
              axisLine={false}
              width={48}
              tick={{ fill: 'rgb(var(--muted))', fontSize: 10 }}
              tickFormatter={(value: number) => formatCalories(value)}
            />
            <Tooltip
              cursor={{ fill: 'rgb(var(--surface-2))', opacity: 0.7 }}
              content={<WeeklyTooltip target={target} />}
            />
            <ReferenceLine
              y={target}
              stroke="#a8a29e"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              ifOverflow="extendDomain"
              label={{
                value: `Target ${formatCalories(target)}`,
                position: 'insideTopRight',
                fill: 'rgb(var(--muted))',
                fontSize: 10,
                fontWeight: 600,
              }}
            />
            <Bar dataKey="consumed" name="Eaten" stackId="day" radius={[0, 0, 4, 4]} maxBarSize={38}>
              {data.map((datum) => (
                <Cell
                  key={datum.date}
                  fill={datum.tracked && datum.consumed > target ? '#ef4444' : '#14b8a6'}
                  fillOpacity={datum.tracked ? 1 : 0.35}
                />
              ))}
            </Bar>
            <Bar
              dataKey="planned"
              name="Planned"
              stackId="day"
              radius={[4, 4, 0, 0]}
              maxBarSize={38}
              fill="#fbbf24"
              fillOpacity={0.85}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-2 text-center text-[10px] font-medium text-muted">
        Tap any bar to open that day. Red bars are over target.
      </p>
    </section>
  )
}
