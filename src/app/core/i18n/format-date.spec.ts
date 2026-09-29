import { describe, expect, it } from 'vitest';
import { formatDate } from './format-date';

describe('formatDate', () => {
  it('writes a day as DD.MM.YYYY in German', () => {
    expect(formatDate('2026-12-24', 'de')).toBe('24.12.2026');
    expect(formatDate('2026-01-05', 'de')).toBe('05.01.2026');
  });

  it('keeps YYYY-MM-DD in English', () => {
    expect(formatDate('2026-12-24', 'en')).toBe('2026-12-24');
  });

  it.each(['', '2026-02-30', '24.12.2026', 'soon'])(
    'returns %j as it is, whatever the language',
    (value) => {
      expect(formatDate(value, 'de')).toBe(value);
      expect(formatDate(value, 'en')).toBe(value);
    },
  );
});
