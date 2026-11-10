import { useMemo, useState } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  Minus,
  Pencil,
  Plus,
  Scale,
  Trash2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { WeightEntry, WeightUnit } from '../../types'
import { formatDayMonth, formatShortDate } from '../../lib/dates'
import { formatWeight, formatSigned } from '../../lib/format'
import { cn } from '../../lib/cn'
import { getWeightWeekSummary, kgToUnit } from '../../lib/calculations'
import { useWeightEntries } from '../../hooks/useWeights'
import { deleteWeightEntry } from '../../services/weightService'
import { EmptyState } from '../ui/EmptyState'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { useToast } from '../ui/ToastProvider'
import { WeightEditorSheet } from './WeightEditorSheet'

interface WeightSectionProps {
  dates: string[]
  unit: WeightUnit
}

interface TrendPoint {
  date: string
  label: string
  weight: number
  notes: string
}

interface WeightTooltipProps {
  active?: boolean
  payload?: { payload?: TrendPoint }[]
  unit: WeightUnit
}

function WeightTooltip({ active, payload, unit }: WeightTooltipProps) {
  const point = payload?.[0]?.payload
  if (!active || !point) return null
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2 text-xs shadow-card">
      <p className="font-semibold text-ink">{formatShortDate(point.date)}</p>
      <p className="num mt-0.5 text-muted">
        <span className="font-semibold text-ink">{point.weight.toFixed(1)}</span> {unit}
      </p>
      {point.notes ? <p className="mt-1 max-w-[180px] text-[10px] leading-snug text-muted">{point.notes}</p> : null}
    </div>
  )
}

