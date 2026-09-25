import { Injectable } from '@angular/core';
import { toast } from '@spartan-ng/brain/sonner';

/**
 * Transient feedback shown in the toaster mounted by the app shell. Wrapping the
 * global `toast` in a service keeps it injectable, so specs can assert on the
 * messages without rendering an overlay.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  success(message: string): void {
    toast.success(message);
  }

  error(message: string): void {
    toast.error(message);
  }

  /** Stays until the user presses the button, which closes it and runs `onClick`. */
  action(message: string, label: string, onClick: () => void): void {
    toast.info(message, { duration: Infinity, action: { label, onClick } });
  }
}
