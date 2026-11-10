import { db } from './database'
import { buildStarterFoodRecords, createDefaultSettings } from './seed'
import { isoNow } from '../lib/dates'

/**
 * Opens the database and seeds the starter food library / default settings exactly once.
 * A `meta.seeded` flag means intentionally deleting all foods won't silently re-seed them.
 */
export async function initializeDatabase(): Promise<void> {
  await db.open()

  await db.transaction('rw', db.foodItems, db.settings, db.meta, async () => {
    const settings = await db.settings.get('app')
    if (!settings) {
      await db.settings.put(createDefaultSettings())
    }

    const seeded = await db.meta.get('seeded')
    if (!seeded) {
      const foodCount = await db.foodItems.count()
      if (foodCount === 0) {
        await db.foodItems.bulkAdd(buildStarterFoodRecords())
      }
      await db.meta.put({ key: 'seeded', value: isoNow() })
    }
  })
}

/** Used by "Clear all data" and by tests. Restores starter foods + default settings. */
export async function reseedDatabase(): Promise<void> {
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
      await db.foodItems.bulkAdd(buildStarterFoodRecords())
      await db.settings.put(createDefaultSettings())
      await db.meta.put({ key: 'seeded', value: isoNow() })
    },
  )
}
