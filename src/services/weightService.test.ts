import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../db/database'
import { initializeDatabase } from '../db/initialize'
import {
  deleteWeightEntry,
  getWeightEntries,
  updateWeightEntry,
  upsertWeightEntry,
} from './weightService'

beforeEach(async () => {
  await db.delete()
  await initializeDatabase()
})

describe('weight upsert', () => {
  it('creates one entry per date and updates it on repeat', async () => {
    const firstId = await upsertWeightEntry({ date: '2026-11-10', weightKg: 72.5, notes: 'Morning' })
    const secondId = await upsertWeightEntry({ date: '2026-11-10', weightKg: 72, notes: 'After walk' })

    expect(secondId).toBe(firstId)
    const entries = await getWeightEntries()
    expect(entries).toHaveLength(1)
    expect(entries[0].weightKg).toBe(72)
    expect(entries[0].notes).toBe('After walk')
  })

  it('keeps entries sorted by date', async () => {
    await upsertWeightEntry({ date: '2026-11-12', weightKg: 71, notes: '' })
    await upsertWeightEntry({ date: '2026-11-09', weightKg: 72, notes: '' })
    const entries = await getWeightEntries()
    expect(entries.map((entry) => entry.date)).toEqual(['2026-11-09', '2026-11-12'])
  })

  it('validates dates and positive weights', async () => {
    await expect(upsertWeightEntry({ date: '2026-02-30', weightKg: 70, notes: '' })).rejects.toThrow('valid date')
    await expect(upsertWeightEntry({ date: '2026-11-10', weightKg: 0, notes: '' })).rejects.toThrow(
      'greater than zero',
    )
  })
})

describe('weight updates and deletion', () => {
  it('updates an entry and prevents moving it onto another date', async () => {
    const firstId = await upsertWeightEntry({ date: '2026-11-10', weightKg: 72, notes: '' })
    const secondId = await upsertWeightEntry({ date: '2026-11-11', weightKg: 71.5, notes: '' })

    await updateWeightEntry(firstId, { date: '2026-11-10', weightKg: 71.8, notes: 'Evening' })
    expect((await db.weightEntries.get(firstId))?.weightKg).toBe(71.8)

    await expect(
      updateWeightEntry(firstId, { date: '2026-11-11', weightKg: 71.8, notes: '' }),
    ).rejects.toThrow('already exists')
    expect((await db.weightEntries.get(secondId))?.weightKg).toBe(71.5)
  })

  it('deletes an entry', async () => {
    const id = await upsertWeightEntry({ date: '2026-11-10', weightKg: 72, notes: '' })
    await deleteWeightEntry(id)
    expect(await db.weightEntries.count()).toBe(0)
  })
})
