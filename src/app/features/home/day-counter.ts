import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * The headline of the start page: the remaining day count inside a circle.
 *
 * Takes the *signed* distance to the target date, so it can phrase the label
 * itself — a passed date counts upwards rather than showing a minus sign.
 */
@Component({
  selector: 'app-day-counter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="border-primary/20 bg-card mx-auto flex aspect-square w-full max-w-[min(17rem,45dvh)] flex-col items-center justify-center rounded-[50%] border-4"
    >
      <span
        class="font-extralight leading-none tabular-nums"
        [class]="sizeClass()"
        data-testid="day-count"
        >{{ count() }}</span
      >
      <span
        class="text-muted-foreground mt-2 text-xs tracking-widest uppercase"
        data-testid="day-label"
        >{{ label() }}</span
      >
    </div>
  `,
})
export class DayCounter {
  /** Days until the target date; negative once it has passed. */
  readonly days = input.required<number>();

  protected readonly count = computed(() => Math.abs(this.days()));

  protected readonly label = computed(() => {
    const days = this.days();
    if (days === 0) {
      return 'today';
    }
    if (days < 0) {
      return days === -1 ? 'day ago' : 'days ago';
    }
    return days === 1 ? 'day to go' : 'days to go';
  });

  /**
   * Steps the type down as the number grows, so four digits still fit inside the
   * circle instead of overflowing it.
   */
  protected readonly sizeClass = computed(() => {
    const digits = `${this.count()}`.length;
    if (digits <= 2) {
      return 'text-7xl';
    }
    return digits === 3 ? 'text-6xl' : 'text-5xl';
  });
}
