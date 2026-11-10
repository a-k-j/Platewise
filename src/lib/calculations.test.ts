import { describe, expect, it } from 'vitest'
import type { MealEntry, WeightEntry } from '../types'
import {
  calorieProgressPercent,
  computeWeekStats,
  entryCalories,
  getWeightWeekSummary,
  previewTreat,
  scaleFoodNutrition,
  summarizeDay,
  summarizeEntries,
  summarizeMacros,
} from './calculations'

function makeEntry(overrides: Partial<MealEntry>): MealEntry {
  return {
    id: 1,
    date: '2026-11-09',
    mealType: 'breakfast',
    foodItemId: null,
    foodNameSnapshot: 'Test food',
    quantity: 1,
    servingDescriptionSnapshot: '1 serving',
    caloriesSnapshot: 100,
    proteinSnapshot: 5,
    carbohydratesSnapshot: 10,
    fatSnapshot: 2,
    fibreSnapshot: 3,
    status: 'eaten',
    notes: '',
    createdAt: '2026-11-09T08:00:00.000Z',
    updatedAt: '2026-11-09T08:00:00.000Z',
    ...overrides,
  }
}

function makeWeight(date: string, weightKg: number): WeightEntry {
  return {
    id: Number(date.replaceAll('-', '')),
    date,
    weightKg,
    notes: '',
    createdAt: `${date}T08:00:00.000Z`,
    updatedAt: `${date}T08:00:00.000Z`,
  }
}

describe('entry calories', () => {
  it('scales nutrition by quantity', () => {
    const entry = makeEntry({ quantity: 2.5, caloriesSnapshot: 120, proteinSnapshot: 4 })
    expect(entryCalories(entry)).toBe(300)
  })

  it('never returns a negative calorie value', () => {
    expect(entryCalories(makeEntry({ quantity: -2 }))).toBe(0)
  })
})

describe('summarizeEntries', () => {
  it('counts eaten and planned, and keeps options and skipped out of totals', () => {
    const entries = [
      makeEntry({ status: 'eaten', caloriesSnapshot: 200 }),
      makeEntry({ status: 'planned', caloriesSnapshot: 150 }),
      makeEntry({ status: 'option', caloriesSnapshot: 50 }),
      makeEntry({ status: 'skipped', caloriesSnapshot: 75 }),
    ]

    const summary = summarizeEntries(entries, 500)
    expect(summary.consumed).toBe(200)
    expect(summary.planned).toBe(150)
    expect(summary.projected).toBe(350)
    expect(summary.remainingAfterConsumed).toBe(300)
    expect(summary.remainingAfterPlanned).toBe(150)
    expect(summary.optionCalories).toBe(50)
    expect(summary.skippedCalories).toBe(75)
    expect(summary.eatenCount).toBe(1)
    expect(summary.plannedCount).toBe(1)
    expect(summary.optionCount).toBe(1)
    expect(summary.skippedCount).toBe(1)
  })

  it('reports overages separately for eaten and projected calories', () => {
    const entries = [
      makeEntry({ status: 'eaten', caloriesSnapshot: 600 }),
      makeEntry({ status: 'planned', caloriesSnapshot: 300 }),
    ]
    const summary = summarizeEntries(entries, 500)
    expect(summary.overConsumedBy).toBe(100)
    expect(summary.overProjectedBy).toBe(400)
    expect(summary.remainingAfterPlanned).toBe(-400)
  })
})

describe('summarizeDay and macros', () => {
  it('treats any entry as a tracked day, including option-only days', () => {
    expect(summarizeDay([makeEntry({ status: 'option' })])).toMatchObject({
      consumed: 0,
      planned: 0,
      entryCount: 1,
      tracked: true,
    })
    expect(summarizeDay([])).toMatchObject({ consumed: 0, tracked: false })
  })

  it('only totals macros for eaten entries', () => {
    const macros = summarizeMacros([
      makeEntry({ status: 'eaten', quantity: 2 }),
      makeEntry({ status: 'planned', quantity: 3 }),
    ])
    expect(macros).toEqual({ protein: 10, carbohydrates: 20, fat: 4 })
  })
})

