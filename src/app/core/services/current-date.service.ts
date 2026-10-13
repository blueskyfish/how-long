import { DestroyRef, DOCUMENT, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, fromEvent, merge } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CurrentDateService {
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly current = signal(new Date());
  readonly today = this.current.asReadonly();

  private midnightTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    merge(
      fromEvent(this.document, 'visibilitychange').pipe(
        filter(() => this.document.visibilityState === 'visible'),
      ),
      fromEvent<PageTransitionEvent>(this.document.defaultView ?? this.document, 'pageshow').pipe(
        filter((event) => event.persisted),
      ),
    )
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.refresh());

    this.scheduleMidnightRefresh();
    this.destroyRef.onDestroy(() => clearTimeout(this.midnightTimer));
  }

  refresh(): void {
    this.current.set(new Date());
    this.scheduleMidnightRefresh();
  }

  private scheduleMidnightRefresh(): void {
    clearTimeout(this.midnightTimer);
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    this.midnightTimer = setTimeout(() => this.refresh(), midnight.getTime() - now.getTime());
  }
}
