// ============================================
// Locale-aware formatting through Intl — no hand-written day/month lists,
// so a new interface language needs nothing here.
// ============================================

/** Plural forms keyed by Intl.PluralRules category; `{n}` is replaced by the number */
export type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string }

export function plural(locale: string, n: number, forms: PluralForms): string {
  const category = new Intl.PluralRules(locale).select(n)
  return (forms[category] ?? forms.other).replace('{n}', String(n))
}

const capitalize = (s: string) => s.charAt(0).toLocaleUpperCase() + s.slice(1)

/** Short weekday names starting from Monday: ['Пн', 'Вт', …] */
export function weekdaysShort(locale: string): string[] {
  const fmt = new Intl.DateTimeFormat(locale, { weekday: 'short' })
  // 2024-01-01 is a Monday
  return Array.from({ length: 7 }, (_, i) =>
    capitalize(fmt.format(new Date(2024, 0, 1 + i)).replace('.', ''))
  )
}

/** Month name for a header, e.g. "Ноябрь 2026" */
export function monthYear(locale: string, year: number, monthIndex: number): string {
  const month = new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(year, monthIndex, 1))
  return `${capitalize(month)} ${year}`
}

/** Day heading, e.g. "Пн, 23 ноября" */
export function dayHeading(locale: string, date: Date): string {
  return capitalize(
    new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'long' }).format(date)
  )
}

/** Monday–Sunday range of a week, e.g. "17–23 ноября" */
export function weekRange(locale: string, mondayStr: string): string {
  const start = parseLocalDate(mondayStr)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  const fmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long' })
  return typeof fmt.formatRange === 'function' ? fmt.formatRange(start, end) : `${fmt.format(start)} – ${fmt.format(end)}`
}

/** IANA time zone of this device, sent to the API so "today" is the user's day */
export function getTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
}

/** 'YYYY-MM-DD' of a local date (toISOString would shift it to UTC) */
export function toDateString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Parses 'YYYY-MM-DD' as a local date (new Date('YYYY-MM-DD') would be UTC) */
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}
