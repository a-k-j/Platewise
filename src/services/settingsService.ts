import { db } from '../db/database'
import { createDefaultSettings } from '../db/seed'
import type { AppSettings, SettingsInput } from '../types'
import { isoNow } from '../lib/dates'
import { assertValid, validateSettingsInput } from '../lib/validation'

export async function getSettings(): Promise<AppSettings> {
  const settings = await db.settings.get('app')
  if (settings) return settings
  const defaults = createDefaultSettings()
  await db.settings.put(defaults)
  return defaults
}

export async function updateSettings(input: SettingsInput): Promise<AppSettings> {
  assertValid(validateSettingsInput(input))
  const updated: AppSettings = {
    id: 'app',
    ...input,
    updatedAt: isoNow(),
  }
  await db.settings.put(updated)
  return updated
}

export async function updateDailyTarget(dailyCalorieTarget: number): Promise<void> {
  const current = await getSettings()
  await updateSettings({
    dailyCalorieTarget,
    proteinTarget: current.proteinTarget,
    weekStartsOn: current.weekStartsOn,
    theme: current.theme,
  })
}
