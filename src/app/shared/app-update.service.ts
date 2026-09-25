import { DOCUMENT, DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter, fromEvent, interval, merge } from 'rxjs';
import { NotificationService } from './notification.service';

/** How often a page that stays open asks for a newer build. */
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;

/**
 * Offers a newer published build once the service worker has downloaded it.
 * Without this the worker keeps serving the cached version until every tab is
 * closed, which for an app pinned to the home screen can be a long time.
 */
@Injectable({ providedIn: 'root' })
export class AppUpdateService {
  private readonly updates = inject(SwUpdate);
  private readonly notifications = inject(NotificationService);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  private offered = false;

  start(): void {
    // Disabled in development builds and in browsers without service workers.
    if (!this.updates.isEnabled) {
      return;
    }

    this.updates.versionUpdates
      .pipe(
        filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY'),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.offerUpdate());

    this.updates.unrecoverable
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() =>
        this.notifications.action(
          'This version can no longer be loaded. Reload to continue.',
          'Reload',
          () => this.reload(),
        ),
      );

    // A home-screen app is resumed rather than reloaded, so coming back to it
    // is the moment worth checking, besides the periodic check.
    const becameVisible = fromEvent(this.document, 'visibilitychange').pipe(
      filter(() => this.document.visibilityState === 'visible'),
    );
    merge(interval(CHECK_INTERVAL_MS), becameVisible)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.check());

    this.check();
  }

  private offerUpdate(): void {
    if (this.offered) {
      return;
    }
    this.offered = true;
    this.notifications.action('A new version is available.', 'Update', () => this.applyUpdate());
  }

  private async applyUpdate(): Promise<void> {
    try {
      await this.updates.activateUpdate();
    } catch {
      // The reload still loads whichever version the worker now serves.
    }
    this.reload();
  }

  /** Offline or a failed request simply means no update this time. */
  private check(): void {
    this.updates.checkForUpdate().catch(() => undefined);
  }

  private reload(): void {
    this.document.location.reload();
  }
}
