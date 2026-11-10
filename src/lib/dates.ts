const DAY_MS = 86_400_000

export function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

/** Format a Date as a local-calendar YYYY-MM-DD key. Never uses UTC. */
export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

/** Parse a YYYY-MM-DD key as local noon to avoid DST edge cases. */
export function parseDateKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year, month - 1, day, 12, 0, 0, 0)
}

export function isValidDateKey(key: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return false
  const date = parseDateKey(key)
  return !Number.isNaN(date.getTime()) && toDateKey(date) === key
}

export function todayKey(now: Date = new Date()): string {
  return toDateKey(now)
}

export function addDays(key: string, amount: number): string {
  const date = parseDateKey(key)
  date.setDate(date.getDate() + amount)
  return toDateKey(date)
}

export function differenceInCalendarDays(a: string, b: string): number {
  return Math.round((parseDateKey(a).getTime() - parseDateKey(b).getTime()) / DAY_MS)
}

export function getWeekStartKey(anchorKey: string, weekStartsOn: number): string {
  const date = parseDateKey(anchorKey)
  const offset = (date.getDay() - weekStartsOn + 7) % 7
  date.setDate(date.getDate() - offset)
  return toDateKey(date)
}

export function getWeekDates(anchorKey: string, weekStartsOn: number): string[] {
  const start = getWeekStartKey(anchorKey, weekStartsOn)
  return Array.from({ length: 7 }, (_, index) => addDays(start, index))
}

export function getRecentDayKeys(count: number, endKey: string = todayKey()): string[] {
  return Array.from({ length: count }, (_, index) => addDays(endKey, -index))
}

export function isTodayKey(key: string): boolean {
  return key === todayKey()
}

export function formatLongDate(key: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(parseDateKey(key))
}

export function formatShortDate(key: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(parseDateKey(key))
}

export function formatDayMonth(key: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
  }).format(parseDateKey(key))
}

export function formatWeekdayShort(key: string): string {
  return new Intl.DateTimeFormat('en-GB', { weekday: 'short' }).format(parseDateKey(key))
}

export function formatWeekdayNarrow(key: string): string {
  return new Intl.DateTimeFormat('en-GB', { weekday: 'narrow' }).format(parseDateKey(key))
}

export function formatMonthYear(key: string): string {
  return new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(parseDateKey(key))
}

export function formatWeekRangeLabel(dates: string[]): string {
  if (dates.length === 0) return ''
  const first = dates[0]
  const last = dates[dates.length - 1]
  const firstDate = parseDateKey(first)
  const lastDate = parseDateKey(last)
  const sameMonth = firstDate.getMonth() === lastDate.getMonth() && firstDate.getFullYear() === lastDate.getFullYear()
  const sameYear = firstDate.getFullYear() === lastDate.getFullYear()

  if (sameMonth) {
    return `${firstDate.getDate()}–${lastDate.getDate()} ${formatMonthYear(last)}`
  }
  if (sameYear) {
    return `${formatDayMonth(first)} – ${formatDayMonth(last)} ${lastDate.getFullYear()}`
  }
  return `${formatDayMonth(first)} ${firstDate.getFullYear()} – ${formatDayMonth(last)} ${lastDate.getFullYear()}`
}

export function formatRelativeDay(key: string): string {
  const difference = differenceInCalendarDays(key, todayKey())
  if (difference === 0) return 'Today'
  if (difference === -1) return 'Yesterday'
  if (difference === 1) return 'Tomorrow'
  return formatShortDate(key)
}

export function isoNow(): string {
  return new Date().toISOString()
}

export function getWeekStartOptions(): { value: number; label: string }[] {
  return [
    { value: 1, label: 'Monday' },
    { value: 0, label: 'Sunday' },
    { value: 6, label: 'Saturday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
  ]
}
