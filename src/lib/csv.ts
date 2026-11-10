import type { MealEntry, WeightEntry } from '../types'
import { summarizeDay } from './calculations'
import { formatWeekdayShort } from './dates'

function escapeCsv(value: string | number | null | undefined): string {
  if (value == null) return ''
  const text = String(value)
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

export function buildWeeklyCsv(
  dates: string[],
  entries: MealEntry[],
  weights: WeightEntry[],
  target: number,
): string {
  const entriesByDate = new Map<string, MealEntry[]>()
  for (const entry of entries) {
    const list = entriesByDate.get(entry.date) ?? []
    list.push(entry)
    entriesByDate.set(entry.date, list)
  }
  const weightByDate = new Map(weights.map((weight) => [weight.date, weight.weightKg]))

  const rows: string[][] = [
    ['date', 'day', 'consumed_kcal', 'planned_kcal', 'projected_kcal', 'target_kcal', 'tracked', 'weight_kg'],
  ]

  for (const date of dates) {
    const totals = summarizeDay(entriesByDate.get(date) ?? [])
    rows.push([
      date,
      formatWeekdayShort(date),
      totals.consumed.toFixed(1),
      totals.planned.toFixed(1),
      totals.projected.toFixed(1),
      target.toFixed(0),
      totals.tracked ? 'yes' : 'no',
      weightByDate.has(date) ? (weightByDate.get(date) as number).toFixed(2) : '',
    ])
  }

  return `\uFEFF${rows.map((row) => row.map(escapeCsv).join(',')).join('\r\n')}\r\n`
}
