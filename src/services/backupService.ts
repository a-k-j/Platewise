import { db } from '../db/database'
import { reseedDatabase } from '../db/initialize'
import { createDefaultSettings } from '../db/seed'
import type {
  AppMeta,
  AppSettings,
  BackupPayload,
  FoodItem,
  MealEntry,
  SavedMeal,
  SavedMealItem,
  WeightEntry,
} from '../types'
import { isoNow, isValidDateKey, todayKey } from '../lib/dates'
import { isEntryStatus, isMealType, isNutritionBasis } from '../lib/validation'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (!isRecord(value)) throw new Error(`${label} is not a valid object.`)
  return value
}

function asArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`${label} must be a list.`)
  return value
}

function asString(value: unknown, label: string, allowEmpty = false): string {
  if (typeof value !== 'string') throw new Error(`${label} must be text.`)
  if (!allowEmpty && !value.trim()) throw new Error(`${label} cannot be empty.`)
  return value
}

function asNumber(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`${label} must be a number.`)
  return value
}

function asNonNegative(value: unknown, label: string): number {
  const number = asNumber(value, label)
  if (number < 0) throw new Error(`${label} cannot be negative.`)
  return number
}

function asPositive(value: unknown, label: string): number {
  const number = asNumber(value, label)
  if (number <= 0) throw new Error(`${label} must be greater than zero.`)
  return number
}

function asNullableNumber(value: unknown, label: string): number | null {
  if (value == null) return null
  return asNonNegative(value, label)
}

function asId(value: unknown, label: string): number {
  const number = asNumber(value, label)
  if (!Number.isInteger(number) || number <= 0) throw new Error(`${label} is not a valid record id.`)
  return number
}

function asTimestamp(value: unknown, label: string): string {
  const text = asString(value, label)
  if (Number.isNaN(new Date(text).getTime())) throw new Error(`${label} is not a valid timestamp.`)
  return text
}

function assertUnique(values: number[], label: string): void {
  if (new Set(values).size !== values.length) throw new Error(`${label} contains duplicate ids.`)
}

function validateFoodItem(raw: unknown, index: number): FoodItem {
  const item = asRecord(raw, `Food item ${index + 1}`)
  if (!isNutritionBasis(item.nutritionBasis)) {
    throw new Error(`Food item ${index + 1} has an invalid nutrition basis.`)
  }
  return {
    id: asId(item.id, `Food item ${index + 1} id`),
    name: asString(item.name, `Food item ${index + 1} name`),
    category: asString(item.category, `Food item ${index + 1} category`),
    calories: asNonNegative(item.calories, `Food item ${index + 1} calories`),
    protein: asNullableNumber(item.protein, `Food item ${index + 1} protein`),
    carbohydrates: asNullableNumber(item.carbohydrates, `Food item ${index + 1} carbohydrates`),
    fat: asNullableNumber(item.fat, `Food item ${index + 1} fat`),
    fibre: asNullableNumber(item.fibre, `Food item ${index + 1} fibre`),
    servingDescription: asString(item.servingDescription, `Food item ${index + 1} serving description`),
    servingQuantity: asPositive(item.servingQuantity, `Food item ${index + 1} serving quantity`),
    nutritionBasis: item.nutritionBasis,
    isFavourite: Boolean(item.isFavourite),
    notes: asString(item.notes, `Food item ${index + 1} notes`, true),
    createdAt: asTimestamp(item.createdAt, `Food item ${index + 1} created date`),
    updatedAt: asTimestamp(item.updatedAt, `Food item ${index + 1} updated date`),
  }
}

function validateMealEntry(raw: unknown, index: number): MealEntry {
  const item = asRecord(raw, `Meal entry ${index + 1}`)
  const date = asString(item.date, `Meal entry ${index + 1} date`)
  if (!isValidDateKey(date)) throw new Error(`Meal entry ${index + 1} has an invalid date.`)
  if (!isMealType(item.mealType)) throw new Error(`Meal entry ${index + 1} has an invalid meal type.`)
  if (!isEntryStatus(item.status)) throw new Error(`Meal entry ${index + 1} has an invalid status.`)
  return {
    id: asId(item.id, `Meal entry ${index + 1} id`),
    date,
    mealType: item.mealType,
    foodItemId: item.foodItemId == null ? null : asId(item.foodItemId, `Meal entry ${index + 1} food id`),
    foodNameSnapshot: asString(item.foodNameSnapshot, `Meal entry ${index + 1} food name`),
    quantity: asPositive(item.quantity, `Meal entry ${index + 1} quantity`),
    servingDescriptionSnapshot: asString(
      item.servingDescriptionSnapshot,
      `Meal entry ${index + 1} serving description`,
    ),
    caloriesSnapshot: asNonNegative(item.caloriesSnapshot, `Meal entry ${index + 1} calories`),
    proteinSnapshot: asNullableNumber(item.proteinSnapshot, `Meal entry ${index + 1} protein`),
    carbohydratesSnapshot: asNullableNumber(
      item.carbohydratesSnapshot,
      `Meal entry ${index + 1} carbohydrates`,
    ),
    fatSnapshot: asNullableNumber(item.fatSnapshot, `Meal entry ${index + 1} fat`),
    fibreSnapshot: asNullableNumber(item.fibreSnapshot, `Meal entry ${index + 1} fibre`),
    status: item.status,
    notes: asString(item.notes, `Meal entry ${index + 1} notes`, true),
    createdAt: asTimestamp(item.createdAt, `Meal entry ${index + 1} created date`),
    updatedAt: asTimestamp(item.updatedAt, `Meal entry ${index + 1} updated date`),
  }
}

