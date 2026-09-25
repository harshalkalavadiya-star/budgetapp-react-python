export type DatePreset = 'week' | 'month' | 'year' | 'custom'

export interface DateRange {
  start: string
  end: string
}

function toISO(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function resolveDateRange(
  preset: DatePreset,
  customStart = '',
  customEnd = '',
): DateRange {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const end = toISO(today)

  if (preset === 'custom') {
    return {
      start: customStart || end,
      end: customEnd || end,
    }
  }

  if (preset === 'week') {
    const start = new Date(today)
    const day = start.getDay()
    const diff = day === 0 ? 6 : day - 1
    start.setDate(start.getDate() - diff)
    return { start: toISO(start), end }
  }

  if (preset === 'month') {
    const start = new Date(today.getFullYear(), today.getMonth(), 1)
    return { start: toISO(start), end }
  }

  const start = new Date(today.getFullYear(), 0, 1)
  return { start: toISO(start), end }
}

export function formatRangeLabel(range: DateRange): string {
  return `${range.start} → ${range.end}`
}
