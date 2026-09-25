import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { Appointment } from '../core/models';

/** Read-only rendering of appointments as `icon — date — title` rows. */
@Component({
  selector: 'app-appointment-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon],
  template: `
    <ul class="m-0 flex list-none flex-col gap-1 p-0">
      @for (appointment of appointments(); track appointment.id ?? $index) {
        <li
          class="flex items-center gap-3 rounded-lg px-3 py-2"
          [style.background-color]="appointment.color + '14'"
        >
          <ng-icon
            class="shrink-0 text-lg"
            [name]="appointment.icon"
            [style.color]="appointment.color"
            aria-hidden="true"
          />
          <time
            class="text-muted-foreground shrink-0 font-mono text-sm tabular-nums"
            [attr.datetime]="appointment.date"
          >
            {{ appointment.date }}
          </time>
          <span class="truncate text-sm">{{ appointment.title }}</span>
        </li>
      } @empty {
        <li class="text-muted-foreground px-3 py-2 text-sm">{{ emptyLabel() }}</li>
      }
    </ul>
  `,
})
export class AppointmentList {
  readonly appointments = input.required<readonly Appointment[]>();
  readonly emptyLabel = input('No appointments yet.');
}
