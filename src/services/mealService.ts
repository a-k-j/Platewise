import { db } from '../db/database'
import type {
  EntryStatus,
  FoodItem,
  FoodItemInput,
  MealEntry,
  MealType,
  SavedMeal,
  SavedMealItem,
} from '../types'
import { isoNow, isValidDateKey } from '../lib/dates'
import { assertValid, validateFoodInput, validateMealEntryDraft } from '../lib/validation'

export interface AddFoodOptions {
  date: string
  mealType: MealType
  quantity: number
  status: EntryStatus
  notes?: string
}

export interface CustomFoodOptions extends AddFoodOptions {
  saveToLibrary: boolean
}

function entryFromFood(food: FoodItem, options: AddFoodOptions): MealEntry {
  const now = isoNow()
  const entry: MealEntry = {
    date: options.date,
    mealType: options.mealType,
    foodItemId: food.id ?? null,
    foodNameSnapshot: food.name,
    quantity: options.quantity,
    servingDescriptionSnapshot: food.servingDescription,
    caloriesSnapshot: food.calories,
    proteinSnapshot: food.protein,
    carbohydratesSnapshot: food.carbohydrates,
    fatSnapshot: food.fat,
    status: options.status,
    notes: options.notes?.trim() ?? '',
    createdAt: now,
    updatedAt: now,
  }
  assertValid(
    validateMealEntryDraft({
      date: entry.date,
      mealType: entry.mealType,
      foodItemId: entry.foodItemId,
      foodName: entry.foodNameSnapshot,
      quantity: entry.quantity,
      servingDescription: entry.servingDescriptionSnapshot,
      calories: entry.caloriesSnapshot,
      protein: entry.proteinSnapshot,
      carbohydrates: entry.carbohydratesSnapshot,
      fat: entry.fatSnapshot,
      status: entry.status,
      notes: entry.notes,
    }),
  )
  return entry
}

function entryFromSavedItem(item: SavedMealItem, date: string, mealType: MealType, status: EntryStatus): MealEntry {
  const now = isoNow()
  return {
    date,
    mealType,
    foodItemId: item.foodItemId,
    foodNameSnapshot: item.foodNameSnapshot,
    quantity: item.quantity,
    servingDescriptionSnapshot: item.servingDescriptionSnapshot,
    caloriesSnapshot: item.caloriesSnapshot,
    proteinSnapshot: item.proteinSnapshot,
    carbohydratesSnapshot: item.carbohydratesSnapshot,
    fatSnapshot: item.fatSnapshot,
    status,
    notes: '',
    createdAt: now,
    updatedAt: now,
  }
}

export async function addFoodToMeal(foodId: number, options: AddFoodOptions): Promise<number> {
  if (!isValidDateKey(options.date)) throw new Error('Choose a valid date.')
  if (options.quantity <= 0) throw new Error('Quantity must be greater than zero.')
  return db.transaction('rw', db.foodItems, db.mealEntries, async () => {
    const food = await db.foodItems.get(foodId)
    if (!food) throw new Error('That food no longer exists.')
    const entry = entryFromFood(food, options)
    return db.mealEntries.add(entry)
  })
}

export async function addFoodSnapshotToMeal(food: FoodItem, options: AddFoodOptions): Promise<number> {
  const entry = entryFromFood(food, options)
  return db.mealEntries.add(entry)
}

export async function addCustomFoodToMeal(
  foodInput: FoodItemInput,
  options: CustomFoodOptions,
): Promise<{ entryId: number; foodId: number | null }> {
  assertValid(validateFoodInput(foodInput))
  if (!isValidDateKey(options.date)) throw new Error('Choose a valid date.')
  if (options.quantity <= 0) throw new Error('Quantity must be greater than zero.')

  return db.transaction('rw', db.foodItems, db.mealEntries, async () => {
    const now = isoNow()
    let foodId: number | null = null
    if (options.saveToLibrary) {
      foodId = await db.foodItems.add({
        ...foodInput,
        name: foodInput.name.trim(),
        category: foodInput.category.trim(),
        servingDescription: foodInput.servingDescription.trim(),
        notes: foodInput.notes.trim(),
        createdAt: now,
        updatedAt: now,
      })
    }

    const food: FoodItem = {
      ...foodInput,
      id: foodId ?? undefined,
      createdAt: now,
      updatedAt: now,
    }
    const entry = entryFromFood(food, options)
    const entryId = await db.mealEntries.add(entry)
    return { entryId, foodId }
  })
}

export interface MealEntryPatch {
  date?: string
  mealType?: MealType
  quantity?: number
  status?: EntryStatus
  notes?: string
}

export async function updateEntry(id: number, patch: MealEntryPatch): Promise<void> {
  const existing = await db.mealEntries.get(id)
  if (!existing) throw new Error('That meal entry no longer exists.')

  const merged: MealEntry = {
    ...existing,
    ...patch,
    notes: patch.notes !== undefined ? patch.notes.trim() : existing.notes,
    updatedAt: isoNow(),
  }

  assertValid(
    validateMealEntryDraft({
      date: merged.date,
      mealType: merged.mealType,
      foodItemId: merged.foodItemId,
      foodName: merged.foodNameSnapshot,
      quantity: merged.quantity,
      servingDescription: merged.servingDescriptionSnapshot,
      calories: merged.caloriesSnapshot,
      protein: merged.proteinSnapshot,
      carbohydrates: merged.carbohydratesSnapshot,
      fat: merged.fatSnapshot,
      status: merged.status,
      notes: merged.notes,
    }),
  )

  await db.mealEntries.update(id, {
    date: merged.date,
    mealType: merged.mealType,
    quantity: merged.quantity,
    status: merged.status,
    notes: merged.notes,
    updatedAt: merged.updatedAt,
  })
}

