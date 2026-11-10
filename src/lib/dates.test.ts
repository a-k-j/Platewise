import { describe, expect, it } from 'vitest'
import {
  addDays,
  formatWeekRangeLabel,
  getWeekDates,
  getWeekStartKey,
  isValidDateKey,
  parseDateKey,
  toDateKey,
} from './dates'

describe('local date keys', () => {
  it('round-trips a local date without UTC shifting', () => {
    const date = new Date(2026, 10, 9, 23, 30)
    const key = toDateKey(date)
    expect(key).toBe('2026-11-09')
    expect(toDateKey(parseDateKey(key))).toBe(key)
  })

  it('rejects impossible and malformed dates', () => {
    expect(isValidDateKey('2026-02-30')).toBe(false)
    expect(isValidDateKey('2026-2-09')).toBe(false)
    expect(isValidDateKey('')).toBe(false)
    expect(isValidDateKey('2026-02-28')).toBe(true)
  })

  it('adds days across month boundaries', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })
})

describe('week boundaries', () => {
  it('finds a Monday week start for a Tuesday', () => {
    expect(getWeekStartKey('2026-11-10', 1)).toBe('2026-11-09')
    expect(getWeekDates('2026-11-10', 1)).toEqual([
      '2026-11-09',
      '2026-11-10',
      '2026-11-11',
      '2026-11-12',
      '2026-11-13',
      '2026-11-14',
      '2026-11-15',
    ])
  })

  it('supports a Sunday week start', () => {
    expect(getWeekStartKey('2026-11-10', 0)).toBe('2026-11-08')
    expect(getWeekDates('2026-11-08', 0)[6]).toBe('2026-11-14')
  })

  it('formats a single-month week range', () => {
    expect(formatWeekRangeLabel(getWeekDates('2026-11-10', 1))).toBe('9–15 November 2026')
  })
})
