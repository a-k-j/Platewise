import { db } from '../db/database'
import type { WeightEntry, WeightEntryDraft } from '../types'
import { isoNow } from '../lib/dates'
import { assertValid, validateWeightDraft } from '../lib/validation'

export async function upsertWeightEntry(draft: WeightEntryDraft): Promise<number> {
  assertValid(validateWeightDraft(draft))
  return db.transaction('rw', db.weightEntries, async () => {
    const existing = await db.weightEntries.where('date').equals(draft.date).first()
    const now = isoNow()
    if (existing?.id != null) {
      await db.weightEntries.update(existing.id, {
        weightKg: draft.weightKg,
        notes: draft.notes.trim(),
        updatedAt: now,
      })
      return existing.id
    }
    return db.weightEntries.add({
      date: draft.date,
      weightKg: draft.weightKg,
      notes: draft.notes.trim(),
      createdAt: now,
      updatedAt: now,
    })
  })
}

export async function updateWeightEntry(id: number, draft: WeightEntryDraft): Promise<void> {
  assertValid(validateWeightDraft(draft))
  const existing = await db.weightEntries.get(id)
  if (!existing) throw new Error('That weight entry no longer exists.')

  const conflicting = await db.weightEntries.where('date').equals(draft.date).first()
  if (conflicting && conflicting.id !== id) {
    throw new Error('A weight entry already exists for that date.')
  }

  await db.weightEntries.update(id, {
    date: draft.date,
    weightKg: draft.weightKg,
    notes: draft.notes.trim(),
    updatedAt: isoNow(),
  })
}

export async function deleteWeightEntry(id: number): Promise<void> {
  await db.weightEntries.delete(id)
}

export async function getWeightEntries(): Promise<WeightEntry[]> {
  return db.weightEntries.orderBy('date').toArray()
}
