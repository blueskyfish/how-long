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
