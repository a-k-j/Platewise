import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../db/database'
import { initializeDatabase } from '../db/initialize'
import {
  clearAllData,
  exportBackup,
  importBackup,
  parseBackupText,
  validateBackupPayload,
} from './backupService'
import { createFood } from './foodService'
import { addFoodToMeal, saveMealAsCombination } from './mealService'
import { updateSettings } from './settingsService'
import { upsertWeightEntry } from './weightService'

beforeEach(async () => {
  await db.delete()
  await initializeDatabase()
})

async function seedUserData() {
  const foodId = await createFood({
    name: 'Test thali',
    category: 'Other',
    calories: 620,
    protein: 24,
    carbohydrates: 80,
    fat: 18,
    servingDescription: '1 thali',
    servingQuantity: 1,
    nutritionBasis: 'per_serving',
    isFavourite: true,
    notes: 'Test fixture',
  })
  await addFoodToMeal(foodId, {
    date: '2026-11-09',
    mealType: 'lunch',
    quantity: 1,
    status: 'eaten',
    notes: 'Lunch',
  })
  await saveMealAsCombination('2026-11-09', 'lunch', 'Test thali combo')
  await upsertWeightEntry({ date: '2026-11-09', weightKg: 68.4, notes: 'Morning' })
  await updateSettings({
    dailyCalorieTarget: 2100,
    proteinTarget: 90,
    weightUnit: 'lb',
    weekStartsOn: 0,
    theme: 'dark',
  })
  return foodId
}

describe('JSON backup export and restore', () => {
  it('round-trips all user data', async () => {
    await seedUserData()
    const payload = await exportBackup()

    expect(payload.app).toBe('platewise')
    expect(payload.version).toBe(1)
    expect(payload.data.foodItems).toHaveLength(34)
    expect(payload.data.mealEntries).toHaveLength(1)
    expect(payload.data.weightEntries).toHaveLength(1)
    expect(payload.data.savedMeals).toHaveLength(1)

    await clearAllData()
    expect(await db.mealEntries.count()).toBe(0)
    expect(await db.foodItems.count()).toBe(33)
    expect((await db.settings.get('app'))?.dailyCalorieTarget).toBe(1800)

    await importBackup(payload)
    expect(await db.foodItems.count()).toBe(34)
    expect(await db.mealEntries.count()).toBe(1)
    expect(await db.weightEntries.count()).toBe(1)
    expect(await db.savedMeals.count()).toBe(1)
    expect((await db.settings.get('app'))?.dailyCalorieTarget).toBe(2100)
    expect((await db.settings.get('app'))?.weekStartsOn).toBe(0)
  })

  it('validates text before importing', () => {
    expect(() => parseBackupText('not json')).toThrow('not valid JSON')
    expect(() => parseBackupText(JSON.stringify({ app: 'other', version: 1, data: {} }))).toThrow(
      'not a Platewise backup',
    )
  })

  it('rejects a backup with duplicate weight dates', async () => {
    await upsertWeightEntry({ date: '2026-11-09', weightKg: 68.4, notes: '' })
    const payload = await exportBackup()
    const duplicate = JSON.parse(JSON.stringify(payload)) as typeof payload
    duplicate.data.weightEntries = [
      { ...duplicate.data.weightEntries[0], id: 1 },
      { ...duplicate.data.weightEntries[0], id: 2 },
    ]

    expect(() => validateBackupPayload(duplicate)).toThrow('same date')
  })

  it('rejects a payload with a non-positive target', async () => {
    const payload = await exportBackup()
    const invalid = JSON.parse(JSON.stringify(payload)) as typeof payload
    invalid.data.settings[0].dailyCalorieTarget = 0
    expect(() => validateBackupPayload(invalid)).toThrow('greater than zero')
  })
})
