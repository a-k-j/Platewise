export type MealType = 'breakfast' | 'lunch' | 'snacks' | 'dinner' | 'treats'

export type EntryStatus = 'option' | 'planned' | 'eaten' | 'skipped'

export type NutritionBasis = 'per_serving' | 'per_100g'

export type ThemePreference = 'light' | 'dark' | 'system'

export interface FoodItem {
  id?: number
  name: string
  category: string
  calories: number
  protein: number | null
  carbohydrates: number | null
  fat: number | null
  fibre: number | null
  servingDescription: string
  servingQuantity: number
  nutritionBasis: NutritionBasis
  isFavourite: boolean
  notes: string
  createdAt: string
  updatedAt: string
}

export interface MealEntry {
  id?: number
  date: string
  mealType: MealType
  foodItemId: number | null
  foodNameSnapshot: string
  quantity: number
  servingDescriptionSnapshot: string
  caloriesSnapshot: number
  proteinSnapshot: number | null
  carbohydratesSnapshot: number | null
  fatSnapshot: number | null
  fibreSnapshot: number | null
  status: EntryStatus
  notes: string
  createdAt: string
  updatedAt: string
}

export interface WeightEntry {
  id?: number
  date: string
  weightKg: number
  notes: string
  createdAt: string
  updatedAt: string
}

export interface AppSettings {
  id: 'app'
  dailyCalorieTarget: number
  proteinTarget: number | null
  weekStartsOn: number
  theme: ThemePreference
  updatedAt: string
}

export interface SavedMealItem {
  foodItemId: number | null
  foodNameSnapshot: string
  quantity: number
  servingDescriptionSnapshot: string
  caloriesSnapshot: number
  proteinSnapshot: number | null
  carbohydratesSnapshot: number | null
  fatSnapshot: number | null
  fibreSnapshot: number | null
}

export interface SavedMeal {
  id?: number
  name: string
  description: string
  mealType: MealType
  items: SavedMealItem[]
  createdAt: string
  updatedAt: string
}

export interface AppMeta {
  key: string
  value: string
}

export interface FoodItemInput {
  name: string
  category: string
  calories: number
  protein: number | null
  carbohydrates: number | null
  fat: number | null
  fibre: number | null
  servingDescription: string
  servingQuantity: number
  nutritionBasis: NutritionBasis
  isFavourite: boolean
  notes: string
}

export interface MealEntryDraft {
  date: string
  mealType: MealType
  foodItemId: number | null
  foodName: string
  quantity: number
  servingDescription: string
  calories: number
  protein: number | null
  carbohydrates: number | null
  fat: number | null
  fibre: number | null
  status: EntryStatus
  notes: string
}

export interface WeightEntryDraft {
  date: string
  weightKg: number
  notes: string
}

export interface SettingsInput {
  dailyCalorieTarget: number
  proteinTarget: number | null
  weekStartsOn: number
  theme: ThemePreference
}

export interface MealTypeMeta {
  value: MealType
  label: string
  shortLabel: string
  emoji: string
}

export const MEAL_TYPES: MealTypeMeta[] = [
  { value: 'breakfast', label: 'Breakfast', shortLabel: 'Breakfast', emoji: '🌅' },
  { value: 'lunch', label: 'Lunch', shortLabel: 'Lunch', emoji: '☀️' },
  { value: 'snacks', label: 'Evening Snacks', shortLabel: 'Snacks', emoji: '🫖' },
  { value: 'dinner', label: 'Dinner', shortLabel: 'Dinner', emoji: '🌙' },
  { value: 'treats', label: 'Other Snacks / Treats', shortLabel: 'Treats', emoji: '🍫' },
]

export const MEAL_TYPE_MAP: Record<MealType, MealTypeMeta> = Object.fromEntries(
  MEAL_TYPES.map((meal) => [meal.value, meal]),
) as Record<MealType, MealTypeMeta>

export interface StatusMeta {
  value: EntryStatus
  label: string
  description: string
}

export const ENTRY_STATUSES: StatusMeta[] = [
  { value: 'option', label: 'Option', description: 'Considering it — not counted yet' },
  { value: 'planned', label: 'Planned', description: 'Will eat — counts toward projected' },
  { value: 'eaten', label: 'Eaten', description: 'Already eaten — counts toward consumed' },
  { value: 'skipped', label: 'Skipped', description: 'Decided not to eat — not counted' },
]

export const STATUS_MAP: Record<EntryStatus, StatusMeta> = Object.fromEntries(
  ENTRY_STATUSES.map((status) => [status.value, status]),
) as Record<EntryStatus, StatusMeta>

export const FOOD_CATEGORIES = [
  'Breads',
  'Rice & grains',
  'Dal & legumes',
  'Vegetables & paneer',
  'Breakfast',
  'Dairy',
  'Fruits',
  'Nuts & seeds',
  'Snacks & treats',
  'Protein',
  'Beverages',
  'Other',
] as const

export interface CalorieSummary {
  target: number
  consumed: number
  planned: number
  projected: number
  remainingAfterConsumed: number
  remainingAfterPlanned: number
  overConsumedBy: number
  overProjectedBy: number
  optionCalories: number
  skippedCalories: number
  eatenCount: number
  plannedCount: number
  optionCount: number
  skippedCount: number
}

export interface DayTotals {
  consumed: number
  planned: number
  projected: number
  entryCount: number
  tracked: boolean
}

export interface WeekDaySummary extends DayTotals {
  date: string
  withinTarget: boolean
}

export interface WeekStats {
  days: WeekDaySummary[]
  totalConsumed: number
  averageConsumed: number | null
  trackedDays: number
  daysWithinTarget: number
  highest: WeekDaySummary | null
  lowest: WeekDaySummary | null
}

export interface WeightWeekSummary {
  weekEntries: WeightEntry[]
  latestOverall: WeightEntry | null
  latestInWeek: WeightEntry | null
  weeklyChangeKg: number | null
  baseline: WeightEntry | null
}

export interface BackupPayload {
  app: 'platewise'
  version: 1
  exportedAt: string
  data: {
    foodItems: FoodItem[]
    mealEntries: MealEntry[]
    weightEntries: WeightEntry[]
    settings: AppSettings[]
    savedMeals: SavedMeal[]
    meta: AppMeta[]
  }
}
