import { Injectable, inject } from '@angular/core';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { CountdownRepository } from '../../core/data/countdown-repository';
import { BackupService, RestoreMode } from '../../core/services/backup.service';
import { openDialog } from '../../shared/dialog';
import { FileTransferService } from '../../shared/file-transfer.service';
import { NotificationService } from '../../shared/notification.service';
import { ImportDialog, ImportDialogContext } from './import-dialog';

/**
 * Glue between the backup service and the admin UI: turns a file into a restore,
 * and reports the outcome as a toast.
 */
@Injectable({ providedIn: 'root' })
export class BackupActions {
  private readonly backups = inject(BackupService);
  private readonly repository = inject(CountdownRepository);
  private readonly dialog = inject(HlmDialogService);
  private readonly files = inject(FileTransferService);
  private readonly notifications = inject(NotificationService);

  /** Downloads the whole database as a JSON file. */
  async export(): Promise<void> {
    const backup = await this.backups.createBackup();
    this.files.download(this.backups.toJson(backup), this.backups.fileName(backup));
    this.notifications.success(`Exported ${backup.countdowns.length} countdown(s).`);
  }

  /** Opens the file picker and imports the chosen file. */
  async importFromPicker(): Promise<void> {
    const file = await this.files.pick();
    if (file) {
      await this.importFile(file);
    }
  }

  /** Validates a dropped or picked file, confirms the mode, then restores it. */
  async importFile(file: File): Promise<void> {
    let backup;
    try {
      backup = this.backups.parse(await file.text());
    } catch (error) {
      this.notifications.error(`Import failed: ${(error as Error).message}`);
      return;
    }

    const existingCountdowns = (await this.repository.listCountdowns()).length;
    const mode = await openDialog<RestoreMode, ImportDialogContext>(this.dialog, ImportDialog, {
      backup,
      existingCountdowns,
    });

    if (!mode) {
      return;
    }

    try {
      const result = await this.backups.restore(backup, mode);
      this.notifications.success(
        `Imported ${result.countdowns} countdown(s) and ${result.appointments} appointment(s).`,
      );
    } catch (error) {
      this.notifications.error(`Import failed: ${(error as Error).message}`);
    }
  }
}
