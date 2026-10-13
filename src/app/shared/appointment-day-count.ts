import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { CurrentDateService } from '../core/services/current-date.service';
import { daysUntil } from '../core/services/date-utils';

@Component({
  selector: 'app-appointment-day-count',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe],
  template: `
    <span class="text-muted-foreground text-xs tabular-nums">
      {{ label() | translate: { count: dayCount() } }}
    </span>
  `,
})
export class AppointmentDayCount {
  readonly date = input.required<string>();

  private readonly currentDate = inject(CurrentDateService);
  private readonly daysRemaining = computed(() => daysUntil(this.date(), this.currentDate.today()));

  protected readonly dayCount = computed(() => Math.abs(this.daysRemaining()));
  protected readonly label = computed(() => {
    const days = this.daysRemaining();
    if (days === 0) {
      return 'appointments.dayCount.today';
    }
    if (days === 1) {
      return 'appointments.dayCount.inOneDay';
    }
    if (days > 1) {
      return 'appointments.dayCount.inDays';
    }
    if (days === -1) {
      return 'appointments.dayCount.oneDayAgo';
    }
    return 'appointments.dayCount.daysAgo';
  });
}
