import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';
import { LocalDatePipe } from '../core/i18n/local-date.pipe';
import { Appointment } from '../core/models';
import { AppointmentDayCount } from './appointment-day-count';

/** Read-only rendering of appointments as `icon — date — title` rows. */
@Component({
  selector: 'app-appointment-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppointmentDayCount, LocalDatePipe, NgIcon, TranslatePipe],
  template: `
    <ul class="m-0 flex list-none flex-col gap-1 p-0">
      @for (appointment of appointments(); track appointment.id ?? $index) {
        <li
          class="flex items-center gap-3 rounded-lg px-3 py-2"
          [style.background-color]="appointment.color + '14'"
        >
          <ng-icon
            class="shrink-0 text-xl"
            [name]="appointment.icon"
            [style.color]="appointment.color"
            aria-hidden="true"
          />
          <span class="shrink-0">
            <time
              class="text-muted-foreground block font-mono text-sm leading-tight tabular-nums"
              [attr.datetime]="appointment.date"
            >
              {{ appointment.date | localDate }}
            </time>
            <app-appointment-day-count [date]="appointment.date" />
          </span>
          <span class="line-clamp-2 min-w-0 text-sm">{{ appointment.title }}</span>
        </li>
      } @empty {
        <li class="text-muted-foreground px-3 py-2 text-sm">
          {{ emptyLabel() ?? ('appointments.none' | translate) }}
        </li>
      }
    </ul>
  `,
})
export class AppointmentList {
  readonly appointments = input.required<readonly Appointment[]>();
  /** Shown when there is nothing to list; the generic "none yet" text when unset. */
  readonly emptyLabel = input<string>();
}
