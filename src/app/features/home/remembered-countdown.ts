import { Injectable, InjectionToken, inject, signal } from '@angular/core';

/**
 * Where the pick is kept: a per-device preference, so it lives beside the data
 * rather than in it, and stays out of backups. `null` when the browser refuses
 * access to storage, in which case the pick is simply not remembered.
 */
export const COUNTDOWN_STORAGE = new InjectionToken<Storage | null>('COUNTDOWN_STORAGE', {
  providedIn: 'root',
  factory: () => {
    try {
      return globalThis.localStorage ?? null;
    } catch {
      return null;
    }
  },
});

const STORAGE_KEY = 'how-long.selected-countdown';

/**
 * The countdown last shown on the start page by an explicit pick. It outlives the
 * query parameter, so reopening the app — from the home screen, say — shows the
 * same countdown again instead of falling back to the next one due.
 */
@Injectable({ providedIn: 'root' })
export class RememberedCountdown {
  private readonly storage = inject(COUNTDOWN_STORAGE);
  private readonly stored = signal(this.read());

  /** Id of the remembered countdown; it may since have been deleted. */
  readonly id = this.stored.asReadonly();

  remember(id: number): void {
    if (this.stored() === id) {
      return;
    }
    this.stored.set(id);
    try {
      this.storage?.setItem(STORAGE_KEY, String(id));
    } catch {
      // Full or blocked storage: the pick still holds until the page is closed.
    }
  }

  private read(): number | undefined {
    try {
      const raw = this.storage?.getItem(STORAGE_KEY);
      const id = Number(raw);
      return raw && Number.isInteger(id) ? id : undefined;
    } catch {
      return undefined;
    }
  }
}
