import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import type { SavedMeal } from '../types'

export function useSavedMeals(): { savedMeals: SavedMeal[]; isLoading: boolean } {
  const savedMeals = useLiveQuery(() => db.savedMeals.orderBy('createdAt').reverse().toArray(), [])
  return {
    savedMeals: savedMeals ?? [],
    isLoading: savedMeals === undefined,
  }
}
