import type {
  CalorieSummary,
  FoodItem,
  MealEntry,
  WeekDaySummary,
  WeekStats,
  WeightEntry,
  WeightWeekSummary,
} from '../types'
import { addDays, parseDateKey } from './dates'

export function entryCalories(entry: MealEntry): number {
  return Math.max(0, entry.quantity * entry.caloriesSnapshot)
}

export function entryProtein(entry: MealEntry): number {
  return Math.max(0, entry.quantity * (entry.proteinSnapshot ?? 0))
}

export function entryCarbohydrates(entry: MealEntry): number {
  return Math.max(0, entry.quantity * (entry.carbohydratesSnapshot ?? 0))
}

export function entryFat(entry: MealEntry): number {
  return Math.max(0, entry.quantity * (entry.fatSnapshot ?? 0))
}

export function entryFibre(entry: MealEntry): number {
  return Math.max(0, entry.quantity * (entry.fibreSnapshot ?? 0))
}

export function summarizeEntries(entries: MealEntry[], target: number): CalorieSummary {
  let consumed = 0
  let planned = 0
  let optionCalories = 0
  let skippedCalories = 0
  let eatenCount = 0
  let plannedCount = 0
  let optionCount = 0
  let skippedCount = 0

  for (const entry of entries) {
    const calories = entryCalories(entry)
    switch (entry.status) {
      case 'eaten':
        consumed += calories
        eatenCount += 1
        break
      case 'planned':
        planned += calories
        plannedCount += 1
        break
      case 'option':
        optionCalories += calories
        optionCount += 1
        break
      case 'skipped':
        skippedCalories += calories
        skippedCount += 1
        break
    }
  }

  const projected = consumed + planned
  const remainingAfterConsumed = target - consumed
  const remainingAfterPlanned = target - projected

  return {
    target,
    consumed,
    planned,
    projected,
    remainingAfterConsumed,
    remainingAfterPlanned,
    overConsumedBy: Math.max(0, -remainingAfterConsumed),
    overProjectedBy: Math.max(0, -remainingAfterPlanned),
    optionCalories,
    skippedCalories,
    eatenCount,
    plannedCount,
    optionCount,
    skippedCount,
  }
}

export function summarizeMacros(entries: MealEntry[]): {
  protein: number
  carbohydrates: number
  fat: number
} {
  return entries
    .filter((entry) => entry.status === 'eaten')
    .reduce(
      (totals, entry) => ({
        protein: totals.protein + entryProtein(entry),
        carbohydrates: totals.carbohydrates + entryCarbohydrates(entry),
        fat: totals.fat + entryFat(entry),
      }),
      { protein: 0, carbohydrates: 0, fat: 0 },
    )
}

export function summarizeDay(entries: MealEntry[]): {
  consumed: number
  planned: number
  projected: number
  entryCount: number
  tracked: boolean
} {
  let consumed = 0
  let planned = 0
  for (const entry of entries) {
    if (entry.status === 'eaten') consumed += entryCalories(entry)
    if (entry.status === 'planned') planned += entryCalories(entry)
  }
  return {
    consumed,
    planned,
    projected: consumed + planned,
    entryCount: entries.length,
    tracked: entries.length > 0,
  }
}

export function computeWeekStats(dates: string[], entries: MealEntry[], target: number): WeekStats {
  const entriesByDate = new Map<string, MealEntry[]>()
  for (const entry of entries) {
    const list = entriesByDate.get(entry.date) ?? []
    list.push(entry)
    entriesByDate.set(entry.date, list)
  }

  const days: WeekDaySummary[] = dates.map((date) => {
    const dayEntries = entriesByDate.get(date) ?? []
    const totals = summarizeDay(dayEntries)
    return {
      date,
      ...totals,
      withinTarget: totals.consumed <= target,
    }
  })

  const tracked = days.filter((day) => day.tracked)
  const totalConsumed = tracked.reduce((sum, day) => sum + day.consumed, 0)
  const daysWithinTarget = tracked.filter((day) => day.withinTarget).length

  let highest: WeekDaySummary | null = null
  let lowest: WeekDaySummary | null = null
  for (const day of tracked) {
    if (!highest || day.consumed > highest.consumed) highest = day
    if (!lowest || day.consumed < lowest.consumed) lowest = day
  }

  return {
    days,
    totalConsumed,
    averageConsumed: tracked.length > 0 ? totalConsumed / tracked.length : null,
    trackedDays: tracked.length,
    daysWithinTarget,
    highest,
    lowest,
  }
}

