import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import type { MealEntry } from '../types'
import { addDays, todayKey } from '../lib/dates'

function sortEntries(entries: MealEntry[]): MealEntry[] {
  return entries.sort((a, b) => {
    const byCreated = a.createdAt.localeCompare(b.createdAt)
    if (byCreated !== 0) return byCreated
    return (a.id ?? 0) - (b.id ?? 0)
  })
}

export function useDayEntries(date: string): { entries: MealEntry[]; isLoading: boolean } {
  const entries = useLiveQuery(() => db.mealEntries.where('date').equals(date).toArray(), [date])
  return {
    entries: entries ? sortEntries(entries) : [],
    isLoading: entries === undefined,
  }
}

export function useWeekEntries(dates: string[]): { entries: MealEntry[]; isLoading: boolean } {
  const start = dates[0] ?? ''
  const end = dates[dates.length - 1] ?? ''
  const entries = useLiveQuery(async () => {
    if (!start || !end) return []
    return db.mealEntries.where('date').between(start, end, true, true).toArray()
  }, [start, end])
  return {
    entries: entries ?? [],
    isLoading: entries === undefined,
  }
}

export function useRecentEatenEntries(days = 21): { entries: MealEntry[]; isLoading: boolean } {
  const end = addDays(todayKey(), -1)
  const start = addDays(end, -(days - 1))
  const entries = useLiveQuery(
    () => db.mealEntries.where('date').between(start, end, true, true).toArray(),
    [start, end],
  )
  return {
    entries: entries ?? [],
    isLoading: entries === undefined,
  }
}

export function useRecentMealEntries(limit = 250): { entries: MealEntry[]; isLoading: boolean } {
  const entries = useLiveQuery(
    () => db.mealEntries.orderBy('createdAt').reverse().limit(limit).toArray(),
    [limit],
  )
  return {
    entries: entries ?? [],
    isLoading: entries === undefined,
  }
}
