import { describe, expect, it } from 'vitest';
import { formatDate, parseLocalDate } from './format-date';

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

describe('parseLocalDate', () => {
  it.each([
    ['24.12.2026', '2026-12-24'],
    ['4.1.2026', '2026-01-04'],
    ['04.01.2026', '2026-01-04'],
    ['2026-12-24', '2026-12-24'],
    ['  24.12.2026 ', '2026-12-24'],
  ])('reads %j as %s, in either language', (text, day) => {
    expect(parseLocalDate(text)).toBe(day);
  });

  it.each([
    '',
    '24.12.',
    '24.12.26',
    '30.02.2026',
    '2026-02-30',
    '24/12/2026',
    'soon',
    '32.01.2026',
  ])('gives null for %j', (text) => {
    expect(parseLocalDate(text)).toBeNull();
  });

  it('reads back what formatDate writes', () => {
    for (const language of ['en', 'de'] as const) {
      expect(parseLocalDate(formatDate('2026-03-09', language))).toBe('2026-03-09');
    }
  });
});
