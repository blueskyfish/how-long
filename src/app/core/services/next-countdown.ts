import { Countdown } from '../models';
import { toIsoDate } from './date-utils';

/** Whether the countdown's target day is today or later; a passed one is no longer shown. */
export function isAhead(countdown: Countdown, today: Date = new Date()): boolean {
  return countdown.date >= toIsoDate(today);
}

/**
 * The countdown the start page opens on: the earliest one still ahead (today
 * counts as ahead), or none if every target date has passed. Expects
 * `countdowns` sorted by date ascending.
 */
export function pickNextCountdown(
  countdowns: readonly Countdown[],
  today: Date = new Date(),
): Countdown | undefined {
  return countdowns.find((countdown) => isAhead(countdown, today));
}
