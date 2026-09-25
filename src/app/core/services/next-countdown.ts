import { Countdown } from '../models';
import { toIsoDate } from './date-utils';

/**
 * The countdown the start page opens on: the earliest one still ahead (today
 * counts as ahead), or — if every target date has passed — the most recent past
 * one. Expects `countdowns` sorted by date ascending.
 */
export function pickNextCountdown(
  countdowns: readonly Countdown[],
  today: Date = new Date(),
): Countdown | undefined {
  const isoToday = toIsoDate(today);
  return countdowns.find((countdown) => countdown.date >= isoToday) ?? countdowns.at(-1);
}
