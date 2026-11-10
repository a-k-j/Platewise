import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../db/database'
import { initializeDatabase } from '../db/initialize'
import {
  addFoodToMeal,
  addSavedMealToDate,
  copyDayToDate,
  copyMealToDate,
  deleteSavedMeal,
  duplicateEntry,
  saveMealAsCombination,
  updateEntryStatus,
} from './mealService'
import { updateFood } from './foodService'

beforeEach(async () => {
  await db.delete()
  await initializeDatabase()
})

async function starterFood(name = 'Roti') {
  const food = await db.foodItems.where('name').equals(name).first()
  if (!food?.id) throw new Error('Starter food missing')
  return food
}

describe('meal entry copying', () => {
  it('copies a day and converts eaten entries to planned', async () => {
    const food = await starterFood()
    await addFoodToMeal(food.id as number, {
      date: '2026-11-09',
      mealType: 'lunch',
      quantity: 2,
      status: 'eaten',
    })

    const copied = await copyDayToDate('2026-11-09', '2026-11-10')
    expect(copied).toBe(1)

    const target = await db.mealEntries.where('date').equals('2026-11-10').first()
    expect(target?.status).toBe('planned')
    expect(target?.quantity).toBe(2)
    expect(target?.caloriesSnapshot).toBe(food.calories)
    expect(target?.foodNameSnapshot).toBe(food.name)
  })

  it('copies a single meal into another meal and keeps planned entries planned', async () => {
    const food = await starterFood()
    await addFoodToMeal(food.id as number, {
      date: '2026-11-09',
      mealType: 'breakfast',
      quantity: 1,
      status: 'planned',
    })

    const copied = await copyMealToDate('2026-11-09', 'breakfast', '2026-11-10', 'lunch')
    expect(copied).toBe(1)
    const target = await db.mealEntries.where('date').equals('2026-11-10').first()
    expect(target?.mealType).toBe('lunch')
    expect(target?.status).toBe('planned')
  })

  it('refuses to copy a day onto itself', async () => {
    const food = await starterFood()
    await addFoodToMeal(food.id as number, {
      date: '2026-11-09',
      mealType: 'lunch',
      quantity: 1,
      status: 'eaten',
    })
    await expect(copyDayToDate('2026-11-09', '2026-11-09')).rejects.toThrow('different date')
  })
})

describe('entry duplication and status', () => {
  it('duplicates an entry as an option', async () => {
    const food = await starterFood()
    const id = await addFoodToMeal(food.id as number, {
      date: '2026-11-09',
      mealType: 'snacks',
      quantity: 1,
      status: 'eaten',
    })

    const duplicateId = await duplicateEntry(id)
    const duplicate = await db.mealEntries.get(duplicateId)
    expect(duplicate?.status).toBe('option')
    expect(duplicate?.foodNameSnapshot).toBe(food.name)
    expect(duplicateId).not.toBe(id)
  })

  it('changes status without touching nutrition snapshots', async () => {
    const food = await starterFood()
    const id = await addFoodToMeal(food.id as number, {
      date: '2026-11-09',
      mealType: 'dinner',
      quantity: 1,
      status: 'option',
    })

    await updateEntryStatus(id, 'eaten')
    const entry = await db.mealEntries.get(id)
    expect(entry?.status).toBe('eaten')
    expect(entry?.caloriesSnapshot).toBe(food.calories)
  })
})

describe('food snapshot isolation', () => {
  it('does not change historical meal entries when a food is edited', async () => {
    const food = await starterFood()
    const id = await addFoodToMeal(food.id as number, {
      date: '2026-11-09',
      mealType: 'lunch',
      quantity: 1,
      status: 'eaten',
    })

    await updateFood(food.id as number, {
      name: food.name,
      category: food.category,
      calories: food.calories + 500,
      protein: food.protein,
      carbohydrates: food.carbohydrates,
      fat: food.fat,
      servingDescription: food.servingDescription,
      servingQuantity: food.servingQuantity,
      nutritionBasis: food.nutritionBasis,
      isFavourite: food.isFavourite,
      notes: food.notes,
    })

    const entry = await db.mealEntries.get(id)
    expect(entry?.caloriesSnapshot).toBe(food.calories)
    expect((await db.foodItems.get(food.id as number))?.calories).toBe(food.calories + 500)
  })
})

describe('saved meal combinations', () => {
  it('saves a meal and adds it to another date', async () => {
    const food = await starterFood()
    await addFoodToMeal(food.id as number, {
      date: '2026-11-09',
      mealType: 'lunch',
      quantity: 1,
      status: 'eaten',
    })

    const savedId = await saveMealAsCombination('2026-11-09', 'lunch', 'Weekday lunch')
    const added = await addSavedMealToDate(savedId, '2026-11-11', 'lunch', 'planned')
    expect(added).toBe(1)

    const entry = await db.mealEntries.where('date').equals('2026-11-11').first()
    expect(entry?.status).toBe('planned')
    expect(entry?.foodNameSnapshot).toBe(food.name)

    await deleteSavedMeal(savedId)
    expect(await db.savedMeals.get(savedId)).toBeUndefined()
  })

  it('rejects an empty meal combination', async () => {
    await expect(saveMealAsCombination('2026-11-09', 'dinner', 'Empty')).rejects.toThrow('Add some food')
  })
})
