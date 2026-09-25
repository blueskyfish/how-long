import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SwUpdate, UnrecoverableStateEvent, VersionEvent } from '@angular/service-worker';
import { Subject } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { provideNotificationSpy } from '../../testing/notification';
import { AppUpdateService } from './app-update.service';

const VERSION_READY: VersionEvent = {
  type: 'VERSION_READY',
  currentVersion: { hash: 'old' },
  latestVersion: { hash: 'new' },
};

describe('AppUpdateService', () => {
  let versionUpdates: Subject<VersionEvent>;
  let unrecoverable: Subject<UnrecoverableStateEvent>;
  let swUpdate: {
    isEnabled: boolean;
    versionUpdates: Subject<VersionEvent>;
    unrecoverable: Subject<UnrecoverableStateEvent>;
    checkForUpdate: ReturnType<typeof vi.fn>;
    activateUpdate: ReturnType<typeof vi.fn>;
  };
  let fakeDocument: EventTarget & {
    visibilityState: DocumentVisibilityState;
    location: { reload: ReturnType<typeof vi.fn> };
  };
  let notifications: ReturnType<typeof provideNotificationSpy>['notifications'];

  function setup(isEnabled = true): AppUpdateService {
    versionUpdates = new Subject();
    unrecoverable = new Subject();
    swUpdate = {
      isEnabled,
      versionUpdates,
      unrecoverable,
      checkForUpdate: vi.fn().mockResolvedValue(false),
      activateUpdate: vi.fn().mockResolvedValue(true),
    };
    fakeDocument = Object.assign(new EventTarget(), {
      visibilityState: 'visible' as DocumentVisibilityState,
      location: { reload: vi.fn() },
    });
    const spy = provideNotificationSpy();
    notifications = spy.notifications;
    TestBed.configureTestingModule({
      providers: [
        { provide: SwUpdate, useValue: swUpdate },
        { provide: DOCUMENT, useValue: fakeDocument },
        spy.provider,
      ],
    });
    return TestBed.inject(AppUpdateService);
  }

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does nothing when the service worker is disabled', () => {
    setup(false).start();

    versionUpdates.next(VERSION_READY);

    expect(swUpdate.checkForUpdate).not.toHaveBeenCalled();
    expect(notifications.action).not.toHaveBeenCalled();
  });

  it('checks for an update on start and again every six hours', () => {
    setup().start();
    expect(swUpdate.checkForUpdate).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(6 * 60 * 60 * 1000);

    expect(swUpdate.checkForUpdate).toHaveBeenCalledTimes(2);
  });

  it('checks again when the page becomes visible, but not when it is hidden', () => {
    setup().start();

    fakeDocument.visibilityState = 'hidden';
    fakeDocument.dispatchEvent(new Event('visibilitychange'));
    expect(swUpdate.checkForUpdate).toHaveBeenCalledTimes(1);

    fakeDocument.visibilityState = 'visible';
    fakeDocument.dispatchEvent(new Event('visibilitychange'));
    expect(swUpdate.checkForUpdate).toHaveBeenCalledTimes(2);
  });

  it('offers a downloaded version once, however often it is reported', () => {
    setup().start();

    versionUpdates.next({ type: 'VERSION_DETECTED', version: { hash: 'new' } });
    versionUpdates.next(VERSION_READY);
    versionUpdates.next(VERSION_READY);

    expect(notifications.action).toHaveBeenCalledOnce();
    expect(notifications.action).toHaveBeenCalledWith(
      'A new version is available.',
      'Update',
      expect.any(Function),
    );
  });

  it('activates the new version and reloads when the user confirms', async () => {
    setup().start();
    versionUpdates.next(VERSION_READY);

    const onClick = notifications.action.mock.calls[0][2] as () => void;
    onClick();
    await vi.waitFor(() => expect(fakeDocument.location.reload).toHaveBeenCalled());

    expect(swUpdate.activateUpdate).toHaveBeenCalled();
  });

  it('still reloads when activating the new version fails', async () => {
    setup().start();
    swUpdate.activateUpdate.mockRejectedValue(new Error('gone'));
    versionUpdates.next(VERSION_READY);

    const onClick = notifications.action.mock.calls[0][2] as () => void;
    onClick();

    await vi.waitFor(() => expect(fakeDocument.location.reload).toHaveBeenCalled());
  });

  it('asks for a reload when the cached version can no longer be served', () => {
    setup().start();

    unrecoverable.next({ type: 'UNRECOVERABLE_STATE', reason: 'missing file' });

    expect(notifications.action).toHaveBeenCalledWith(
      expect.stringContaining('Reload'),
      'Reload',
      expect.any(Function),
    );
  });

  it('ignores a failed check', async () => {
    const service = setup();
    swUpdate.checkForUpdate.mockRejectedValue(new Error('offline'));

    expect(() => service.start()).not.toThrow();
    await vi.advanceTimersByTimeAsync(0);
  });
});
