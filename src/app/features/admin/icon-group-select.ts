import { Platform } from '@angular/cdk/platform';
import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { HlmLabel } from '@spartan-ng/helm/label';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { APPOINTMENT_ICON_GROUPS, AppointmentIconGroup } from '../../shared/appointment-style';

/**
 * The icon group picker. The native `<select>` only where the system's own picker
 * is the better control — the wheel on iOS, the dialog on Android. Everywhere else
 * a native `<select>` opens a plain list whose look the browser decides, so the
 * app's own dropdown takes over.
 */
@Component({
  selector: 'app-icon-group-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HlmLabel, HlmSelectImports, TranslatePipe],
  templateUrl: './icon-group-select.html',
})
export class IconGroupSelect {
  /** The group shown as chosen. */
  readonly value = input.required<AppointmentIconGroup>();

  readonly valueChange = output<AppointmentIconGroup>();

  protected readonly groups = APPOINTMENT_ICON_GROUPS;

  /** Decided once: a device does not change its kind while the page is open. */
  protected readonly native = ((platform) => platform.IOS || platform.ANDROID)(inject(Platform));

  protected pick(group: unknown): void {
    // The dropdown reports what it was given; a cleared value is not a group.
    if (typeof group === 'string' && this.groups.includes(group as AppointmentIconGroup)) {
      this.valueChange.emit(group as AppointmentIconGroup);
    }
  }
}
