import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CountdownRepository } from './countdown-repository';
import { HOW_LONG_DB, HowLongDatabase } from './db';

describe('CountdownRepository', () => {
  let db: HowLongDatabase;
  let repository: CountdownRepository;

  beforeEach(async () => {
    db = new HowLongDatabase(`how-long-test-${crypto.randomUUID()}`);
    TestBed.configureTestingModule({ providers: [{ provide: HOW_LONG_DB, useValue: db }] });
    repository = TestBed.inject(CountdownRepository);
    await db.open();
  });

  afterEach(async () => {
    await db.delete();
  });

  describe('countdowns', () => {
    it('creates a countdown and returns its generated id', async () => {
      const id = await repository.createCountdown({ date: '2026-12-24', description: 'Christmas' });

      await expect(repository.getCountdown(id)).resolves.toEqual({
        id,
        date: '2026-12-24',
        description: 'Christmas',
      });
    });

    it('rejects a malformed date', async () => {
      await expect(repository.createCountdown({ date: '24.12.2026' })).rejects.toThrow(
        /valid yyyy-mm-dd/i,
      );
    });

    it('lists countdowns ordered by date', async () => {
      await repository.createCountdown({ date: '2026-12-24' });
      await repository.createCountdown({ date: '2026-01-01' });
      await repository.createCountdown({ date: '2026-06-15' });

      const dates = (await repository.listCountdowns()).map((c) => c.date);

      expect(dates).toEqual(['2026-01-01', '2026-06-15', '2026-12-24']);
    });

    it('updates a countdown', async () => {
      const id = await repository.createCountdown({ date: '2026-12-24' });

      await repository.updateCountdown(id, { description: 'Xmas eve' });

      expect((await repository.getCountdown(id))?.description).toBe('Xmas eve');
    });

    it('deletes a countdown together with its appointments', async () => {
      const id = await repository.createCountdown({ date: '2026-12-24' });
      const other = await repository.createCountdown({ date: '2026-12-31' });
      await repository.createAppointment({
        countdownId: id,
        date: '2026-12-01',
        title: 'Advent',
        color: '#ff0000',
        icon: 'star',
      });
      await repository.createAppointment({
        countdownId: other,
        date: '2026-12-02',
        title: 'Keep me',
        color: '#00ff00',
        icon: 'flag',
      });

      await repository.deleteCountdown(id);

      await expect(repository.getCountdown(id)).resolves.toBeUndefined();
      await expect(repository.listAppointments(id)).resolves.toEqual([]);
      expect(await repository.listAppointments(other)).toHaveLength(1);
    });

    it('returns undefined for an unknown id', async () => {
      await expect(repository.getCountdown(4711)).resolves.toBeUndefined();
    });
  });

  describe('appointments', () => {
    let countdownId: number;

    beforeEach(async () => {
      countdownId = await repository.createCountdown({ date: '2026-12-24' });
    });

    const appointment = (date: string, title = 'Milestone') => ({
      countdownId,
      date,
      title,
      color: '#1e88e5',
      icon: 'flag',
    });

    it('creates an appointment before the target date', async () => {
      const id = await repository.createAppointment(appointment('2026-12-01', 'Advent'));

      expect(await repository.listAppointments(countdownId)).toEqual([
        { id, ...appointment('2026-12-01', 'Advent') },
      ]);
    });

    it('rejects an appointment on or after the target date', async () => {
      await expect(repository.createAppointment(appointment('2026-12-24'))).rejects.toThrow(
        /before the target date/i,
      );
      await expect(repository.createAppointment(appointment('2026-12-25'))).rejects.toThrow(
        /before the target date/i,
      );
    });

    it('rejects an appointment for an unknown countdown', async () => {
      await expect(
        repository.createAppointment({ ...appointment('2026-12-01'), countdownId: 4711 }),
      ).rejects.toThrow(/countdown 4711/i);
    });

    it('lists appointments ordered by date', async () => {
      await repository.createAppointment(appointment('2026-12-03', 'c'));
      await repository.createAppointment(appointment('2026-01-03', 'a'));
      await repository.createAppointment(appointment('2026-06-03', 'b'));

      expect((await repository.listAppointments(countdownId)).map((a) => a.title)).toEqual([
        'a',
        'b',
        'c',
      ]);
    });

    it('revalidates the date when an appointment is updated', async () => {
      const id = await repository.createAppointment(appointment('2026-12-01'));

      await expect(repository.updateAppointment(id, { date: '2026-12-25' })).rejects.toThrow(
        /before the target date/i,
      );
      expect((await repository.listAppointments(countdownId))[0].date).toBe('2026-12-01');
    });

    it('updates an appointment', async () => {
      const id = await repository.createAppointment(appointment('2026-12-01'));

      await repository.updateAppointment(id, { title: 'Renamed', color: '#000000' });

      expect(await repository.getAppointment(id)).toMatchObject({
        title: 'Renamed',
        color: '#000000',
      });
    });

    it('deletes an appointment', async () => {
      const id = await repository.createAppointment(appointment('2026-12-01'));

      await repository.deleteAppointment(id);

      await expect(repository.listAppointments(countdownId)).resolves.toEqual([]);
    });
  });

  describe('findNextCountdown', () => {
    it('returns the earliest countdown that has not passed', async () => {
      await repository.createCountdown({ date: '2026-01-01' });
      const next = await repository.createCountdown({ date: '2026-10-01' });
      await repository.createCountdown({ date: '2026-12-24' });

      expect(await repository.findNextCountdown(new Date(2026, 8, 25))).toMatchObject({ id: next });
    });

    it('includes a countdown that is due today', async () => {
      const today = await repository.createCountdown({ date: '2026-09-25' });

      expect(await repository.findNextCountdown(new Date(2026, 8, 25))).toMatchObject({
        id: today,
      });
    });

    it('falls back to the most recent past countdown when all have passed', async () => {
      await repository.createCountdown({ date: '2020-01-01' });
      const latest = await repository.createCountdown({ date: '2021-01-01' });

      expect(await repository.findNextCountdown(new Date(2026, 8, 25))).toMatchObject({
        id: latest,
      });
    });

    it('returns undefined when there is no countdown at all', async () => {
      await expect(repository.findNextCountdown(new Date(2026, 8, 25))).resolves.toBeUndefined();
    });
  });
});