function validateWeightEntry(raw: unknown, index: number): WeightEntry {
  const item = asRecord(raw, `Weight entry ${index + 1}`)
  const date = asString(item.date, `Weight entry ${index + 1} date`)
  if (!isValidDateKey(date)) throw new Error(`Weight entry ${index + 1} has an invalid date.`)
  return {
    id: asId(item.id, `Weight entry ${index + 1} id`),
    date,
    weightKg: asPositive(item.weightKg, `Weight entry ${index + 1} weight`),
    notes: asString(item.notes, `Weight entry ${index + 1} notes`, true),
    createdAt: asTimestamp(item.createdAt, `Weight entry ${index + 1} created date`),
    updatedAt: asTimestamp(item.updatedAt, `Weight entry ${index + 1} updated date`),
  }
}

function validateSavedMealItem(raw: unknown, mealIndex: number, itemIndex: number): SavedMealItem {
  const item = asRecord(raw, `Saved meal ${mealIndex + 1} item ${itemIndex + 1}`)
  return {
    foodItemId:
      item.foodItemId == null
        ? null
        : asId(item.foodItemId, `Saved meal ${mealIndex + 1} item ${itemIndex + 1} food id`),
    foodNameSnapshot: asString(
      item.foodNameSnapshot,
      `Saved meal ${mealIndex + 1} item ${itemIndex + 1} name`,
    ),
    quantity: asPositive(item.quantity, `Saved meal ${mealIndex + 1} item ${itemIndex + 1} quantity`),
    servingDescriptionSnapshot: asString(
      item.servingDescriptionSnapshot,
      `Saved meal ${mealIndex + 1} item ${itemIndex + 1} serving description`,
    ),
    caloriesSnapshot: asNonNegative(
      item.caloriesSnapshot,
      `Saved meal ${mealIndex + 1} item ${itemIndex + 1} calories`,
    ),
    proteinSnapshot: asNullableNumber(
      item.proteinSnapshot,
      `Saved meal ${mealIndex + 1} item ${itemIndex + 1} protein`,
    ),
    carbohydratesSnapshot: asNullableNumber(
      item.carbohydratesSnapshot,
      `Saved meal ${mealIndex + 1} item ${itemIndex + 1} carbohydrates`,
    ),
    fatSnapshot: asNullableNumber(item.fatSnapshot, `Saved meal ${mealIndex + 1} item ${itemIndex + 1} fat`),
    fibreSnapshot: asNullableNumber(
      item.fibreSnapshot,
      `Saved meal ${mealIndex + 1} item ${itemIndex + 1} fibre`,
    ),
  }
}

function validateSavedMeal(raw: unknown, index: number): SavedMeal {
  const item = asRecord(raw, `Saved meal ${index + 1}`)
  if (!isMealType(item.mealType)) throw new Error(`Saved meal ${index + 1} has an invalid meal type.`)
  const items = asArray(item.items, `Saved meal ${index + 1} items`).map((entry, itemIndex) =>
    validateSavedMealItem(entry, index, itemIndex),
  )
  if (items.length === 0) throw new Error(`Saved meal ${index + 1} has no items.`)
  return {
    id: asId(item.id, `Saved meal ${index + 1} id`),
    name: asString(item.name, `Saved meal ${index + 1} name`),
    description: asString(item.description, `Saved meal ${index + 1} description`, true),
    mealType: item.mealType,
    items,
    createdAt: asTimestamp(item.createdAt, `Saved meal ${index + 1} created date`),
    updatedAt: asTimestamp(item.updatedAt, `Saved meal ${index + 1} updated date`),
  }
}

function validateSettings(raw: unknown): AppSettings {
  const item = asRecord(raw, 'Settings')
  if (item.id !== 'app') throw new Error('Settings record is missing its app id.')
  if (!['light', 'dark', 'system'].includes(String(item.theme))) throw new Error('Settings have an invalid theme.')
  const weekStartsOn = asNumber(item.weekStartsOn, 'Settings week start')
  if (!Number.isInteger(weekStartsOn) || weekStartsOn < 0 || weekStartsOn > 6) {
    throw new Error('Settings have an invalid week start day.')
  }
  return {
    id: 'app',
    dailyCalorieTarget: asPositive(item.dailyCalorieTarget, 'Settings daily target'),
    proteinTarget: asNullableNumber(item.proteinTarget, 'Settings protein target'),
    weekStartsOn,
    theme: item.theme as AppSettings['theme'],
    updatedAt: asTimestamp(item.updatedAt, 'Settings updated date'),
  }
}

