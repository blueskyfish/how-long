import { TestBed } from '@angular/core/testing';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CountdownRepository } from '../../core/data/countdown-repository';
import { HOW_LONG_DB, HowLongDatabase } from '../../core/data/db';
import { BACKUP_VERSION } from '../../core/models';
import { FileTransferService } from '../../shared/file-transfer.service';
import { stubDialog } from '../../../testing/dialog';
import { provideNotificationSpy } from '../../../testing/notification';
import { BackupActions } from './backup-actions';

describe('BackupActions', () => {
  let db: HowLongDatabase;
  let repository: CountdownRepository;
  let actions: BackupActions;
  let files: { download: ReturnType<typeof vi.fn>; pick: ReturnType<typeof vi.fn> };
  let notifications: ReturnType<typeof provideNotificationSpy>['notifications'];

  const backupJson = JSON.stringify({
    version: BACKUP_VERSION,
    exportedAt: '2026-09-25T00:00:00.000Z',
    countdowns: [
      {
        date: '2026-12-24',
        description: 'Christmas',
        appointments: [
          { date: '2026-12-01', title: 'Advent', color: '#e53935', icon: 'lucideStar' },
        ],
      },
    ],
  });

  const jsonFile = (content: string) =>
    new File([content], 'backup.json', { type: 'application/json' });

  beforeEach(async () => {
    vi.clearAllMocks();
    db = new HowLongDatabase(`how-long-actions-${crypto.randomUUID()}`);
    files = { download: vi.fn(), pick: vi.fn() };
    const notificationSpy = provideNotificationSpy();
    notifications = notificationSpy.notifications;
    TestBed.configureTestingModule({
      providers: [
        { provide: HOW_LONG_DB, useValue: db },
        { provide: FileTransferService, useValue: files },
        notificationSpy.provider,
      ],
    });
    repository = TestBed.inject(CountdownRepository);
    actions = TestBed.inject(BackupActions);
    await db.open();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await db.delete();
  });

  describe('export', () => {
    it('downloads the database as a dated JSON file', async () => {
      await repository.createCountdown({ date: '2026-12-24' });

      await actions.export();

      expect(files.download).toHaveBeenCalledTimes(1);
      const [text, fileName] = files.download.mock.calls[0];
      expect(fileName).toMatch(/^how-long-\d{4}-\d{2}-\d{2}\.json$/);
      expect(JSON.parse(text).countdowns).toMatchObject([{ date: '2026-12-24' }]);
    });
  });

  describe('importFile', () => {
    it('restores a valid backup in the confirmed mode', async () => {
      stubDialog('replace');

      await actions.importFile(jsonFile(backupJson));

      const [countdown] = await repository.listCountdowns();
      expect(countdown).toMatchObject({ date: '2026-12-24', description: 'Christmas' });
      expect(await repository.listAppointments(countdown.id!)).toHaveLength(1);
    });

    it('keeps existing data when the user picks "merge"', async () => {
      await repository.createCountdown({ date: '2030-01-01' });
      stubDialog('merge');

      await actions.importFile(jsonFile(backupJson));

      expect(await repository.listCountdowns()).toHaveLength(2);
    });

    it('writes nothing when the dialog is cancelled', async () => {
      stubDialog(undefined);

      await actions.importFile(jsonFile(backupJson));

      expect(await repository.listCountdowns()).toEqual([]);
    });

    it('reports a malformed file and never opens the dialog', async () => {
      const open = vi.spyOn(TestBed.inject(HlmDialogService), 'open');

      await actions.importFile(jsonFile('{ not json'));

      expect(open).not.toHaveBeenCalled();
      expect(notifications.error).toHaveBeenCalledWith(expect.stringContaining('not valid JSON'));
      expect(await repository.listCountdowns()).toEqual([]);
    });

    it('rejects a backup whose appointment is not before the target date', async () => {
      const broken = JSON.stringify({
        version: BACKUP_VERSION,
        countdowns: [
          {
            date: '2026-12-24',
            appointments: [
              { date: '2026-12-25', title: 'x', color: '#000000', icon: 'lucideFlag' },
            ],
          },
        ],
      });

      await actions.importFile(jsonFile(broken));

      expect(notifications.error).toHaveBeenCalledWith(
        expect.stringContaining('must be before the target date'),
      );
      expect(await repository.listCountdowns()).toEqual([]);
    });

    it('leaves the database untouched when the picker is cancelled', async () => {
      files.pick.mockResolvedValue(null);
      const open = vi.spyOn(TestBed.inject(HlmDialogService), 'open');

      await actions.importFromPicker();

      expect(open).not.toHaveBeenCalled();
    });
  });
});
