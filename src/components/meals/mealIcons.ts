import { Sunrise, Sun, Coffee, Moon, Cookie, type LucideIcon } from 'lucide-react'
import type { MealType } from '../../types'

export const MEAL_ICONS: Record<MealType, LucideIcon> = {
  breakfast: Sunrise,
  lunch: Sun,
  snacks: Coffee,
  dinner: Moon,
  treats: Cookie,
}

export const MEAL_ICON_STYLES: Record<MealType, string> = {
  breakfast: 'bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300',
  lunch: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  snacks: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  dinner: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300',
  treats: 'bg-pink-100 text-pink-600 dark:bg-pink-500/15 dark:text-pink-300',
}
