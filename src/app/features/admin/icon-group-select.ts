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
  template: `
    @if (native) {
      <select
        class="border-input focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 h-8 rounded-md border bg-transparent px-2 text-sm outline-none focus-visible:ring-3"
        [attr.aria-label]="'appointmentDialog.iconGroup' | translate"
        data-testid="icon-group"
        (change)="valueChange.emit($any($event.target).value)"
      >
        @for (group of groups; track group) {
          <option [value]="group" [selected]="group === value()">
            {{ 'appointment.groups.' + group | translate }}
          </option>
        }
      </select>
    } @else {
      <label hlmLabel class="sr-only" for="icon-group-trigger">
        {{ 'appointmentDialog.iconGroup' | translate }}
      </label>
      <hlm-select [value]="value()" (valueChange)="pick($event)">
        <hlm-select-trigger buttonId="icon-group-trigger" size="sm" data-testid="icon-group">
          <ng-container *hlmSelectValueTemplate="let group">
            {{ 'appointment.groups.' + group | translate }}
          </ng-container>
        </hlm-select-trigger>
        <hlm-select-content *hlmSelectPortal class="min-w-56">
          @for (group of groups; track group) {
            <hlm-select-item [value]="group" [attr.data-testid]="'icon-group-option-' + group">
              {{ 'appointment.groups.' + group | translate }}
            </hlm-select-item>
          }
        </hlm-select-content>
      </hlm-select>
    }
  `,
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
