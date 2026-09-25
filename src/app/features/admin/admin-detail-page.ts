import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { of, switchMap } from 'rxjs';
import { CountdownRepository } from '../../core/data/countdown-repository';
import { Appointment } from '../../core/models';
import { ConfirmDialog, ConfirmDialogContext } from '../../shared/confirm-dialog';
import { openDialog } from '../../shared/dialog';
import { NotificationService } from '../../shared/notification.service';
import {
  AppointmentDialog,
  AppointmentDialogContext,
  AppointmentDialogResult,
} from './appointment-dialog';
import { CountdownDialog, CountdownDialogContext, CountdownDialogResult } from './countdown-dialog';

@Component({
  selector: 'app-admin-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HlmButton, NgIcon, RouterLink],
  template: `
    <header
      class="bg-background/80 border-border sticky top-0 z-10 flex h-14 items-center gap-2 border-b px-3 backdrop-blur"
    >
      <a hlmBtn variant="ghost" size="icon" routerLink="/admin" aria-label="Back to overview">
        <ng-icon name="lucideArrowLeft" class="text-lg" />
      </a>
      <h1 class="font-mono text-base tabular-nums" data-testid="target-date">
        {{ countdown()?.date ?? '…' }}
      </h1>
      <span class="flex-1"></span>
      @if (countdown()) {
        <button
          hlmBtn
          variant="ghost"
          size="icon"
          (click)="editCountdown()"
          aria-label="Edit countdown"
        >
          <ng-icon name="lucidePencil" class="text-lg" />
        </button>
      }
    </header>

    <main class="mx-auto w-full max-w-2xl px-4 pt-4 pb-28">
      @if (countdown(); as active) {
        @if (active.description) {
          <p class="text-muted-foreground px-1 pb-3 text-sm">{{ active.description }}</p>
        }

        <ul class="m-0 flex list-none flex-col gap-2 p-0">
          @for (appointment of appointments(); track appointment.id) {
            <li class="border-border bg-card flex items-center gap-3 rounded-xl border px-4 py-3">
              <ng-icon
                [name]="appointment.icon"
                [style.color]="appointment.color"
                class="text-lg"
                aria-hidden="true"
              />
              <span class="min-w-0 flex-1">
                <span class="block truncate">{{ appointment.title }}</span>
                <span class="text-muted-foreground block font-mono text-sm tabular-nums">
                  {{ appointment.date }}
                </span>
              </span>
              <button
                hlmBtn
                variant="ghost"
                size="icon"
                [attr.aria-label]="'Edit ' + appointment.title"
                (click)="editAppointment(appointment)"
              >
                <ng-icon name="lucidePencil" class="text-lg" />
              </button>
              <button
                hlmBtn
                variant="ghost"
                size="icon"
                [attr.aria-label]="'Delete ' + appointment.title"
                (click)="deleteAppointment(appointment)"
              >
                <ng-icon name="lucideTrash2" class="text-lg" />
              </button>
            </li>
          } @empty {
            <li
              class="text-muted-foreground px-4 py-12 text-center text-sm"
              data-testid="empty-state"
            >
              No appointments yet.
            </li>
          }
        </ul>
      } @else {
        <p class="text-muted-foreground px-4 py-12 text-center text-sm" data-testid="not-found">
          This countdown no longer exists.
        </p>
      }
    </main>

    @if (countdown()) {
      <button
        hlmBtn
        size="icon-lg"
        class="fixed right-6 bottom-6 rounded-full shadow-lg"
        aria-label="New appointment"
        (click)="createAppointment()"
        data-testid="add-appointment"
      >
        <ng-icon name="lucidePlus" class="text-lg" />
      </button>
    }
  `,
})
export class AdminDetailPage {
  /** Bound from the `admin/:id` route parameter. */
  readonly id = input.required<string>();

  private readonly repository = inject(CountdownRepository);
  private readonly dialog = inject(HlmDialogService);
  private readonly notifications = inject(NotificationService);

  private readonly countdownId = computed(() => Number(this.id()));

  protected readonly countdown = toSignal(
    toObservable(this.countdownId).pipe(
      switchMap((id) =>
        Number.isInteger(id) ? this.repository.watchCountdown(id) : of(undefined),
      ),
    ),
    { initialValue: undefined },
  );

  protected readonly appointments = toSignal(
    toObservable(this.countdownId).pipe(
      switchMap((id) => (Number.isInteger(id) ? this.repository.watchAppointments(id) : of([]))),
    ),
    { initialValue: [] },
  );

  protected async editCountdown(): Promise<void> {
    const active = this.countdown();
    if (!active) {
      return;
    }
    const result = await openDialog<CountdownDialogResult, CountdownDialogContext>(
      this.dialog,
      CountdownDialog,
      { countdown: active },
    );
    if (result) {
      await this.run(() => this.repository.updateCountdown(active.id!, result));
    }
  }

  protected async createAppointment(): Promise<void> {
    const active = this.countdown();
    if (!active) {
      return;
    }
    const result = await openDialog<AppointmentDialogResult, AppointmentDialogContext>(
      this.dialog,
      AppointmentDialog,
      { targetDate: active.date },
    );
    if (result) {
      await this.run(() =>
        this.repository.createAppointment({ ...result, countdownId: active.id! }),
      );
    }
  }

  protected async editAppointment(appointment: Appointment): Promise<void> {
    const active = this.countdown();
    if (!active) {
      return;
    }
    const result = await openDialog<AppointmentDialogResult, AppointmentDialogContext>(
      this.dialog,
      AppointmentDialog,
      { targetDate: active.date, appointment },
    );
    if (result) {
      await this.run(() => this.repository.updateAppointment(appointment.id!, result));
    }
  }

  protected async deleteAppointment(appointment: Appointment): Promise<void> {
    const confirmed = await openDialog<boolean, ConfirmDialogContext>(this.dialog, ConfirmDialog, {
      title: 'Delete appointment?',
      message: `"${appointment.title}" will be removed.`,
    });
    if (confirmed) {
      await this.repository.deleteAppointment(appointment.id!);
      this.notifications.success('Appointment deleted.');
    }
  }

  /** Surfaces repository invariant violations to the user instead of swallowing them. */
  private async run(action: () => Promise<unknown>): Promise<void> {
    try {
      await action();
    } catch (error) {
      this.notifications.error((error as Error).message);
    }
  }
}
