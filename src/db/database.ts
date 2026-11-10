import Dexie, { type Table } from 'dexie'
import type {
  AppMeta,
  AppSettings,
  FoodItem,
  MealEntry,
  SavedMeal,
  WeightEntry,
} from '../types'

export class PlatewiseDatabase extends Dexie {
  foodItems!: Table<FoodItem, number>
  mealEntries!: Table<MealEntry, number>
  weightEntries!: Table<WeightEntry, number>
  settings!: Table<AppSettings, string>
  savedMeals!: Table<SavedMeal, number>
  meta!: Table<AppMeta, string>

  constructor(name = 'platewise-db') {
    super(name)

    this.version(1).stores({
      foodItems: '++id, name, category, isFavourite, createdAt, updatedAt',
      mealEntries: '++id, date, mealType, status, foodItemId, createdAt',
      weightEntries: '++id, &date, createdAt',
      settings: 'id',
    })

    // v2 adds reusable meal combinations, app metadata, and compound date/meal indexes.
    // Non-destructive: all v1 tables and records are preserved.
    this.version(2).stores({
      foodItems: '++id, name, category, isFavourite, createdAt, updatedAt',
      mealEntries: '++id, date, mealType, status, foodItemId, [date+mealType], createdAt, updatedAt',
      weightEntries: '++id, &date, createdAt, updatedAt',
      settings: 'id',
      savedMeals: '++id, name, mealType, createdAt, updatedAt',
      meta: 'key',
    })
  }
}

export const db = new PlatewiseDatabase()
