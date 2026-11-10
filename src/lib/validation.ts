import type {
  EntryStatus,
  FoodItemInput,
  MealEntryDraft,
  MealType,
  NutritionBasis,
  SettingsInput,
  WeightEntryDraft,
} from '../types'
import { isValidDateKey } from './dates'

export type ValidationErrors = Record<string, string>

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

export function isNonNegative(value: unknown): value is number {
  return isFiniteNumber(value) && value >= 0
}

export function isPositive(value: unknown): value is number {
  return isFiniteNumber(value) && value > 0
}

export function validateFoodInput(input: FoodItemInput): ValidationErrors {
  const errors: ValidationErrors = {}
  if (!input.name.trim()) errors.name = 'Give this food a name.'
  if (input.name.trim().length > 100) errors.name = 'Keep the name under 100 characters.'
  if (!input.category.trim()) errors.category = 'Choose a category.'
  if (!isNonNegative(input.calories)) errors.calories = 'Calories must be zero or more.'
  if (input.calories > 10000) errors.calories = 'That calorie value looks too high.'
  if (input.protein != null && !isNonNegative(input.protein)) errors.protein = 'Protein must be zero or more.'
  if (input.carbohydrates != null && !isNonNegative(input.carbohydrates)) {
    errors.carbohydrates = 'Carbohydrates must be zero or more.'
  }
  if (input.fat != null && !isNonNegative(input.fat)) errors.fat = 'Fat must be zero or more.'
  if (!input.servingDescription.trim()) errors.servingDescription = 'Describe one serving.'
  if (!isPositive(input.servingQuantity)) errors.servingQuantity = 'Serving size must be greater than zero.'
  if (!['per_serving', 'per_100g'].includes(input.nutritionBasis)) {
    errors.nutritionBasis = 'Choose a nutrition basis.'
  }
  return errors
}

export function validateMealEntryDraft(input: MealEntryDraft): ValidationErrors {
  const errors: ValidationErrors = {}
  if (!isValidDateKey(input.date)) errors.date = 'Choose a valid date.'
  if (!['breakfast', 'lunch', 'snacks', 'dinner', 'treats'].includes(input.mealType)) {
    errors.mealType = 'Choose a meal.'
  }
  if (!input.foodName.trim()) errors.foodName = 'Food name cannot be empty.'
  if (!isPositive(input.quantity)) errors.quantity = 'Quantity must be greater than zero.'
  if (input.quantity > 100) errors.quantity = 'Quantity looks too large.'
  if (!isNonNegative(input.calories)) errors.calories = 'Calories must be zero or more.'
  if (!input.servingDescription.trim()) errors.servingDescription = 'Add a serving description.'
  if (input.protein != null && !isNonNegative(input.protein)) errors.protein = 'Protein must be zero or more.'
  if (input.carbohydrates != null && !isNonNegative(input.carbohydrates)) {
    errors.carbohydrates = 'Carbohydrates must be zero or more.'
  }
  if (input.fat != null && !isNonNegative(input.fat)) errors.fat = 'Fat must be zero or more.'
  if (!['option', 'planned', 'eaten', 'skipped'].includes(input.status)) errors.status = 'Choose a status.'
  return errors
}

export function validateWeightDraft(input: WeightEntryDraft): ValidationErrors {
  const errors: ValidationErrors = {}
  if (!isValidDateKey(input.date)) errors.date = 'Choose a valid date.'
  if (!isPositive(input.weightKg)) errors.weightKg = 'Enter a weight greater than zero.'
  if (input.weightKg > 1000) errors.weightKg = 'That weight looks too high.'
  return errors
}

export function validateSettingsInput(input: SettingsInput): ValidationErrors {
  const errors: ValidationErrors = {}
  if (!isPositive(input.dailyCalorieTarget)) {
    errors.dailyCalorieTarget = 'Daily target must be greater than zero.'
  }
  if (input.dailyCalorieTarget > 20000) errors.dailyCalorieTarget = 'That daily target looks too high.'
  if (input.proteinTarget != null && !isNonNegative(input.proteinTarget)) {
    errors.proteinTarget = 'Protein target must be zero or more.'
  }
  if (!['kg', 'lb'].includes(input.weightUnit)) errors.weightUnit = 'Choose a weight unit.'
  if (!Number.isInteger(input.weekStartsOn) || input.weekStartsOn < 0 || input.weekStartsOn > 6) {
    errors.weekStartsOn = 'Choose a valid week start day.'
  }
  if (!['light', 'dark', 'system'].includes(input.theme)) errors.theme = 'Choose a theme.'
  return errors
}

export function assertValid(errors: ValidationErrors): void {
  const first = Object.values(errors)[0]
  if (first) throw new Error(first)
}

export function hasErrors(errors: ValidationErrors): boolean {
  return Object.keys(errors).length > 0
}

export function isMealType(value: unknown): value is MealType {
  return typeof value === 'string' && ['breakfast', 'lunch', 'snacks', 'dinner', 'treats'].includes(value)
}

export function isEntryStatus(value: unknown): value is EntryStatus {
  return typeof value === 'string' && ['option', 'planned', 'eaten', 'skipped'].includes(value)
}

export function isNutritionBasis(value: unknown): value is NutritionBasis {
  return value === 'per_serving' || value === 'per_100g'
}