export async function updateEntryStatus(id: number, status: EntryStatus): Promise<void> {
  const existing = await db.mealEntries.get(id)
  if (!existing) throw new Error('That meal entry no longer exists.')
  if (existing.status === status) return
  await db.mealEntries.update(id, { status, updatedAt: isoNow() })
}

export async function updateEntryQuantity(id: number, quantity: number): Promise<void> {
  if (!Number.isFinite(quantity) || quantity <= 0) throw new Error('Quantity must be greater than zero.')
  const existing = await db.mealEntries.get(id)
  if (!existing) throw new Error('That meal entry no longer exists.')
  await db.mealEntries.update(id, { quantity, updatedAt: isoNow() })
}

export async function deleteEntry(id: number): Promise<void> {
  await db.mealEntries.delete(id)
}

export async function duplicateEntry(id: number): Promise<number> {
  const existing = await db.mealEntries.get(id)
  if (!existing) throw new Error('That meal entry no longer exists.')
  const now = isoNow()
  return db.mealEntries.add({
    ...existing,
    id: undefined,
    status: 'option',
    notes: existing.notes,
    createdAt: now,
    updatedAt: now,
  })
}

function copyEntry(
  entry: MealEntry,
  targetDate: string,
  targetMealType: MealType,
  eatenAsPlanned: boolean,
): MealEntry {
  const now = isoNow()
  return {
    ...entry,
    id: undefined,
    date: targetDate,
    mealType: targetMealType,
    status: entry.status === 'eaten' && eatenAsPlanned ? 'planned' : entry.status,
    createdAt: now,
    updatedAt: now,
  }
}

export async function copyMealToDate(
  sourceDate: string,
  sourceMealType: MealType,
  targetDate: string,
  targetMealType: MealType = sourceMealType,
): Promise<number> {
  if (!isValidDateKey(targetDate)) throw new Error('Choose a valid target date.')
  if (sourceDate === targetDate && sourceMealType === targetMealType) {
    throw new Error('Choose a different date or meal to copy into.')
  }
  return db.transaction('rw', db.mealEntries, async () => {
    const entries = await db.mealEntries.where('[date+mealType]').equals([sourceDate, sourceMealType]).toArray()
    if (entries.length === 0) throw new Error('There is nothing in that meal to copy.')
    const copies = entries.map((entry) => copyEntry(entry, targetDate, targetMealType, true))
    await db.mealEntries.bulkAdd(copies)
    return copies.length
  })
}

export async function copyDayToDate(sourceDate: string, targetDate: string): Promise<number> {
  if (!isValidDateKey(targetDate)) throw new Error('Choose a valid target date.')
  if (sourceDate === targetDate) throw new Error('Choose a different date to copy into.')
  return db.transaction('rw', db.mealEntries, async () => {
    const entries = await db.mealEntries.where('date').equals(sourceDate).toArray()
    if (entries.length === 0) throw new Error('There are no meals to copy on that date.')
    const copies = entries.map((entry) => copyEntry(entry, targetDate, entry.mealType, true))
    await db.mealEntries.bulkAdd(copies)
    return copies.length
  })
}

export async function copyEntriesToDate(
  entries: MealEntry[],
  targetDate: string,
  targetMealType: MealType,
): Promise<number> {
  if (entries.length === 0) throw new Error('There is nothing to copy.')
  if (!isValidDateKey(targetDate)) throw new Error('Choose a valid target date.')
  const copies = entries.map((entry) => copyEntry(entry, targetDate, targetMealType, true))
  await db.mealEntries.bulkAdd(copies)
  return copies.length
}

export async function saveMealAsCombination(
  date: string,
  mealType: MealType,
  name: string,
  description = '',
): Promise<number> {
  if (!name.trim()) throw new Error('Give this combination a name.')
  return db.transaction('rw', db.mealEntries, db.savedMeals, async () => {
    const entries = await db.mealEntries.where('[date+mealType]').equals([date, mealType]).toArray()
    if (entries.length === 0) throw new Error('Add some food before saving this meal.')
    const now = isoNow()
    const items: SavedMealItem[] = entries.map((entry) => ({
      foodItemId: entry.foodItemId,
      foodNameSnapshot: entry.foodNameSnapshot,
      quantity: entry.quantity,
      servingDescriptionSnapshot: entry.servingDescriptionSnapshot,
      caloriesSnapshot: entry.caloriesSnapshot,
      proteinSnapshot: entry.proteinSnapshot,
      carbohydratesSnapshot: entry.carbohydratesSnapshot,
      fatSnapshot: entry.fatSnapshot,
    }))
    return db.savedMeals.add({
      name: name.trim(),
      description: description.trim(),
      mealType,
      items,
      createdAt: now,
      updatedAt: now,
    })
  })
}

export async function addSavedMealToDate(
  savedMealId: number,
  date: string,
  mealType: MealType,
  status: EntryStatus = 'planned',
): Promise<number> {
  if (!isValidDateKey(date)) throw new Error('Choose a valid date.')
  return db.transaction('rw', db.savedMeals, db.mealEntries, async () => {
    const savedMeal = await db.savedMeals.get(savedMealId)
    if (!savedMeal) throw new Error('That saved meal no longer exists.')
    const entries = savedMeal.items.map((item) => entryFromSavedItem(item, date, mealType, status))
    await db.mealEntries.bulkAdd(entries)
    return entries.length
  })
}

export async function deleteSavedMeal(id: number): Promise<void> {
  await db.savedMeals.delete(id)
}

export async function getSavedMeals(): Promise<SavedMeal[]> {
  return db.savedMeals.orderBy('createdAt').reverse().toArray()
}

export async function deleteDayEntries(date: string): Promise<void> {
  await db.mealEntries.where('date').equals(date).delete()
}
