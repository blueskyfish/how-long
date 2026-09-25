import { provideIcons } from '@ng-icons/core';
import { APPOINTMENT_ICON_SVGS } from '../app/shared/appointment-icon-svgs';
import { APP_ICONS } from '../app/shared/icons';

/**
 * Registers the UI icons and every appointment icon up front, so specs render
 * icons synchronously instead of going through the app's lazy loader.
 */
export function provideTestIcons() {
  return provideIcons({ ...APP_ICONS, ...APPOINTMENT_ICON_SVGS });
}
