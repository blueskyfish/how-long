import {
  lucideArrowLeft,
  lucideCalendar,
  lucideCheck,
  lucideChevronDown,
  lucideChevronRight,
  lucideDownload,
  lucideHourglass,
  lucidePencil,
  lucidePlus,
  lucideSettings,
  lucideTrash2,
  lucideUpload,
  lucideX,
} from '@ng-icons/lucide';

/** Icons of the application's own UI, registered at bootstrap. */
export const APP_ICONS = {
  lucideArrowLeft,
  lucideCalendar,
  lucideCheck,
  lucideChevronDown,
  lucideChevronRight,
  lucideDownload,
  lucideHourglass,
  lucidePencil,
  lucidePlus,
  lucideSettings,
  lucideTrash2,
  lucideUpload,
  lucideX,
};

/**
 * Resolves an appointment icon on first use. The dynamic import keeps the
 * appointment icons out of the initial bundle; the service worker still
 * prefetches the chunk, so they work offline. An unknown name — from an old or
 * hand-edited backup, say — renders nothing rather than failing.
 */
export function loadAppointmentIcon(name: string): Promise<string> {
  return import('./appointment-icon-svgs').then((m) => m.APPOINTMENT_ICON_SVGS[name] ?? '');
}
