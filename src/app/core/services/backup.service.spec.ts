import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CountdownRepository } from '../data/countdown-repository';
import { HOW_LONG_DB, HowLongDatabase } from '../data/db';
import { BACKUP_VERSION, Backup } from '../models';
import { BackupService } from './backup.service';

describe('BackupService', () => {
  let db: HowLongDatabase;
  let service: BackupService;
  let repository: CountdownRepository;

  beforeEach(async () => {
    db = new HowLongDatabase(`how-long-backup-${crypto.randomUUID()}`);
    TestBed.configureTestingModule({ providers: [{ provide: HOW_LONG_DB, useValue: db }] });
    service = TestBed.inject(BackupService);
    repository = TestBed.inject(CountdownRepository);
    await db.open();
  });

  afterEach(async () => {
    await db.delete();
  });

  const sample: Backup = {
    version: BACKUP_VERSION,
    exportedAt: '2026-09-25T00:00:00.000Z',
    countdowns: [
      {
        date: '2026-12-24',
        description: 'Christmas',
        appointments: [
          { date: '2026-12-01', title: 'Advent', color: '#c62828', icon: 'star' },
          { date: '2026-12-06', title: 'St Nicholas', color: '#2e7d32', icon: 'redeem' },
        ],
      },
      { date: '2027-01-01', description: 'New year', appointments: [] },
    ],
  };

  describe('createBackup', () => {
    it('exports countdowns with their appointments, without database ids', async () => {
      const id = await repository.createCountdown({ date: '2026-12-24', description: 'Christmas' });
      await repository.createAppointment({
        countdownId: id,
        date: '2026-12-01',
        title: 'Advent',
        color: '#c62828',
        icon: 'star',
      });

      const backup = await service.createBackup();

      expect(backup.version).toBe(BACKUP_VERSION);
      expect(backup.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(backup.countdowns).toEqual([
        {
          date: '2026-12-24',
          description: 'Christmas',
          appointments: [{ date: '2026-12-01', title: 'Advent', color: '#c62828', icon: 'star' }],
        },
      ]);
    });

    it('exports an empty database as an empty list', async () => {
      expect((await service.createBackup()).countdowns).toEqual([]);
    });
  });

  describe('parse', () => {
    it('accepts a well-formed backup', () => {
      expect(service.parse(JSON.stringify(sample))).toEqual(sample);
    });

    it('rejects malformed JSON', () => {
      expect(() => service.parse('{ not json')).toThrow(/not valid json/i);
    });

    it('rejects an unsupported version', () => {
      expect(() => service.parse(JSON.stringify({ ...sample, version: 99 }))).toThrow(
        /version 99/i,
      );
    });

    it('rejects a missing countdowns array', () => {
      expect(() => service.parse(JSON.stringify({ version: BACKUP_VERSION }))).toThrow(
        /countdowns/i,
      );
    });

    it('rejects an invalid countdown date', () => {
      const broken = { ...sample, countdowns: [{ date: '24.12.2026', appointments: [] }] };
      expect(() => service.parse(JSON.stringify(broken))).toThrow(/yyyy-mm-dd/i);
    });

    it('rejects an appointment that is not before its target date', () => {
      const broken = {
        ...sample,
        countdowns: [
          {
            date: '2026-12-24',
            appointments: [{ date: '2026-12-24', title: 'x', color: '#000000', icon: 'flag' }],
          },
        ],
      };
      expect(() => service.parse(JSON.stringify(broken))).toThrow(/before the target date/i);
    });

    it('rejects an appointment without a title', () => {
      const broken = {
        ...sample,
        countdowns: [
          {
            date: '2026-12-24',
            appointments: [{ date: '2026-12-01', title: '', color: '#000000', icon: 'flag' }],
          },
        ],
      };
      expect(() => service.parse(JSON.stringify(broken))).toThrow(/title/i);
    });
  });

  describe('restore', () => {
    it('replaces the existing data by default', async () => {
      await repository.createCountdown({ date: '2030-01-01', description: 'Gone after import' });

      const result = await service.restore(sample, 'replace');

      expect(result).toEqual({ countdowns: 2, appointments: 2 });
      expect((await repository.listCountdowns()).map((c) => c.date)).toEqual([
        '2026-12-24',
        '2027-01-01',
      ]);
    });

    it('keeps the existing data when merging', async () => {
      await repository.createCountdown({ date: '2030-01-01', description: 'Survives' });

      await service.restore(sample, 'merge');

      expect((await repository.listCountdowns()).map((c) => c.date)).toEqual([
        '2026-12-24',
        '2027-01-01',
        '2030-01-01',
      ]);
    });

    it('links imported appointments to their own countdown', async () => {
      await service.restore(sample, 'replace');

      const [christmas, newYear] = await repository.listCountdowns();

      expect((await repository.listAppointments(christmas.id!)).map((a) => a.title)).toEqual([
        'Advent',
        'St Nicholas',
      ]);
      expect(await repository.listAppointments(newYear.id!)).toEqual([]);
    });

    it('survives a round trip through JSON', async () => {
      await service.restore(sample, 'replace');

      const exported = service.parse(service.toJson(await service.createBackup()));
      await service.restore(exported, 'replace');

      expect((await service.createBackup()).countdowns).toEqual(sample.countdowns);
    });
  });
});
