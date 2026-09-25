const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Formats a `Date` as a `yyyy-mm-dd` string in the local time zone. */
export function toIsoDate(date: Date): string {
  const year = `${date.getFullYear()}`.padStart(4, '0');
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Parses a `yyyy-mm-dd` string into a local `Date` at midnight, or `null` if malformed. */
export function parseIsoDate(value: string): Date | null {
  if (!ISO_DATE_PATTERN.test(value)) {
    return null;
  }
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  // Rejects overflowing values such as 2026-02-30, which `Date` would roll over.
  return toIsoDate(date) === value ? date : null;
}

/** Whether `value` is a well-formed and existing `yyyy-mm-dd` calendar day. */
export function isValidIsoDate(value: string): boolean {
  return parseIsoDate(value) !== null;
}

/**
 * Whole calendar days from `from` to `to`, negative when `to` precedes `from`.
 * Computed via UTC midnights so daylight saving transitions cannot skew the result.
 */
export function daysBetween(from: string, to: string): number {
  const start = parseIsoDate(from);
  const end = parseIsoDate(to);
  if (!start || !end) {
    throw new Error(`Invalid ISO date in range ${from}..${to}`);
  }
  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.round((endUtc - startUtc) / MS_PER_DAY);
}

/** Whole calendar days from `today` until the `yyyy-mm-dd` `target`. */
export function daysUntil(target: string, today: Date = new Date()): number {
  return daysBetween(toIsoDate(today), target);
}