describe('computeWeekStats', () => {
  const dates = [
    '2026-11-09',
    '2026-11-10',
    '2026-11-11',
    '2026-11-12',
    '2026-11-13',
    '2026-11-14',
    '2026-11-15',
  ]

  it('excludes untracked days from totals and averages', () => {
    const entries = [
      makeEntry({ date: '2026-11-09', caloriesSnapshot: 800 }),
      makeEntry({ date: '2026-11-10', caloriesSnapshot: 1000 }),
      makeEntry({ date: '2026-11-11', status: 'planned', caloriesSnapshot: 200 }),
    ]

    const stats = computeWeekStats(dates, entries, 900)
    expect(stats.days).toHaveLength(7)
    expect(stats.trackedDays).toBe(3)
    expect(stats.totalConsumed).toBe(1800)
    expect(stats.averageConsumed).toBe(600)
    expect(stats.daysWithinTarget).toBe(2)
    expect(stats.highest?.date).toBe('2026-11-10')
    expect(stats.lowest?.date).toBe('2026-11-11')
    expect(stats.days[6].tracked).toBe(false)
  })

  it('returns null averages when nothing is tracked', () => {
    const stats = computeWeekStats(dates, [], 900)
    expect(stats.trackedDays).toBe(0)
    expect(stats.averageConsumed).toBeNull()
    expect(stats.highest).toBeNull()
    expect(stats.lowest).toBeNull()
  })
})

describe('getWeightWeekSummary', () => {
  const dates = [
    '2026-11-09',
    '2026-11-10',
    '2026-11-11',
    '2026-11-12',
    '2026-11-13',
    '2026-11-14',
    '2026-11-15',
  ]

  it('compares the latest in-week weigh-in against the latest prior baseline', () => {
    const entries = [makeWeight('2026-11-01', 70), makeWeight('2026-11-10', 69.5), makeWeight('2026-11-14', 69)]
    const summary = getWeightWeekSummary(entries, dates)
    expect(summary.weekEntries).toHaveLength(2)
    expect(summary.baseline?.weightKg).toBe(70)
    expect(summary.latestInWeek?.weightKg).toBe(69)
    expect(summary.weeklyChangeKg).toBe(-1)
  })

  it('falls back to the first and last weigh-in inside the week when no baseline exists', () => {
    const entries = [makeWeight('2026-11-10', 70.5), makeWeight('2026-11-13', 70)]
    const summary = getWeightWeekSummary(entries, dates)
    expect(summary.baseline).toBeNull()
    expect(summary.weeklyChangeKg).toBe(-0.5)
  })

  it('returns no change when only one weigh-in exists', () => {
    const summary = getWeightWeekSummary([makeWeight('2026-11-12', 71)], dates)
    expect(summary.weeklyChangeKg).toBeNull()
    expect(summary.latestOverall?.weightKg).toBe(71)
  })
})

describe('helpers', () => {
  it('scales food nutrition with a safe quantity', () => {
    const scaled = scaleFoodNutrition(
      { calories: 100, protein: 5, carbohydrates: 10, fat: 2 },
      1.5,
    )
    expect(scaled).toEqual({ calories: 150, protein: 7.5, carbohydrates: 15, fat: 3 })
  })

  it('previews whether a treat fits the remaining budget', () => {
    expect(previewTreat(1500, 200, 1800)).toEqual({
      projectedAfter: 1700,
      remainingAfter: 100,
      overBy: 0,
      fits: true,
    })
    expect(previewTreat(1700, 300, 1800)).toMatchObject({ remainingAfter: -200, overBy: 200, fits: false })
  })

  it('caps calorie progress at 100 percent', () => {
    expect(calorieProgressPercent(900, 1800)).toBe(50)
    expect(calorieProgressPercent(2000, 1800)).toBe(100)
    expect(calorieProgressPercent(100, 0)).toBe(0)
  })
})
