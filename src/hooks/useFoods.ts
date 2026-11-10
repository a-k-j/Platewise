import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import type { FoodItem } from '../types'

export function useFoodItems(): { foods: FoodItem[]; isLoading: boolean } {
  const foods = useLiveQuery(() => db.foodItems.toArray(), [])
  return {
    foods: foods
      ? [...foods].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
      : [],
    isLoading: foods === undefined,
  }
}

export function useRecentFoods(limit = 150): { foods: FoodItem[]; isLoading: boolean } {
  const foods = useLiveQuery(async () => {
    const [entries, allFoods] = await Promise.all([
      db.mealEntries.orderBy('createdAt').reverse().limit(limit).toArray(),
      db.foodItems.toArray(),
    ])
    const foodMap = new Map(allFoods.map((food) => [food.id, food]))
    const seen = new Set<number>()
    const recent: FoodItem[] = []
    for (const entry of entries) {
      if (entry.foodItemId == null || seen.has(entry.foodItemId)) continue
      const food = foodMap.get(entry.foodItemId)
      if (!food) continue
      seen.add(entry.foodItemId)
      recent.push(food)
    }
    return recent
  }, [limit])
  return {
    foods: foods ?? [],
    isLoading: foods === undefined,
  }
}
