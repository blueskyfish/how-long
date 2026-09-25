import { Appointment } from './appointment';
import { Countdown } from './countdown';

/** Schema version of the JSON backup format. */
export const BACKUP_VERSION = 1;

/** A countdown with its appointments, as written to / read from a JSON backup. */
export interface BackupCountdown extends Omit<Countdown, 'id'> {
  appointments: Omit<Appointment, 'id' | 'countdownId'>[];
}

/** Root object of a JSON backup file. */
export interface Backup {
  version: number;
  exportedAt: string;
  countdowns: BackupCountdown[];
}
