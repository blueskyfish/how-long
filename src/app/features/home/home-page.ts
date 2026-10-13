import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  Resource,
  viewChild,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { of, switchMap } from 'rxjs';
import { APP_VERSION } from '../../core/app-info';
import { CountdownRepository } from '../../core/data/countdown-repository';
import { Countdown } from '../../core/models';
import { CurrentDateService } from '../../core/services/current-date.service';
import { daysUntil, toIsoDate } from '../../core/services/date-utils';
import { pickNextCountdown } from '../../core/services/next-countdown';
import { AppointmentList } from '../../shared/appointment-list';
import { openDialog } from '../../shared/dialog';
import { AboutDialog } from './about-dialog';
import { AllAppointmentsDialog, AllAppointmentsDialogContext } from './all-appointments-dialog';
import { CountdownPicker } from './countdown-picker';
import { DayCounter } from './day-counter';
import { PULL_THRESHOLD_PX, PullToRefresh } from './pull-to-refresh';
import { RememberedCountdown } from './remembered-countdown';

/** Number of appointments shown before the "more" overlay is offered. */
const PREVIEW_COUNT = 5;

/** From this many days before the target date, and on the day itself, the page turns red. */
const URGENT_WITHIN_DAYS = 3;

@Component({
  selector: 'app-home-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AppointmentList,
    CountdownPicker,
    DayCounter,
    HlmButton,
    NgIcon,
    RouterLink,
    TranslatePipe,
  ],
  hostDirectives: [PullToRefresh],
  host: {
    // On the host rather than <main>, so the tint spans the whole viewport, notch included.
    class: 'data-urgent:bg-destructive/10 block min-h-dvh transition-colors duration-700',
    '[attr.data-urgent]': "urgent() ? '' : null",
  },
  templateUrl: './home-page.html',
})
export class HomePage {
  protected readonly appVersion = APP_VERSION;

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
  private readonly currentDate = inject(CurrentDateService);
  private readonly dayCounter = viewChild(DayCounter);
  protected readonly pull = inject(PullToRefresh);
  readonly countdownsResource = input<Resource<Countdown[]>>();

  protected readonly todayDate = computed(() => toIsoDate(this.currentDate.today()));

  /** One full turn of the indicator at the threshold. */
  protected readonly pullRotation = computed(
    () => (this.pull.distance() / PULL_THRESHOLD_PX) * 360,
  );

  protected readonly countdowns = computed(() => this.countdownsResource()?.value() ?? []);

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
    return countdown && daysUntil(countdown.date, this.currentDate.today()) >= 0
      ? countdown
      : undefined;
  });

  protected readonly active = computed(
    () =>
      this.fromUrl() ??
      this.rememberedAhead() ??
      pickNextCountdown(this.countdowns(), this.currentDate.today()),
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
    return countdown ? daysUntil(countdown.date, this.currentDate.today()) : 0;
  });

  /** The target date is at most {@link URGENT_WITHIN_DAYS} days away and not yet passed. */
  protected readonly urgent = computed(() => {
    const days = this.daysRemaining();
    return this.active() !== undefined && days >= 0 && days <= URGENT_WITHIN_DAYS;
  });

  /** Only appointments that are still ahead, capped at {@link PREVIEW_COUNT}. */
  protected readonly upcoming = computed(() => {
    const isoToday = toIsoDate(this.currentDate.today());
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

    // Asked for: pulled down on a phone or the counter double-clicked.
    this.pull.refresh.subscribe(() => this.refresh());
  }

  /** Recounts from the current date and acknowledges it with a pulse of the counter. */
  protected refresh(): void {
    this.currentDate.refresh();
    this.dayCounter()?.pulse();
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

  protected showAbout(): void {
    openDialog<void, Record<string, never>>(
      this.dialog,
      AboutDialog,
      {},
      { showCloseButton: false },
    );
  }
}
