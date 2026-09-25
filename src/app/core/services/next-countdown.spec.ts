import { describe, expect, it } from 'vitest';
import { Countdown } from '../models';
import { pickNextCountdown } from './next-countdown';

describe('pickNextCountdown', () => {
  const today = new Date(2026, 8, 25);
  const countdowns = (...dates: string[]): Countdown[] =>
    dates.map((date, index) => ({ id: index + 1, date }));

  it('returns the earliest countdown that has not passed', () => {
    const list = countdowns('2026-01-01', '2026-10-01', '2026-12-24');

    expect(pickNextCountdown(list, today)?.date).toBe('2026-10-01');
  });

  it('counts a countdown due today as still ahead', () => {
    expect(pickNextCountdown(countdowns('2026-09-25'), today)?.date).toBe('2026-09-25');
  });

  it('falls back to the most recent past countdown', () => {
    expect(pickNextCountdown(countdowns('2020-01-01', '2021-01-01'), today)?.date).toBe(
      '2021-01-01',
    );
  });

  it('returns undefined for an empty list', () => {
    expect(pickNextCountdown([], today)).toBeUndefined();
  });
});
