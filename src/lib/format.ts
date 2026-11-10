export function formatNumber(value: number, maximumFractionDigits = 0): string {
  return new Intl.NumberFormat('en-GB', {
    maximumFractionDigits,
    minimumFractionDigits: 0,
  }).format(value)
}

export function formatCalories(value: number): string {
  return formatNumber(Math.round(value))
}

export function formatMacro(value: number): string {
  return formatNumber(value, 1)
}

export function formatQuantity(value: number): string {
  return formatNumber(value, 2)
}

export function formatWeight(weightKg: number): string {
  return `${weightKg.toFixed(1)} kg`
}

export function formatSigned(value: number, digits = 1): string {
  const rounded = Number(value.toFixed(digits))
  if (rounded === 0) return `0`
  return `${rounded > 0 ? '+' : '−'}${Math.abs(rounded).toFixed(digits)}`
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return count === 1 ? singular : plural
}

export function truncate(value: string, length: number): string {
  if (value.length <= length) return value
  return `${value.slice(0, length - 1).trimEnd()}…`
}
