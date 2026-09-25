import { describe, expect, it } from 'vitest';
import { daysBetween, daysUntil, isValidIsoDate, toIsoDate } from './date-utils';

describe('toIsoDate', () => {
  it('formats a local date as yyyy-mm-dd', () => {
    expect(toIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('uses local time, not UTC, so late-evening dates do not shift a day', () => {
    expect(toIsoDate(new Date(2026, 11, 31, 23, 30))).toBe('2026-12-31');
  });
});

describe('isValidIsoDate', () => {
  it.each(['2026-01-01', '2026-12-31', '2024-02-29'])('accepts %s', (value) => {
    expect(isValidIsoDate(value)).toBe(true);
  });

  it.each(['', '2026-1-1', '26-01-01', '2026-13-01', '2026-02-30', 'tomorrow'])(
    'rejects %s',
    (value) => {
      expect(isValidIsoDate(value)).toBe(false);
    },
  );
});

describe('daysBetween', () => {
  it('counts whole calendar days', () => {
    expect(daysBetween('2026-01-01', '2026-01-08')).toBe(7);
  });

  it('returns 0 for the same day', () => {
    expect(daysBetween('2026-03-15', '2026-03-15')).toBe(0);
  });

  it('returns a negative number when the target is in the past', () => {
    expect(daysBetween('2026-01-10', '2026-01-08')).toBe(-2);
  });

  it('is unaffected by daylight saving transitions', () => {
    // Central European summer time starts on 2026-03-29.
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2);
  });

  it('spans leap days correctly', () => {
    expect(daysBetween('2024-02-28', '2024-03-01')).toBe(2);
  });
});

describe('daysUntil', () => {
  it('measures from the given "today" to the target', () => {
    expect(daysUntil('2026-12-24', new Date(2026, 8, 25))).toBe(90);
  });

  it('returns 0 on the target day itself', () => {
    expect(daysUntil('2026-09-25', new Date(2026, 8, 25, 18, 0))).toBe(0);
  });
});
