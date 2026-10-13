import {
  ChangeDetectionStrategy,
  Component,
  Resource,
  computed,
  effect,
  inject,
  input,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { CountdownRepository } from '../../core/data/countdown-repository';
import { LanguageService } from '../../core/i18n/language.service';
import { LocalDatePipe } from '../../core/i18n/local-date.pipe';
import { Appointment, Countdown } from '../../core/models';
import { ConfirmDialog, ConfirmDialogContext } from '../../shared/confirm-dialog';
import { openDialog } from '../../shared/dialog';
import { AppointmentIconGroup } from '../../shared/appointment-style';
import { NotificationService } from '../../shared/notification.service';
import {
  AppointmentDialog,
  AppointmentDialogContext,
  AppointmentDialogResult,
} from './appointment-dialog';
import { CountdownDialog, CountdownDialogContext, CountdownDialogResult } from './countdown-dialog';
import { RememberedIconGroup } from './remembered-icon-group';

@Component({
  selector: 'app-admin-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HlmButton, LocalDatePipe, NgIcon, RouterLink, TranslatePipe],
  templateUrl: './admin-detail-page.html',
})
export class AdminDetailPage {
  /** Bound from the `admin/:id` route parameter. */
  readonly id = input.required<string>();
  readonly countdownResource = input<Resource<Countdown | undefined>>();
  readonly appointmentsResource = input<Resource<Appointment[]>>();

  private readonly repository = inject(CountdownRepository);
  private readonly dialog = inject(HlmDialogService);
  private readonly notifications = inject(NotificationService);
  private readonly iconGroups = inject(RememberedIconGroup);
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);

  private readonly countdownId = computed(() => Number(this.id()));

  protected readonly countdown = computed(() => this.countdownResource()?.value());

  protected readonly appointments = computed(() => this.appointmentsResource()?.value() ?? []);

  constructor() {
    // Opening another countdown starts its new appointments on the first group again.
    effect(() => this.iconGroups.enter(this.countdownId()));
  }

  protected async editCountdown(): Promise<void> {
    const active = this.countdown();
    if (!active) {
      return;
    }
    const result = await openDialog<CountdownDialogResult, CountdownDialogContext>(
      this.dialog,
      CountdownDialog,
      { countdown: active },
    );
    if (result) {
      await this.run(() => this.repository.updateCountdown(active.id!, result));
    }
  }

  protected async createAppointment(): Promise<void> {
    const active = this.countdown();
    if (!active) {
      return;
    }
    const result = await openDialog<AppointmentDialogResult, AppointmentDialogContext>(
      this.dialog,
      AppointmentDialog,
      { targetDate: active.date, iconGroup: this.iconGroups.groupFor(active.id!) },
    );
    if (result) {
      const { iconGroup, ...appointment } = result;
      this.rememberIconGroup(active.id!, iconGroup);
      await this.run(() =>
        this.repository.createAppointment({ ...appointment, countdownId: active.id! }),
      );
    }
  }

  protected async editAppointment(appointment: Appointment): Promise<void> {
    const active = this.countdown();
    if (!active) {
      return;
    }
    const result = await openDialog<AppointmentDialogResult, AppointmentDialogContext>(
      this.dialog,
      AppointmentDialog,
      { targetDate: active.date, appointment },
    );
    if (result) {
      const { iconGroup, ...changes } = result;
      this.rememberIconGroup(active.id!, iconGroup);
      await this.run(() => this.repository.updateAppointment(appointment.id!, changes));
    }
  }

  protected async deleteAppointment(appointment: Appointment): Promise<void> {
    const confirmed = await openDialog<boolean, ConfirmDialogContext>(this.dialog, ConfirmDialog, {
      title: this.translate.instant('admin.detail.deleteTitle'),
      message: this.translate.instant('admin.detail.deleteMessage', { title: appointment.title }),
    });
    if (confirmed) {
      await this.repository.deleteAppointment(appointment.id!);
      this.notifications.success(this.translate.instant('admin.detail.deleted'));
    }
  }

  private rememberIconGroup(countdownId: number, group: AppointmentIconGroup | undefined): void {
    if (group) {
      this.iconGroups.remember(countdownId, group);
    }
  }

  /** Surfaces repository invariant violations to the user instead of swallowing them. */
  private async run(action: () => Promise<unknown>): Promise<void> {
    try {
      await action();
    } catch (error) {
      this.notifications.error(this.language.errorMessage(error));
    }
  }
}
