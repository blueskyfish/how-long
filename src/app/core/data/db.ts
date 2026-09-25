import { InjectionToken } from '@angular/core';
import Dexie, { Table } from 'dexie';
import { Appointment, Countdown } from '../models';

/** IndexedDB schema for the application, managed by Dexie. */
export class HowLongDatabase extends Dexie {
  countdowns!: Table<Countdown, number>;
  appointments!: Table<Appointment, number>;

  constructor(name = 'how-long') {
    super(name);
    this.version(1).stores({
      countdowns: '++id, date',
      appointments: '++id, countdownId, date, [countdownId+date]',
    });
  }
}

/**
 * The application-wide database instance. Overridable in tests so each spec can
 * run against its own isolated IndexedDB.
 */
export const HOW_LONG_DB = new InjectionToken<HowLongDatabase>('HOW_LONG_DB', {
  providedIn: 'root',
  factory: () => new HowLongDatabase(),
});
