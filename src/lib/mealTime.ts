import type { MealType } from '../types'

export function inferMealForNow(now: Date = new Date()): MealType {
  const hour = now.getHours()
  if (hour < 11) return 'breakfast'
  if (hour < 15) return 'lunch'
  if (hour < 18) return 'snacks'
  if (hour < 21) return 'dinner'
  return 'treats'
}
