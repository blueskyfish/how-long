import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { liveQuery } from 'dexie';
import { Appointment, Countdown } from '../models';
import { isValidIsoDate } from '../services/date-utils';
import { pickNextCountdown } from '../services/next-countdown';
import { HOW_LONG_DB } from './db';

/**
 * Single access point to the IndexedDB stores. Enforces the two domain rules that
 * the schema itself cannot express: dates are `yyyy-mm-dd`, and an appointment
 * always falls strictly before the target date of its countdown.
 */
@Injectable({ providedIn: 'root' })
export class CountdownRepository {
  private readonly db = inject(HOW_LONG_DB);

  // -- Countdowns ------------------------------------------------------------

  listCountdowns(): Promise<Countdown[]> {
    return this.db.countdowns.orderBy('date').toArray();
  }

  /** Emits the full countdown list again whenever it changes. */
  watchCountdowns(): Observable<Countdown[]> {
    return liveQuery(() => this.listCountdowns()) as unknown as Observable<Countdown[]>;
  }

  getCountdown(id: number): Promise<Countdown | undefined> {
    return this.db.countdowns.get(id);
  }

  watchCountdown(id: number): Observable<Countdown | undefined> {
    return liveQuery(() => this.getCountdown(id)) as unknown as Observable<Countdown | undefined>;
  }

  async createCountdown(countdown: Omit<Countdown, 'id'>): Promise<number> {
    this.assertIsoDate(countdown.date);
    return this.db.countdowns.add({ ...countdown });
  }

  async updateCountdown(id: number, changes: Partial<Omit<Countdown, 'id'>>): Promise<void> {
    if (changes.date !== undefined) {
      this.assertIsoDate(changes.date);
      await this.assertAppointmentsFitBefore(id, changes.date);
    }
    await this.db.countdowns.update(id, changes);
  }

  /** Removes a countdown and every appointment that belongs to it. */
  async deleteCountdown(id: number): Promise<void> {
    await this.db.transaction('rw', this.db.countdowns, this.db.appointments, async () => {
      await this.db.appointments.where('countdownId').equals(id).delete();
      await this.db.countdowns.delete(id);
    });
  }

  /** See {@link pickNextCountdown}. */
  async findNextCountdown(today: Date = new Date()): Promise<Countdown | undefined> {
    return pickNextCountdown(await this.listCountdowns(), today);
  }

  // -- Appointments ----------------------------------------------------------

  listAppointments(countdownId: number): Promise<Appointment[]> {
    return this.db.appointments.where('countdownId').equals(countdownId).sortBy('date');
  }

  watchAppointments(countdownId: number): Observable<Appointment[]> {
    return liveQuery(() => this.listAppointments(countdownId)) as unknown as Observable<
      Appointment[]
    >;
  }

  getAppointment(id: number): Promise<Appointment | undefined> {
    return this.db.appointments.get(id);
  }

  async createAppointment(appointment: Omit<Appointment, 'id'>): Promise<number> {
    this.assertIsoDate(appointment.date);
    await this.assertBeforeTargetDate(appointment.countdownId, appointment.date);
    return this.db.appointments.add({ ...appointment });
  }

  async updateAppointment(id: number, changes: Partial<Omit<Appointment, 'id'>>): Promise<void> {
    const existing = await this.db.appointments.get(id);
    if (!existing) {
      throw new Error(`Unknown appointment ${id}`);
    }
    const merged = { ...existing, ...changes };
    this.assertIsoDate(merged.date);
    await this.assertBeforeTargetDate(merged.countdownId, merged.date);
    await this.db.appointments.update(id, changes);
  }

  deleteAppointment(id: number): Promise<void> {
    return this.db.appointments.delete(id);
  }

  // -- Invariants ------------------------------------------------------------

  private assertIsoDate(date: string): void {
    if (!isValidIsoDate(date)) {
      throw new Error(`"${date}" is not a valid yyyy-mm-dd date`);
    }
  }

  private async assertBeforeTargetDate(countdownId: number, date: string): Promise<void> {
    const countdown = await this.db.countdowns.get(countdownId);
    if (!countdown) {
      throw new Error(`Unknown countdown ${countdownId}`);
    }
    if (date >= countdown.date) {
      throw new Error(`Appointment date ${date} must be before the target date ${countdown.date}`);
    }
  }

  private async assertAppointmentsFitBefore(countdownId: number, date: string): Promise<void> {
    const appointments = await this.listAppointments(countdownId);
    const conflict = appointments.find((appointment) => appointment.date >= date);
    if (conflict) {
      throw new Error(
        `Appointment "${conflict.title}" on ${conflict.date} must be before the target date ${date}`,
      );
    }
  }
}
