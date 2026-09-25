import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { of, switchMap } from 'rxjs';
import { CountdownRepository } from '../../core/data/countdown-repository';
import { daysUntil, toIsoDate } from '../../core/services/date-utils';
import { AppointmentList } from '../../shared/appointment-list';
import { openDialog } from '../../shared/dialog';
import { AllAppointmentsDialog, AllAppointmentsDialogContext } from './all-appointments-dialog';

/** Number of appointments shown before the "more" overlay is offered. */
const PREVIEW_COUNT = 5;

@Component({
  selector: 'app-home-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppointmentList, HlmButton, NgIcon, RouterLink],
  template: `
    <main
      class="mx-auto flex min-h-dvh w-full max-w-md flex-col px-safe-6 pt-safe-16 pb-safe-28 text-center"
    >
      @if (countdown(); as active) {
        <p
          class="text-8xl leading-none font-extralight tracking-tight tabular-nums"
          data-testid="day-count"
        >
          {{ dayCount() }}
        </p>
        <p
          class="text-muted-foreground mt-2 text-sm tracking-widest uppercase"
          data-testid="day-label"
        >
          {{ dayLabel() }}
        </p>
        <p class="mt-6 font-mono text-xl tabular-nums" data-testid="target-date">
          {{ active.date }}
        </p>
        @if (active.description) {
          <p class="text-muted-foreground mt-1 text-sm" data-testid="description">
            {{ active.description }}
          </p>
        }

        <section class="mt-10 text-left">
          <app-appointment-list [appointments]="preview()" emptyLabel="No appointments ahead." />
          @if (hasMore()) {
            <div class="mt-2 text-center">
              <button
                hlmBtn
                variant="ghost"
                size="sm"
                (click)="showAll()"
                data-testid="more-button"
              >
                More ({{ appointments().length }})
              </button>
            </div>
          }
        </section>
      } @else {
        <div class="mt-24 flex flex-col items-center gap-4">
          <ng-icon name="lucideHourglass" class="text-muted-foreground text-5xl" />
          <p class="text-muted-foreground text-lg" data-testid="empty-state">
            No countdown configured yet.
          </p>
          <a hlmBtn routerLink="/admin">Create one</a>
        </div>
      }
    </main>

    <a
      hlmBtn
      size="icon-lg"
      routerLink="/admin"
      aria-label="Administration"
      class="fixed right-safe-6 bottom-safe-6 rounded-full shadow-lg"
      data-testid="admin-fab"
    >
      <ng-icon name="lucideSettings" class="text-lg" />
    </a>
  `,
})
export class HomePage {
  private readonly repository = inject(CountdownRepository);
  private readonly dialog = inject(HlmDialogService);

  /** Captured once so the rendered day count stays stable while the page is open. */
  private readonly today = new Date();

  protected readonly countdown = toSignal(this.repository.watchNextCountdown(this.today), {
    initialValue: undefined,
  });

  /** Re-queried whenever the active countdown changes. */
  protected readonly appointments = toSignal(
    toObservable(this.countdown).pipe(
      switchMap((active) =>
        active?.id === undefined ? of([]) : this.repository.watchAppointments(active.id),
      ),
    ),
    { initialValue: [] },
  );

  protected readonly dayCount = computed(() => {
    const active = this.countdown();
    return active ? Math.abs(daysUntil(active.date, this.today)) : 0;
  });

  protected readonly dayLabel = computed(() => {
    const active = this.countdown();
    if (!active) {
      return '';
    }
    const remaining = daysUntil(active.date, this.today);
    if (remaining === 0) {
      return 'today';
    }
    if (remaining < 0) {
      return remaining === -1 ? 'day ago' : 'days ago';
    }
    return remaining === 1 ? 'day to go' : 'days to go';
  });

  /** Only appointments that are still ahead, capped at {@link PREVIEW_COUNT}. */
  protected readonly upcoming = computed(() => {
    const isoToday = toIsoDate(this.today);
    return this.appointments().filter((appointment) => appointment.date >= isoToday);
  });

  protected readonly preview = computed(() => this.upcoming().slice(0, PREVIEW_COUNT));

  protected readonly hasMore = computed(() => this.appointments().length > this.preview().length);

  protected showAll(): void {
    const active = this.countdown();
    if (!active) {
      return;
    }
    openDialog<void, AllAppointmentsDialogContext>(this.dialog, AllAppointmentsDialog, {
      targetDate: active.date,
      appointments: this.appointments(),
    });
  }
}
