import Dexie from 'dexie'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { PlatewiseDatabase, db } from './database'
import { initializeDatabase, reseedDatabase } from './initialize'
import { STARTER_FOODS } from './seed'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

afterAll(async () => {
  await db.delete()
})

describe('database initialization', () => {
  it('seeds starter foods, default settings, and a seed flag once', async () => {
    await initializeDatabase()

    expect(await db.foodItems.count()).toBe(STARTER_FOODS.length)
    expect((await db.settings.get('app'))?.dailyCalorieTarget).toBe(1800)
    expect(await db.meta.get('seeded')).toBeTruthy()

    // An intentionally empty library must not silently re-seed on next launch.
    await db.foodItems.clear()
    await initializeDatabase()
    expect(await db.foodItems.count()).toBe(0)
  })

  it('reseeds starter data while clearing user records', async () => {
    await initializeDatabase()
    const now = new Date().toISOString()
    await db.mealEntries.add({
      date: '2026-11-09',
      mealType: 'lunch',
      foodItemId: null,
      foodNameSnapshot: 'Custom lunch',
      quantity: 1,
      servingDescriptionSnapshot: '1 plate',
      caloriesSnapshot: 500,
      proteinSnapshot: null,
      carbohydratesSnapshot: null,
      fatSnapshot: null,
      status: 'eaten',
      notes: '',
      createdAt: now,
      updatedAt: now,
    })
    await db.weightEntries.add({
      date: '2026-11-09',
      weightKg: 70,
      notes: '',
      createdAt: now,
      updatedAt: now,
    })

    await reseedDatabase()

    expect(await db.mealEntries.count()).toBe(0)
    expect(await db.weightEntries.count()).toBe(0)
    expect(await db.foodItems.count()).toBe(STARTER_FOODS.length)
    expect((await db.settings.get('app'))?.dailyCalorieTarget).toBe(1800)
  })

  it('enforces one weight entry per date', async () => {
    const now = new Date().toISOString()
    const base = { date: '2026-11-09', weightKg: 70, notes: '', createdAt: now, updatedAt: now }
    await db.weightEntries.add(base)
    await expect(db.weightEntries.add({ ...base, weightKg: 71 })).rejects.toThrow()
  })
})

describe('v1 to v2 migration', () => {
  it('keeps existing records and adds the new tables', async () => {
    const name = 'platewise-migration-test'
    const legacy = new Dexie(name)
    legacy.version(1).stores({
      foodItems: '++id, name, category, isFavourite, createdAt, updatedAt',
      mealEntries: '++id, date, mealType, status, foodItemId, createdAt',
      weightEntries: '++id, &date, createdAt',
      settings: 'id',
    })

    const now = '2026-11-09T08:00:00.000Z'
    await legacy.open()
    await legacy.table('foodItems').add({
      name: 'Legacy food',
      category: 'Other',
      calories: 100,
      protein: null,
      carbohydrates: null,
      fat: null,
      servingDescription: '1 serving',
      servingQuantity: 1,
      nutritionBasis: 'per_serving',
      isFavourite: false,
      notes: '',
      createdAt: now,
      updatedAt: now,
    })
    await legacy.table('mealEntries').add({
      date: '2026-11-09',
      mealType: 'lunch',
      foodItemId: null,
      foodNameSnapshot: 'Legacy food',
      quantity: 1,
      servingDescriptionSnapshot: '1 serving',
      caloriesSnapshot: 100,
      proteinSnapshot: null,
      carbohydratesSnapshot: null,
      fatSnapshot: null,
      status: 'eaten',
      notes: '',
      createdAt: now,
      updatedAt: now,
    })
    legacy.close()

    const upgraded = new PlatewiseDatabase(name)
    await upgraded.open()

    expect(await upgraded.foodItems.count()).toBe(1)
    expect(await upgraded.mealEntries.count()).toBe(1)
    expect(await upgraded.savedMeals.count()).toBe(0)
    expect(await upgraded.meta.count()).toBe(0)
    await upgraded.mealEntries.where('[date+mealType]').equals(['2026-11-09', 'lunch']).count()
    upgraded.close()
    await Dexie.delete(name)
  })
})