export function getWeightWeekSummary(
  allEntries: WeightEntry[],
  weekDates: string[],
): WeightWeekSummary {
  const sorted = [...allEntries].sort((a, b) => a.date.localeCompare(b.date))
  const weekStart = weekDates[0] ?? ''
  const weekEnd = weekDates[weekDates.length - 1] ?? ''

  const weekEntries = sorted.filter((entry) => entry.date >= weekStart && entry.date <= weekEnd)
  const baselineEntries = sorted.filter((entry) => entry.date < weekStart)
  const baseline = baselineEntries.length > 0 ? baselineEntries[baselineEntries.length - 1] : null
  const latestInWeek = weekEntries.length > 0 ? weekEntries[weekEntries.length - 1] : null
  const latestOverall = sorted.length > 0 ? sorted[sorted.length - 1] : null

  let weeklyChangeKg: number | null = null
  if (latestInWeek && baseline) {
    weeklyChangeKg = latestInWeek.weightKg - baseline.weightKg
  } else if (weekEntries.length >= 2) {
    weeklyChangeKg = weekEntries[weekEntries.length - 1].weightKg - weekEntries[0].weightKg
  }

  return { weekEntries, latestOverall, latestInWeek, weeklyChangeKg, baseline }
}

export function scaleFoodNutrition(
  food: Pick<FoodItem, 'calories' | 'protein' | 'carbohydrates' | 'fat'>,
  quantity: number,
): { calories: number; protein: number | null; carbohydrates: number | null; fat: number | null } {
  const safeQuantity = Math.max(0, quantity)
  return {
    calories: Math.max(0, food.calories * safeQuantity),
    protein: food.protein == null ? null : Math.max(0, food.protein * safeQuantity),
    carbohydrates: food.carbohydrates == null ? null : Math.max(0, food.carbohydrates * safeQuantity),
    fat: food.fat == null ? null : Math.max(0, food.fat * safeQuantity),
  }
}

export function previewTreat(projected: number, treatCalories: number, target: number): {
  projectedAfter: number
  remainingAfter: number
  overBy: number
  fits: boolean
} {
  const projectedAfter = projected + Math.max(0, treatCalories)
  const remainingAfter = target - projectedAfter
  return {
    projectedAfter,
    remainingAfter,
    overBy: Math.max(0, -remainingAfter),
    fits: remainingAfter >= 0,
  }
}

export function calorieProgressPercent(consumed: number, target: number): number {
  if (target <= 0) return 0
  return Math.max(0, Math.min(100, (consumed / target) * 100))
}

export function projectedProgressPercent(projected: number, target: number): number {
  if (target <= 0) return 0
  return Math.max(0, Math.min(100, (projected / target) * 100))
}

/** Returns the most recent entries grouped into meals with at least one eaten item. */
export function findRecentMeals(entries: MealEntry[], today: string, limit = 8): {
  date: string
  mealType: MealEntry['mealType']
  entries: MealEntry[]
}[] {
  const byMeal = new Map<string, MealEntry[]>()
  for (const entry of entries) {
    if (entry.date >= today) continue
    if (entry.status !== 'eaten') continue
    const key = `${entry.date}|${entry.mealType}`
    const list = byMeal.get(key) ?? []
    list.push(entry)
    byMeal.set(key, list)
  }

  return [...byMeal.entries()]
    .map(([key, mealEntries]) => {
      const [date, mealType] = key.split('|')
      return { date, mealType: mealType as MealEntry['mealType'], entries: mealEntries }
    })
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit)
}

export function isDateInRange(date: string, start: string, end: string): boolean {
  return date >= start && date <= end
}

export function shiftWeek(anchor: string, weeks: number): string {
  return addDays(anchor, weeks * 7)
}

export function compareDateKeys(a: string, b: string): number {
  return a.localeCompare(b)
}

export function weightEntrySort(a: WeightEntry, b: WeightEntry): number {
  return a.date.localeCompare(b.date)
}

export function daysBetweenInclusive(start: string, end: string): number {
  return Math.round((parseDateKey(end).getTime() - parseDateKey(start).getTime()) / 86_400_000) + 1
}
