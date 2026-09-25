import { Injectable } from '@angular/core';
import { AppointmentIconGroup } from '../../shared/appointment-style';

/**
 * The icon group last used while adding appointments to a countdown, so the next
 * new appointment opens the picker on it. Scoped to one countdown: opening another
 * one drops it, and the next appointment there starts on the first group again.
 * Kept in memory only; a reload starts afresh.
 */
@Injectable({ providedIn: 'root' })
export class RememberedIconGroup {
  private remembered?: { countdownId: number; group: AppointmentIconGroup };

  /** Call when a countdown's page opens; forgets a group kept for another countdown. */
  enter(countdownId: number): void {
    if (this.remembered?.countdownId !== countdownId) {
      this.remembered = undefined;
    }
  }

  groupFor(countdownId: number): AppointmentIconGroup | undefined {
    return this.remembered?.countdownId === countdownId ? this.remembered.group : undefined;
  }

  remember(countdownId: number, group: AppointmentIconGroup): void {
    this.remembered = { countdownId, group };
  }
}
