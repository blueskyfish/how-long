import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { CountdownRepository } from '../../core/data/countdown-repository';
import { LanguageService } from '../../core/i18n/language.service';
import { LocalDatePipe } from '../../core/i18n/local-date.pipe';
import { Countdown } from '../../core/models';
import { daysUntil } from '../../core/services/date-utils';
import { ConfirmDialog, ConfirmDialogContext } from '../../shared/confirm-dialog';
import { openDialog } from '../../shared/dialog';
import { FileTransferService } from '../../shared/file-transfer.service';
import { LanguageSwitch } from '../../shared/language-switch';
import { NotificationService } from '../../shared/notification.service';
import { BackupActions } from './backup-actions';
import { CountdownDialog, CountdownDialogContext, CountdownDialogResult } from './countdown-dialog';

@Component({
  selector: 'app-admin-overview-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HlmButton, LanguageSwitch, LocalDatePipe, NgIcon, RouterLink, TranslatePipe],
  host: {
    '(dragover)': 'onDragOver($event)',
    '(dragleave)': 'onDragLeave($event)',
    '(drop)': 'onDrop($event)',
  },
  templateUrl: './admin-overview-page.html',
})
export class AdminOverviewPage {
  private readonly repository = inject(CountdownRepository);
  private readonly dialog = inject(HlmDialogService);
  protected readonly backups = inject(BackupActions);
  private readonly files = inject(FileTransferService);
  private readonly notifications = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);

  private readonly today = new Date();

  protected readonly countdowns = toSignal(this.repository.watchCountdowns(), { initialValue: [] });
  protected readonly dragging = signal(false);

  /** Which text says how far off a countdown is, and the number it needs. */
  protected remainingIn(countdown: Countdown): { key: string; count: number } {
    const remaining = daysUntil(countdown.date, this.today);
    if (remaining === 0) {
      return { key: 'counter.today', count: 0 };
    }
    return remaining > 0
      ? { key: 'admin.overview.inDays', count: remaining }
      : { key: 'admin.overview.daysAgo', count: -remaining };
  }

  protected async create(): Promise<void> {
    const result = await openDialog<CountdownDialogResult, CountdownDialogContext>(
      this.dialog,
      CountdownDialog,
      {},
    );
    if (result) {
      await this.repository.createCountdown(result);
    }
  }

  protected async remove(countdown: Countdown): Promise<void> {
    const confirmed = await openDialog<boolean, ConfirmDialogContext>(this.dialog, ConfirmDialog, {
      title: this.translate.instant('admin.overview.deleteTitle'),
      message: this.translate.instant('admin.overview.deleteMessage', {
        date: this.language.formatDate(countdown.date),
      }),
    });
    if (confirmed) {
      await this.repository.deleteCountdown(countdown.id!);
      this.notifications.success(this.translate.instant('admin.overview.deleted'));
    }
  }

  protected onDragOver(event: DragEvent): void {
    if (event.dataTransfer?.types.includes('Files')) {
      event.preventDefault();
      this.dragging.set(true);
    }
  }

  protected onDragLeave(event: DragEvent): void {
    if (!event.relatedTarget) {
      this.dragging.set(false);
    }
  }

  protected async onDrop(event: DragEvent): Promise<void> {
    if (!this.dragging()) {
      return;
    }
    event.preventDefault();
    this.dragging.set(false);
    const file = this.files.fromDropEvent(event);
    if (file) {
      await this.backups.importFile(file);
    }
  }
}
