import { vi } from 'vitest';
import { NotificationService } from '../app/shared/notification.service';

/** A spy stand-in for the toaster-backed {@link NotificationService}. */
export function provideNotificationSpy() {
  const notifications = { success: vi.fn(), error: vi.fn() };
  return { notifications, provider: { provide: NotificationService, useValue: notifications } };
}
