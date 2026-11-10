import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import type { WeightEntry } from '../types'

export function useWeightEntries(): { entries: WeightEntry[]; isLoading: boolean } {
  const entries = useLiveQuery(() => db.weightEntries.orderBy('date').toArray(), [])
  return {
    entries: entries ?? [],
    isLoading: entries === undefined,
  }
}

export function useWeekWeights(dates: string[]): { entries: WeightEntry[]; isLoading: boolean } {
  const start = dates[0] ?? ''
  const end = dates[dates.length - 1] ?? ''
  const entries = useLiveQuery(async () => {
    if (!start || !end) return []
    const [weekEntries, before] = await Promise.all([
      db.weightEntries.where('date').between(start, end, true, true).toArray(),
      db.weightEntries.where('date').below(start).reverse().limit(1).toArray(),
    ])
    return [...before, ...weekEntries].sort((a, b) => a.date.localeCompare(b.date))
  }, [start, end])
  return {
    entries: entries ?? [],
    isLoading: entries === undefined,
  }
}
