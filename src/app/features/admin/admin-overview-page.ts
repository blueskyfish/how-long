import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { CountdownRepository } from '../../core/data/countdown-repository';
import { Countdown } from '../../core/models';
import { daysUntil } from '../../core/services/date-utils';
import { ConfirmDialog, ConfirmDialogContext } from '../../shared/confirm-dialog';
import { openDialog } from '../../shared/dialog';
import { FileTransferService } from '../../shared/file-transfer.service';
import { NotificationService } from '../../shared/notification.service';
import { BackupActions } from './backup-actions';
import { CountdownDialog, CountdownDialogContext, CountdownDialogResult } from './countdown-dialog';

@Component({
  selector: 'app-admin-overview-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HlmButton, NgIcon, RouterLink],
  host: {
    '(dragover)': 'onDragOver($event)',
    '(dragleave)': 'onDragLeave($event)',
    '(drop)': 'onDrop($event)',
  },
  template: `
    <header
      class="bg-background/80 border-border sticky top-0 z-10 border-b px-safe-3 pt-safe-0 backdrop-blur"
    >
      <div class="flex h-14 items-center gap-2">
        <a hlmBtn variant="ghost" size="icon" routerLink="/" aria-label="Back to countdown">
          <ng-icon name="lucideArrowLeft" class="text-lg" />
        </a>
        <h1 class="text-base font-medium">Countdowns</h1>
        <span class="flex-1"></span>
        <button
          hlmBtn
          variant="ghost"
          size="icon"
          (click)="backups.export()"
          aria-label="Export as JSON"
        >
          <ng-icon name="lucideDownload" class="text-lg" />
        </button>
        <button
          hlmBtn
          variant="ghost"
          size="icon"
          (click)="backups.importFromPicker()"
          aria-label="Import from JSON"
        >
          <ng-icon name="lucideUpload" class="text-lg" />
        </button>
      </div>
    </header>

    <main class="mx-auto w-full max-w-2xl px-safe-4 pt-4 pb-safe-28">
      <ul class="m-0 flex list-none flex-col gap-2 p-0">
        @for (countdown of countdowns(); track countdown.id) {
          <li class="border-border bg-card flex items-center gap-2 rounded-xl border pr-2">
            <a
              class="hover:bg-accent/50 flex min-w-0 flex-1 items-center gap-3 rounded-l-xl px-4 py-3 transition-colors"
              [routerLink]="['/admin', countdown.id]"
            >
              <ng-icon name="lucideCalendar" class="text-muted-foreground shrink-0 text-lg" />
              <span class="min-w-0">
                <span class="block font-mono tabular-nums">{{ countdown.date }}</span>
                <span class="text-muted-foreground block truncate text-sm">
                  {{ remainingLabel(countdown) }}
                  @if (countdown.description) {
                    · {{ countdown.description }}
                  }
                </span>
              </span>
            </a>
            <button
              hlmBtn
              variant="ghost"
              size="icon"
              [attr.aria-label]="'Delete countdown ' + countdown.date"
              (click)="remove(countdown)"
            >
              <ng-icon name="lucideTrash2" class="text-lg" />
            </button>
          </li>
        } @empty {
          <li
            class="text-muted-foreground px-4 py-12 text-center text-sm"
            data-testid="empty-state"
          >
            No countdowns yet. Use the button below to add one, or drop a JSON backup onto this
            page.
          </li>
        }
      </ul>
    </main>

    @if (dragging()) {
      <div
        class="border-primary bg-background/90 pointer-events-none fixed top-safe-4 right-safe-4 bottom-safe-4 left-safe-4 z-20 flex items-center justify-center rounded-2xl border-2 border-dashed text-lg"
      >
        Drop a JSON backup to import
      </div>
    }

    <button
      hlmBtn
      size="icon-lg"
      class="fixed right-safe-6 bottom-safe-6 rounded-full shadow-lg"
      aria-label="New countdown"
      (click)="create()"
      data-testid="add-countdown"
    >
      <ng-icon name="lucidePlus" class="text-lg" />
    </button>
  `,
})
export class AdminOverviewPage {
  private readonly repository = inject(CountdownRepository);
  private readonly dialog = inject(HlmDialogService);
  protected readonly backups = inject(BackupActions);
  private readonly files = inject(FileTransferService);
  private readonly notifications = inject(NotificationService);

  private readonly today = new Date();

  protected readonly countdowns = toSignal(this.repository.watchCountdowns(), { initialValue: [] });
  protected readonly dragging = signal(false);

  protected remainingLabel(countdown: Countdown): string {
    const remaining = daysUntil(countdown.date, this.today);
    if (remaining === 0) {
      return 'today';
    }
    return remaining > 0 ? `in ${remaining} day(s)` : `${-remaining} day(s) ago`;
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
      title: 'Delete countdown?',
      message: `${countdown.date} and all of its appointments will be removed.`,
    });
    if (confirmed) {
      await this.repository.deleteCountdown(countdown.id!);
      this.notifications.success('Countdown deleted.');
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
