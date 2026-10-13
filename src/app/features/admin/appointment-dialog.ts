import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormField, FormRoot, form, maxLength, required, validate } from '@angular/forms/signals';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmDialogFooter, HlmDialogHeader, HlmDialogTitle } from '@spartan-ng/helm/dialog';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { LocalDatePipe } from '../../core/i18n/local-date.pipe';
import { Appointment } from '../../core/models';
import { isValidIsoDate } from '../../core/services/date-utils';
import {
  APPOINTMENT_COLORS,
  APPOINTMENT_ICONS,
  AppointmentIconGroup,
  DEFAULT_APPOINTMENT_COLOR,
  DEFAULT_APPOINTMENT_ICON,
  groupOfIcon,
} from '../../shared/appointment-style';
import { IsoDateField } from '../../shared/iso-date-field';
import { IconGroupSelect } from './icon-group-select';

export interface AppointmentDialogContext {
  /** The countdown's target date; appointments must not fall after it. */
  targetDate: string;
  appointment?: Appointment;
  /** Group a new appointment opens the icon picker on; editing uses the icon's own group. */
  iconGroup?: AppointmentIconGroup;
}

export type AppointmentDialogResult = Pick<Appointment, 'date' | 'title' | 'color' | 'icon'> & {
  /** The group the icon picker showed on saving, for the caller to remember. */
  iconGroup: AppointmentIconGroup;
};

/** Create / edit form for a single appointment. */
@Component({
  selector: 'app-appointment-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HlmButton,
    HlmDialogFooter,
    HlmDialogHeader,
    HlmDialogTitle,
    HlmInput,
    HlmLabel,
    IconGroupSelect,
    IsoDateField,
    LocalDatePipe,
    NgIcon,
    FormField,
    FormRoot,
    TranslatePipe,
  ],
  templateUrl: './appointment-dialog.html',
})
export class AppointmentDialog {
  protected readonly context = injectBrnDialogContext<AppointmentDialogContext>();
  private readonly dialogRef = inject<BrnDialogRef<AppointmentDialogResult>>(BrnDialogRef);

  protected readonly colors = APPOINTMENT_COLORS;

  /**
   * Editing opens on the group of the current icon, so it starts where it left
   * off; a new appointment on the group the caller remembered, else the first.
   */
  protected readonly iconGroup = signal<AppointmentIconGroup>(
    this.context.appointment
      ? groupOfIcon(this.context.appointment.icon)
      : (this.context.iconGroup ?? groupOfIcon(DEFAULT_APPOINTMENT_ICON)),
  );

  protected readonly groupIcons = computed(() =>
    APPOINTMENT_ICONS.filter((icon) => icon.group === this.iconGroup()),
  );

  private readonly iconGrid = viewChild.required<ElementRef<HTMLElement>>('iconGrid');

  protected readonly isAfterTarget = ({ kind }: { kind: string }) => kind === 'afterTarget';

  /** The latest day an appointment may fall on — fed to the input's `max` attribute. */
  protected readonly maxDate = this.context.targetDate;

  private readonly model = signal({
    title: this.context.appointment?.title ?? '',
    date: this.context.appointment?.date ?? '',
    color: this.context.appointment?.color ?? DEFAULT_APPOINTMENT_COLOR,
    icon: this.context.appointment?.icon ?? DEFAULT_APPOINTMENT_ICON,
  });

  protected readonly form = form(this.model, (path) => {
    required(path.title);
    maxLength(path.title, 80);
    required(path.date);
    // Mirrors the repository invariant so the user sees the problem before saving.
    validate(path.date, ({ value }) => {
      if (!value()) {
        return null;
      }
      if (!isValidIsoDate(value())) {
        return { kind: 'isoDate' };
      }
      return value() <= this.context.targetDate ? null : { kind: 'afterTarget' };
    });
  });

  /**
   * Set as soon as the user types into the date field, or tries to save. Without
   * it a rejected date would show up only as a disabled Save button with no
   * explanation. Neither `touched` (fires when the field merely loses focus) nor
   * `dirty` (a native date input can set it by itself while it tracks its
   * validity) tells a real edit apart.
   */
  protected readonly dateTouched = signal(false);

  constructor() {
    // When editing, the current icon may sit below the rows that are visible.
    afterNextRender(() => {
      const grid = this.iconGrid().nativeElement;
      const selected = grid.querySelector<HTMLElement>('[aria-checked="true"]');
      if (selected) {
        grid.scrollTop = selected.offsetTop - (grid.clientHeight - selected.offsetHeight) / 2;
      }
    });
  }

  protected selectGroup(group: AppointmentIconGroup): void {
    this.iconGroup.set(group);
    this.iconGrid().nativeElement.scrollTop = 0;
  }

  protected save(): void {
    this.dateTouched.set(true);
    if (this.form().invalid()) {
      return;
    }
    const { title, date, color, icon } = this.model();
    this.dialogRef.close({ title: title.trim(), date, color, icon, iconGroup: this.iconGroup() });
  }

  protected cancel(): void {
    this.dialogRef.close(undefined);
  }
}
