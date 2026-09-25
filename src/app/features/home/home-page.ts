import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { of, switchMap } from 'rxjs';
import { CountdownRepository } from '../../core/data/countdown-repository';
import { Countdown } from '../../core/models';
import { daysUntil, toIsoDate } from '../../core/services/date-utils';
import { pickNextCountdown } from '../../core/services/next-countdown';
import { AppointmentList } from '../../shared/appointment-list';
import { openDialog } from '../../shared/dialog';
import { AllAppointmentsDialog, AllAppointmentsDialogContext } from './all-appointments-dialog';
import { CountdownPicker } from './countdown-picker';
import { DayCounter } from './day-counter';
import { RememberedCountdown } from './remembered-countdown';

/** Number of appointments shown before the "more" overlay is offered. */
const PREVIEW_COUNT = 5;

/** From this many days before the target date, and on the day itself, the page turns red. */
const URGENT_WITHIN_DAYS = 3;

@Component({
  selector: 'app-home-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppointmentList, CountdownPicker, DayCounter, HlmButton, NgIcon, RouterLink],
  host: {
    // On the host rather than <main>, so the tint spans the whole viewport, notch included.
    class: 'data-urgent:bg-destructive/10 block min-h-dvh transition-colors duration-700',
    '[attr.data-urgent]': "urgent() ? '' : null",
  },
  template: `
    <!--
      Sideways on a phone there is no vertical room to stack, so the two blocks
      sit side by side: the counter on the right, the appointments on the left.
      Reversing the row achieves that without moving the counter out of first
      place in the DOM, where it belongs on every other screen. The bottom
      padding keeps a long, wrapped description clear of the floating button.
    -->
    <main
      class="px-safe-6 pt-safe-16 pb-safe-28 landscape-phone:pt-safe-4 landscape-phone:pb-safe-16 landscape-phone:max-w-3xl landscape-phone:flex-row-reverse landscape-phone:items-center landscape-phone:gap-6 mx-auto flex min-h-dvh w-full max-w-md flex-col text-center"
    >
      @if (active(); as countdown) {
        <div class="landscape-phone:min-w-0 landscape-phone:flex-1">
          <app-day-counter [days]="daysRemaining()" [urgent]="urgent()" />

          <div class="landscape-phone:mt-3 mt-6 flex justify-center">
            <app-countdown-picker
              [countdowns]="countdowns()"
              [selected]="countdown"
              (selectedChange)="select($event)"
            />
          </div>
          @if (countdown.description) {
            <p class="text-muted-foreground mt-1 text-sm wrap-anywhere" data-testid="description">
              {{ countdown.description }}
            </p>
          }
        </div>

        <section
          class="landscape-phone:mt-0 landscape-phone:min-w-0 landscape-phone:flex-1 landscape-phone:max-h-[80dvh] landscape-phone:overflow-y-auto mt-10 text-left"
        >
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
        <div
          class="landscape-phone:mt-0 landscape-phone:flex-1 mt-24 flex flex-col items-center gap-4"
        >
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
      class="right-safe-6 bottom-safe-6 fixed rounded-full shadow-lg"
      data-testid="admin-fab"
    >
      <ng-icon name="lucideSettings" class="text-lg" />
    </a>
  `,
})
export class HomePage {
  /**
   * Bound from the `countdown` query parameter, so the pick survives a reload and
   * the back button steps through it. Unset — or pointing at a countdown that has
   * since been deleted — falls back to the remembered pick, then the next one due.
   */
  readonly countdown = input<string>();

  private readonly repository = inject(CountdownRepository);
  private readonly dialog = inject(HlmDialogService);
  private readonly router = inject(Router);
  private readonly remembered = inject(RememberedCountdown);

  /** Captured once so the rendered day count stays stable while the page is open. */
  private readonly today = new Date();

  protected readonly countdowns = toSignal(this.repository.watchCountdowns(), { initialValue: [] });

  /** The countdown named by the query parameter, if it still exists. */
  private readonly fromUrl = computed(() =>
    this.countdowns().find((countdown) => `${countdown.id}` === this.countdown()),
  );

  /**
   * The countdown remembered from an earlier pick, as long as its date has not
   * passed — the target day itself still counts. Once it has, the page moves on
   * to the next one due rather than counting upwards.
   */
  private readonly rememberedAhead = computed(() => {
    const countdown = this.countdowns().find(({ id }) => id === this.remembered.id());
    return countdown && daysUntil(countdown.date, this.today) >= 0 ? countdown : undefined;
  });

  protected readonly active = computed(
    () =>
      this.fromUrl() ?? this.rememberedAhead() ?? pickNextCountdown(this.countdowns(), this.today),
  );

  /** Re-queried whenever the shown countdown changes. */
  protected readonly appointments = toSignal(
    toObservable(this.active).pipe(
      switchMap((countdown) =>
        countdown?.id === undefined ? of([]) : this.repository.watchAppointments(countdown.id),
      ),
    ),
    { initialValue: [] },
  );

  /** Signed: negative once the target date has passed. */
  protected readonly daysRemaining = computed(() => {
    const countdown = this.active();
    return countdown ? daysUntil(countdown.date, this.today) : 0;
  });

  /** The target date is at most {@link URGENT_WITHIN_DAYS} days away and not yet passed. */
  protected readonly urgent = computed(() => {
    const days = this.daysRemaining();
    return this.active() !== undefined && days >= 0 && days <= URGENT_WITHIN_DAYS;
  });

  /** Only appointments that are still ahead, capped at {@link PREVIEW_COUNT}. */
  protected readonly upcoming = computed(() => {
    const isoToday = toIsoDate(this.today);
    return this.appointments().filter((appointment) => appointment.date >= isoToday);
  });

  protected readonly preview = computed(() => this.upcoming().slice(0, PREVIEW_COUNT));

  protected readonly hasMore = computed(() => this.appointments().length > this.preview().length);

  constructor() {
    // A pick always passes through the URL, so this also covers the dropdown.
    effect(() => {
      const id = this.fromUrl()?.id;
      if (id !== undefined) {
        this.remembered.remember(id);
      }
    });
  }

  protected select(countdown: Countdown): void {
    this.router.navigate([], { queryParams: { countdown: countdown.id } });
  }

  protected showAll(): void {
    const countdown = this.active();
    if (!countdown) {
      return;
    }
    openDialog<void, AllAppointmentsDialogContext>(this.dialog, AllAppointmentsDialog, {
      targetDate: countdown.date,
      appointments: this.appointments(),
    });
  }
}