function validateMeta(raw: unknown, index: number): AppMeta {
  const item = asRecord(raw, `Metadata record ${index + 1}`)
  return {
    key: asString(item.key, `Metadata record ${index + 1} key`),
    value: asString(item.value, `Metadata record ${index + 1} value`, true),
  }
}

export function validateBackupPayload(raw: unknown): BackupPayload {
  const root = asRecord(raw, 'Backup')
  if (root.app !== 'platewise') throw new Error('This file is not a Platewise backup.')
  if (root.version !== 1) throw new Error('This backup version is not supported.')
  const data = asRecord(root.data, 'Backup data')

  const foodItems = asArray(data.foodItems, 'Food items').map(validateFoodItem)
  const mealEntries = asArray(data.mealEntries, 'Meal entries').map(validateMealEntry)
  const weightEntries = asArray(data.weightEntries, 'Weight entries').map(validateWeightEntry)
  const settings = asArray(data.settings, 'Settings').map(validateSettings)
  const savedMeals = asArray(data.savedMeals, 'Saved meals').map(validateSavedMeal)
  const meta = asArray(data.meta, 'Metadata').map(validateMeta)

  assertUnique(
    foodItems.map((item) => item.id as number),
    'Food items',
  )
  assertUnique(
    mealEntries.map((item) => item.id as number),
    'Meal entries',
  )
  assertUnique(
    weightEntries.map((item) => item.id as number),
    'Weight entries',
  )
  assertUnique(
    savedMeals.map((item) => item.id as number),
    'Saved meals',
  )
  const weightDates = weightEntries.map((entry) => entry.date)
  if (new Set(weightDates).size !== weightDates.length) {
    throw new Error('The backup contains two weight entries for the same date.')
  }

  return {
    app: 'platewise',
    version: 1,
    exportedAt: typeof root.exportedAt === 'string' ? root.exportedAt : isoNow(),
    data: { foodItems, mealEntries, weightEntries, settings, savedMeals, meta },
  }
}

export function parseBackupText(text: string): BackupPayload {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('That file is not valid JSON.')
  }
  return validateBackupPayload(parsed)
}

export async function exportBackup(): Promise<BackupPayload> {
  return db.transaction(
    'r',
    [db.foodItems, db.mealEntries, db.weightEntries, db.settings, db.savedMeals, db.meta],
    async () => {
      const [foodItems, mealEntries, weightEntries, settings, savedMeals, meta] = await Promise.all([
        db.foodItems.toArray(),
        db.mealEntries.toArray(),
        db.weightEntries.toArray(),
        db.settings.toArray(),
        db.savedMeals.toArray(),
        db.meta.toArray(),
      ])
      return {
        app: 'platewise' as const,
        version: 1 as const,
        exportedAt: isoNow(),
        data: { foodItems, mealEntries, weightEntries, settings, savedMeals, meta },
      }
    },
  )
}

export async function importBackup(payload: BackupPayload): Promise<void> {
  const validated = validateBackupPayload(payload)
  await db.transaction(
    'rw',
    [db.foodItems, db.mealEntries, db.weightEntries, db.settings, db.savedMeals, db.meta],
    async () => {
      await Promise.all([
        db.mealEntries.clear(),
        db.weightEntries.clear(),
        db.savedMeals.clear(),
        db.foodItems.clear(),
        db.settings.clear(),
        db.meta.clear(),
      ])

      if (validated.data.foodItems.length) await db.foodItems.bulkAdd(validated.data.foodItems)
      if (validated.data.mealEntries.length) await db.mealEntries.bulkAdd(validated.data.mealEntries)
      if (validated.data.weightEntries.length) await db.weightEntries.bulkAdd(validated.data.weightEntries)
      if (validated.data.savedMeals.length) await db.savedMeals.bulkAdd(validated.data.savedMeals)
      if (validated.data.settings.length) {
        await db.settings.bulkAdd(validated.data.settings)
      } else {
        await db.settings.put(createDefaultSettings())
      }
      if (validated.data.meta.length) {
        await db.meta.bulkAdd(validated.data.meta)
      }
      if (!(await db.meta.get('seeded'))) {
        await db.meta.put({ key: 'seeded', value: isoNow() })
      }
    },
  )
}

export async function clearAllData(): Promise<void> {
  await reseedDatabase()
}

export function buildBackupFilename(): string {
  return `platewise-backup-${todayKey()}.json`
}

export function buildCsvFilename(): string {
  return `platewise-week-${todayKey()}.csv`
}
