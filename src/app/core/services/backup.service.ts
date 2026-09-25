import { Injectable, inject } from '@angular/core';
import { HOW_LONG_DB } from '../data/db';
import { BACKUP_VERSION, Backup, BackupCountdown } from '../models';
import { isValidIsoDate } from './date-utils';

/** How an imported backup is combined with the data already in the database. */
export type RestoreMode = 'replace' | 'merge';

/** Number of records written by a restore. */
export interface RestoreResult {
  countdowns: number;
  appointments: number;
}

/**
 * Reads and writes the JSON backup format. Parsing is strict: a backup is
 * validated completely before a single record is written, so a bad file can never
 * leave the database half-imported.
 */
@Injectable({ providedIn: 'root' })
export class BackupService {
  private readonly db = inject(HOW_LONG_DB);

  /** Snapshots the whole database, stripping the auto-generated ids. */
  async createBackup(): Promise<Backup> {
    const countdowns = await this.db.countdowns.orderBy('date').toArray();
    const exported: BackupCountdown[] = [];

    for (const countdown of countdowns) {
      const appointments = await this.db.appointments
        .where('countdownId')
        .equals(countdown.id!)
        .sortBy('date');
      exported.push({
        date: countdown.date,
        ...(countdown.description ? { description: countdown.description } : {}),
        appointments: appointments.map(({ date, title, color, icon }) => ({
          date,
          title,
          color,
          icon,
        })),
      });
    }

    return { version: BACKUP_VERSION, exportedAt: new Date().toISOString(), countdowns: exported };
  }

  /** Serialises a backup to the JSON text that gets downloaded. */
  toJson(backup: Backup): string {
    return JSON.stringify(backup, null, 2);
  }

  /** Suggested file name for a downloaded backup, e.g. `how-long-2026-09-25.json`. */
  fileName(backup: Backup): string {
    return `how-long-${backup.exportedAt.slice(0, 10)}.json`;
  }

  /** Parses and validates backup JSON, throwing a user-readable error on any problem. */
  parse(json: string): Backup {
    let raw: unknown;
    try {
      raw = JSON.parse(json);
    } catch {
      throw new Error('The file is not valid JSON.');
    }
    return this.validate(raw);
  }

  /** Writes a validated backup into the database, atomically. */
  async restore(backup: Backup, mode: RestoreMode = 'replace'): Promise<RestoreResult> {
    let appointmentCount = 0;

    await this.db.transaction('rw', this.db.countdowns, this.db.appointments, async () => {
      if (mode === 'replace') {
        await this.db.appointments.clear();
        await this.db.countdowns.clear();
      }
      for (const countdown of backup.countdowns) {
        const countdownId = await this.db.countdowns.add({
          date: countdown.date,
          ...(countdown.description ? { description: countdown.description } : {}),
        });
        await this.db.appointments.bulkAdd(
          countdown.appointments.map((appointment) => ({ ...appointment, countdownId })),
        );
        appointmentCount += countdown.appointments.length;
      }
    });

    return { countdowns: backup.countdowns.length, appointments: appointmentCount };
  }

  private validate(raw: unknown): Backup {
    if (!this.isRecord(raw)) {
      throw new Error('The backup must be a JSON object.');
    }
    if (raw['version'] !== BACKUP_VERSION) {
      throw new Error(`Unsupported backup version ${raw['version']}; expected ${BACKUP_VERSION}.`);
    }
    if (!Array.isArray(raw['countdowns'])) {
      throw new Error('The backup is missing its "countdowns" array.');
    }

    const countdowns = raw['countdowns'].map((entry, index) =>
      this.validateCountdown(entry, index),
    );
    const exportedAt =
      typeof raw['exportedAt'] === 'string' ? raw['exportedAt'] : new Date().toISOString();

    return { version: BACKUP_VERSION, exportedAt, countdowns };
  }

  private validateCountdown(raw: unknown, index: number): BackupCountdown {
    const where = `countdowns[${index}]`;
    if (!this.isRecord(raw)) {
      throw new Error(`${where} must be an object.`);
    }
    const date = raw['date'];
    if (typeof date !== 'string' || !isValidIsoDate(date)) {
      throw new Error(`${where}.date must be a yyyy-mm-dd date, got ${JSON.stringify(date)}.`);
    }
    const description = raw['description'];
    if (description !== undefined && typeof description !== 'string') {
      throw new Error(`${where}.description must be a string.`);
    }
    const rawAppointments = raw['appointments'] ?? [];
    if (!Array.isArray(rawAppointments)) {
      throw new Error(`${where}.appointments must be an array.`);
    }

    const appointments = rawAppointments.map((entry, appointmentIndex) => {
      const appointmentWhere = `${where}.appointments[${appointmentIndex}]`;
      if (!this.isRecord(entry)) {
        throw new Error(`${appointmentWhere} must be an object.`);
      }
      const appointmentDate = entry['date'];
      if (typeof appointmentDate !== 'string' || !isValidIsoDate(appointmentDate)) {
        throw new Error(`${appointmentWhere}.date must be a yyyy-mm-dd date.`);
      }
      if (appointmentDate >= date) {
        throw new Error(
          `${appointmentWhere}.date (${appointmentDate}) must be before the target date ${date}.`,
        );
      }
      const title = entry['title'];
      if (typeof title !== 'string' || title.trim() === '') {
        throw new Error(`${appointmentWhere}.title must be a non-empty string.`);
      }
      return {
        date: appointmentDate,
        title,
        color: typeof entry['color'] === 'string' ? entry['color'] : '#1e88e5',
        icon: typeof entry['icon'] === 'string' ? entry['icon'] : 'event',
      };
    });

    return { date, ...(description ? { description } : {}), appointments };
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}
