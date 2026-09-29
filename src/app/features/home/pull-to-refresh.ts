import { DOCUMENT, DestroyRef, Directive, computed, inject, output, signal } from '@angular/core';

/** How far, after resistance, a pull has to travel before letting go refreshes. */
export const PULL_THRESHOLD_PX = 64;

/** The indicator stops following the finger here. */
const MAX_PULL_PX = 96;

/** The page moves at half the finger's speed, which is what makes it feel like a pull. */
const RESISTANCE = 0.5;

/**
 * Pull-to-refresh for a page that scrolls with the document: one finger dragged
 * down while the page is scrolled to the top. Only reports the gesture — the
 * host decides what refreshing means and renders an indicator from
 * {@link distance}.
 *
 * Listens passively, so scrolling is never held up. While the directive is
 * alive the browser's own pull-to-refresh (Chrome on Android, which reloads
 * the whole app) is switched off, so the two cannot fire together.
 */
@Directive({
  selector: '[appPullToRefresh]',
  host: {
    '(touchstart)': 'start($event)',
    '(touchmove)': 'move($event)',
    '(touchend)': 'end()',
    '(touchcancel)': 'cancel()',
  },
})
export class PullToRefresh {
  /** Emitted when a pull is released past {@link PULL_THRESHOLD_PX}. */
  readonly refresh = output<void>();

  /** The current pull, already damped; 0 while no pull is in progress. */
  readonly distance = signal(0);

  /** Letting go now would refresh. */
  readonly armed = computed(() => this.distance() >= PULL_THRESHOLD_PX);

  private readonly document = inject(DOCUMENT);
  private origin?: { x: number; y: number };

  constructor() {
    const root = this.document.documentElement;
    const previous = root.style.overscrollBehaviorY;
    root.style.overscrollBehaviorY = 'contain';
    inject(DestroyRef).onDestroy(() => (root.style.overscrollBehaviorY = previous));
  }

  protected start(event: TouchEvent): void {
    // A second finger turns the gesture into a pinch, which is never a pull.
    if (event.touches.length !== 1 || this.scrollTop() > 0) {
      this.cancel();
      return;
    }
    const { clientX: x, clientY: y } = event.touches[0];
    this.origin = { x, y };
  }

  protected move(event: TouchEvent): void {
    if (!this.origin) {
      return;
    }
    if (event.touches.length !== 1) {
      this.cancel();
      return;
    }
    const { clientX, clientY } = event.touches[0];
    const dx = clientX - this.origin.x;
    const dy = clientY - this.origin.y;
    // Sideways or upwards is someone scrolling or swiping, not pulling.
    if (dy <= 0 || Math.abs(dx) > dy) {
      this.distance.set(0);
      return;
    }
    this.distance.set(Math.min(dy * RESISTANCE, MAX_PULL_PX));
  }

  protected end(): void {
    const armed = this.armed();
    this.cancel();
    if (armed) {
      this.refresh.emit();
    }
  }

  protected cancel(): void {
    this.origin = undefined;
    this.distance.set(0);
  }

  private scrollTop(): number {
    return this.document.defaultView?.scrollY ?? 0;
  }
}
