import { db } from '../db/database'
import type { FoodItem, FoodItemInput } from '../types'
import { isoNow } from '../lib/dates'
import { assertValid, validateFoodInput } from '../lib/validation'

function normalizeFoodInput(input: FoodItemInput): FoodItemInput {
  return {
    ...input,
    name: input.name.trim(),
    category: input.category.trim(),
    servingDescription: input.servingDescription.trim(),
    notes: input.notes.trim(),
  }
}

export async function createFood(input: FoodItemInput): Promise<number> {
  const normalized = normalizeFoodInput(input)
  assertValid(validateFoodInput(normalized))
  const now = isoNow()
  return db.foodItems.add({
    ...normalized,
    createdAt: now,
    updatedAt: now,
  })
}

export async function updateFood(id: number, input: FoodItemInput): Promise<void> {
  const normalized = normalizeFoodInput(input)
  assertValid(validateFoodInput(normalized))
  const existing = await db.foodItems.get(id)
  if (!existing) throw new Error('That food no longer exists.')
  // Deliberately only updates the library item. Historical meal entries keep their snapshots.
  await db.foodItems.update(id, {
    ...normalized,
    updatedAt: isoNow(),
  })
}

export async function deleteFood(id: number): Promise<void> {
  await db.foodItems.delete(id)
}

export async function duplicateFood(id: number): Promise<number> {
  const food = await db.foodItems.get(id)
  if (!food) throw new Error('That food no longer exists.')
  const now = isoNow()
  return db.foodItems.add({
    ...food,
    id: undefined,
    name: `${food.name} (copy)`,
    isFavourite: false,
    createdAt: now,
    updatedAt: now,
  })
}

export async function toggleFavourite(id: number): Promise<void> {
  const food = await db.foodItems.get(id)
  if (!food) throw new Error('That food no longer exists.')
  await db.foodItems.update(id, {
    isFavourite: !food.isFavourite,
    updatedAt: isoNow(),
  })
}

export async function getFood(id: number): Promise<FoodItem | undefined> {
  return db.foodItems.get(id)
}