export function WeightSection({ dates, unit }: WeightSectionProps) {
  const { entries } = useWeightEntries()
  const { toast } = useToast()
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<WeightEntry | null>(null)
  const [pendingDelete, setPendingDelete] = useState<WeightEntry | null>(null)

  const summary = useMemo(() => getWeightWeekSummary(entries, dates), [entries, dates])
  const latest = summary.latestOverall
  const previous = useMemo(() => {
    if (!latest) return null
    const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))
    const index = sorted.findIndex((entry) => entry.id === latest.id)
    return index > 0 ? sorted[index - 1] : null
  }, [entries, latest])

  const trendData: TrendPoint[] = useMemo(
    () =>
      entries.slice(-30).map((entry) => ({
        date: entry.date,
        label: formatDayMonth(entry.date),
        weight: Number(kgToUnit(entry.weightKg, unit).toFixed(1)),
        notes: entry.notes,
      })),
    [entries, unit],
  )

  const chartBounds = useMemo(() => {
    if (trendData.length === 0) return { min: 0, max: 1 }
    const values = trendData.map((point) => point.weight)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const padding = Math.max(0.5, (max - min) * 0.25)
    return { min: Math.floor((min - padding) * 10) / 10, max: Math.ceil((max + padding) * 10) / 10 }
  }, [trendData])

  const weekDates = new Set(dates)
  const recent = [...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8)
  const latestChangeKg = latest && previous ? latest.weightKg - previous.weightKg : null
  const weeklyChangeKg = summary.weeklyChangeKg

  const openLog = () => {
    setEditingEntry(null)
    setEditorOpen(true)
  }

  const openEdit = (entry: WeightEntry) => {
    setEditingEntry(entry)
    setEditorOpen(true)
  }

  const handleDelete = async () => {
    if (!pendingDelete) return
    try {
      await deleteWeightEntry(pendingDelete.id as number)
      toast('Weight entry deleted', 'info')
      setPendingDelete(null)
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Could not delete that weight entry.', 'error')
    }
  }

  const changeTone = weeklyChangeKg == null || Math.abs(weeklyChangeKg) < 0.05 ? 'neutral' : weeklyChangeKg > 0 ? 'up' : 'down'
  const ChangeIcon = changeTone === 'up' ? ArrowUpRight : changeTone === 'down' ? ArrowDownRight : Minus

  return (
    <section className="card p-5 sm:p-6" aria-labelledby="weight-section-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="stat-label">Body weight</p>
          <h2 id="weight-section-title" className="mt-1 text-lg font-semibold tracking-tight text-ink">
            Weight tracking
          </h2>
        </div>
        <button type="button" onClick={openLog} className="btn-secondary h-9 px-3 text-xs">
          <Plus className="h-3.5 w-3.5" />
          Log weight
        </button>
      </div>

      {latest ? (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <div>
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <p className="num text-3xl font-bold tracking-tight text-ink">{formatWeight(latest.weightKg, unit)}</p>
                <span className="text-[11px] font-medium text-muted">latest · {formatShortDate(latest.date)}</span>
              </div>
              {latestChangeKg != null ? (
                <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-muted">
                  {latestChangeKg > 0 ? (
                    <TrendingUp className="h-3 w-3 text-amber-500" />
                  ) : latestChangeKg < 0 ? (
                    <TrendingDown className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <Minus className="h-3 w-3" />
                  )}
                  {formatSigned(kgToUnit(latestChangeKg, unit))} {unit} since previous weigh-in
                </p>
              ) : null}
            </div>

            <div
              className={cn(
                'inline-flex items-center gap-2 self-start rounded-xl border px-3 py-2 sm:self-auto',
                changeTone === 'up'
                  ? 'border-amber-200 bg-amber-50/70 dark:border-amber-500/25 dark:bg-amber-500/10'
                  : changeTone === 'down'
                    ? 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-500/25 dark:bg-emerald-500/10'
                    : 'border-line bg-surface-2/60',
              )}
            >
              <ChangeIcon
                className={cn(
                  'h-4 w-4',
                  changeTone === 'up'
                    ? 'text-amber-600 dark:text-amber-400'
                    : changeTone === 'down'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-muted',
                )}
              />
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-muted">This week</p>
                <p className="num text-xs font-bold text-ink">
                  {weeklyChangeKg == null ? 'No baseline' : `${formatSigned(kgToUnit(weeklyChangeKg, unit))} ${unit}`}
                </p>
              </div>
            </div>
          </div>

          {trendData.length >= 2 ? (
            <div className="mt-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold text-ink">Trend</p>
                <p className="text-[10px] font-medium text-muted">
                  Last {trendData.length} weigh-in{trendData.length === 1 ? '' : 's'}
                </p>
              </div>
              <div className="mt-2 h-[170px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 8, right: 8, bottom: 0, left: -22 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgb(var(--line))" />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      minTickGap={24}
                      tick={{ fill: 'rgb(var(--muted))', fontSize: 10 }}
                      dy={4}
                    />
                    <YAxis
                      domain={[chartBounds.min, chartBounds.max]}
                      tickLine={false}
                      axisLine={false}
                      width={46}
                      tick={{ fill: 'rgb(var(--muted))', fontSize: 10 }}
                      tickFormatter={(value: number) => value.toFixed(1)}
                    />
                    <Tooltip content={<WeightTooltip unit={unit} />} />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="rgb(var(--accent))"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: 'rgb(var(--accent))', strokeWidth: 0 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <p className="mt-4 rounded-lg bg-surface-2 px-3 py-2 text-[11px] leading-relaxed text-muted">
              Log one more weigh-in to see a trend line. Weight is independent of your meal tracking, so you can log it
              on any day.
            </p>
          )}

          <div className="mt-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-semibold text-ink">Recent weigh-ins</p>
              <p className="text-[10px] font-medium text-muted">{entries.length} total</p>
            </div>
            <div className="mt-2 divide-y divide-line rounded-xl border border-line">
              {recent.map((entry) => (
                <div key={entry.id} className="flex items-center gap-3 px-3 py-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-2 text-muted">
                    <Scale className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="text-xs font-semibold text-ink">{formatShortDate(entry.date)}</p>
                      {weekDates.has(entry.date) ? (
                        <span className="pill bg-accent-soft text-accent">This week</span>
                      ) : null}
                    </div>
                    {entry.notes ? <p className="truncate text-[10px] text-muted">{entry.notes}</p> : null}
                  </div>
                  <p className="num shrink-0 text-xs font-bold text-ink">{formatWeight(entry.weightKg, unit)}</p>
                  <div className="flex shrink-0 items-center">
                    <button
                      type="button"
                      onClick={() => openEdit(entry)}
                      className="icon-btn h-8 w-8"
                      aria-label={`Edit weight for ${formatShortDate(entry.date)}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDelete(entry)}
                      className="icon-btn h-8 w-8 hover:text-red-600 dark:hover:text-red-400"
                      aria-label={`Delete weight for ${formatShortDate(entry.date)}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="mt-4">
          <EmptyState
            compact
            icon={Scale}
            title="No weigh-ins yet"
            description="Weight tracking is optional. Log a weight whenever you like — it never affects your calorie totals."
            action={
              <button type="button" onClick={openLog} className="btn-secondary h-9 px-3 text-xs">
                <Plus className="h-3.5 w-3.5" />
                Log first weight
              </button>
            }
          />
        </div>
      )}

      <WeightEditorSheet open={editorOpen} entry={editingEntry} unit={unit} onClose={() => setEditorOpen(false)} />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this weigh-in?"
        description={
          pendingDelete
            ? `The weight entry for ${formatShortDate(pendingDelete.date)} will be removed. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete weigh-in"
        destructive
        onConfirm={handleDelete}
        onClose={() => setPendingDelete(null)}
      />
    </section>
  )
}
