import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { filter, fromEvent, merge, of, switchMap } from 'rxjs';
import { CountdownRepository } from '../../core/data/countdown-repository';
import { Countdown } from '../../core/models';
import { daysUntil, toIsoDate } from '../../core/services/date-utils';
import { pickNextCountdown } from '../../core/services/next-countdown';
import { AppointmentList } from '../../shared/appointment-list';
import { openDialog } from '../../shared/dialog';
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
  template: `
    <!--
      Follows the finger down from under the top edge while the page is pulled,
      turning with it, and slides back once released. The resting state (hidden,
      pushed above the edge) is static markup rather than a binding: with
      zoneless change detection a freshly inserted page is painted once before
      its first binding pass, and a binding-only rest state flashed the
      indicator when coming back from the administration.
    -->
    <div
      class="top-safe-0 pointer-events-none fixed inset-x-0 z-10 flex -translate-y-12 justify-center opacity-0 transition-[translate,opacity] duration-300 data-pulling:opacity-100"
      [attr.data-pulling]="pull.distance() > 0 ? '' : null"
      [style.transition]="pull.distance() === 0 ? null : 'none'"
      [style.translate]="pull.distance() > 0 ? '0 ' + (pull.distance() - 48) + 'px' : null"
      aria-hidden="true"
      data-testid="pull-indicator"
    >
      <span
        class="bg-card text-primary flex size-10 items-center justify-center rounded-full border shadow-md transition-opacity"
        [class.opacity-50]="!pull.armed()"
      >
        <ng-icon
          name="lucideRefreshCw"
          class="text-lg"
          [style.transform]="'rotate(' + pullRotation() + 'deg)'"
        />
      </span>
    </div>

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
          <app-day-counter
            [days]="daysRemaining()"
            [urgent]="urgent()"
            (dblclick)="refresh()"
            [attr.title]="'home.refreshHint' | translate"
          />

          <div class="landscape-phone:mt-3 mt-6 flex justify-center">
            <app-countdown-picker
              [countdowns]="countdowns()"
              [selected]="countdown"
              (selectedChange)="select($event)"
            />
          </div>
          @if (countdown.description) {
            <p class="text-muted-foreground mt-1 text-base wrap-anywhere" data-testid="description">
              {{ countdown.description }}
            </p>
          }
        </div>

        <section
          class="landscape-phone:mt-0 landscape-phone:min-w-0 landscape-phone:flex-1 landscape-phone:max-h-[80dvh] landscape-phone:overflow-y-auto mt-10 text-left"
        >
          <app-appointment-list
            [appointments]="preview()"
            [emptyLabel]="'home.noAppointmentsAhead' | translate"
          />
          @if (hasMore()) {
            <div class="mt-2 text-center">
              <button
                hlmBtn
                variant="ghost"
                size="sm"
                (click)="showAll()"
                data-testid="more-button"
              >
                {{ 'home.more' | translate: { count: appointments().length } }}
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
            {{ 'home.emptyState' | translate }}
          </p>
          <a hlmBtn routerLink="/admin">{{ 'home.createOne' | translate }}</a>
        </div>
      }
    </main>

    <a
      hlmBtn
      size="icon-lg"
      routerLink="/admin"
      [attr.aria-label]="'home.admin' | translate"
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
  private readonly document = inject(DOCUMENT);
  private readonly dayCounter = viewChild(DayCounter);
  protected readonly pull = inject(PullToRefresh);

  /**
   * Held still while the page is open, so the day count does not jump under the
   * user's eyes; moved on by {@link refresh}. Everything that depends on the
   * date follows, since the data itself is already live.
   */
  private readonly today = signal(new Date());

  /** One full turn of the indicator at the threshold. */
  protected readonly pullRotation = computed(
    () => (this.pull.distance() / PULL_THRESHOLD_PX) * 360,
  );

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
    return countdown && daysUntil(countdown.date, this.today()) >= 0 ? countdown : undefined;
  });

  protected readonly active = computed(
    () =>
      this.fromUrl() ??
      this.rememberedAhead() ??
      pickNextCountdown(this.countdowns(), this.today()),
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
    return countdown ? daysUntil(countdown.date, this.today()) : 0;
  });

  /** The target date is at most {@link URGENT_WITHIN_DAYS} days away and not yet passed. */
  protected readonly urgent = computed(() => {
    const days = this.daysRemaining();
    return this.active() !== undefined && days >= 0 && days <= URGENT_WITHIN_DAYS;
  });

  /** Only appointments that are still ahead, capped at {@link PREVIEW_COUNT}. */
  protected readonly upcoming = computed(() => {
    const isoToday = toIsoDate(this.today());
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

    // A home-screen app is resumed rather than reloaded, possibly days later,
    // and a restored page (back-forward cache) comes back as it was left.
    merge(
      fromEvent(this.document, 'visibilitychange').pipe(
        filter(() => this.document.visibilityState === 'visible'),
      ),
      fromEvent<PageTransitionEvent>(this.document.defaultView ?? this.document, 'pageshow').pipe(
        filter((event) => event.persisted),
      ),
    )
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.today.set(new Date()));
  }

  /** Recounts from the current date and acknowledges it with a pulse of the counter. */
  protected refresh(): void {
    this.today.set(new Date());
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
}
