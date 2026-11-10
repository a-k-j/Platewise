import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import { createDefaultSettings } from '../db/seed'
import type { AppSettings } from '../types'

export function useSettings(): { settings: AppSettings; isLoading: boolean } {
  const settings = useLiveQuery(() => db.settings.get('app'), [])
  return {
    settings: settings ?? createDefaultSettings(),
    isLoading: settings === undefined,
  }
}
