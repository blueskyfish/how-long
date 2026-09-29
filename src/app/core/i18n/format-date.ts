import { parseIsoDate } from '../services/date-utils';
import { Language } from './languages';

/**
 * Shows a `yyyy-mm-dd` day the way the language writes it: `DD.MM.YYYY` in
 * German, `YYYY-MM-DD` in English. Anything that is not a real calendar day is
 * returned as it is, so a half-typed or corrupt value never turns into
 * something that looks valid.
 */
export function formatDate(value: string, language: Language): string {
  if (!parseIsoDate(value)) {
    return value;
  }
  if (language === 'de') {
    const [year, month, day] = value.split('-');
    return `${day}.${month}.${year}`;
  }
  return value;
}

/**
 * Reads a day the way a person types it: `DD.MM.YYYY` (also `D.M.YYYY`) or
 * `YYYY-MM-DD`, in either language, so a pasted or habitual format still works.
 * Returns the `yyyy-mm-dd` day, or `null` when the text is no real calendar day.
 */
export function parseLocalDate(text: string): string | null {
  const value = text.trim();
  const dotted = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(value);
  const iso = dotted
    ? `${dotted[3]}-${dotted[2].padStart(2, '0')}-${dotted[1].padStart(2, '0')}`
    : value;
  return parseIsoDate(iso) ? iso : null;
}
