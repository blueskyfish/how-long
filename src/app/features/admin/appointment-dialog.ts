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
  template: `
    <form [formRoot]="form" (submit)="save()" class="grid gap-6">
      <div hlmDialogHeader>
        <h2 hlmDialogTitle>
          {{
            (context.appointment ? 'appointmentDialog.titleEdit' : 'appointmentDialog.titleNew')
              | translate
          }}
        </h2>
      </div>

      <div class="grid gap-4">
        <div class="grid gap-2">
          <label hlmLabel for="appointment-title">{{
            'appointmentDialog.title' | translate
          }}</label>
          <input hlmInput id="appointment-title" type="text" [formField]="form.title" />
        </div>

        <div class="grid gap-2">
          <label hlmLabel for="appointment-date">{{ 'appointmentDialog.date' | translate }}</label>
          <app-iso-date-field
            inputId="appointment-date"
            [latest]="maxDate"
            [formField]="form.date"
            (edited)="dateTouched.set(true)"
          />
          <p class="text-muted-foreground text-xs">
            {{ 'appointmentDialog.dateHint' | translate: { date: context.targetDate | localDate } }}
          </p>
          @if (dateTouched() && form.date().errors().some(isAfterTarget)) {
            <p class="text-destructive text-sm" data-testid="date-error">
              {{
                'appointmentDialog.dateError' | translate: { date: context.targetDate | localDate }
              }}
            </p>
          }
        </div>

        <div class="grid gap-2">
          <span hlmLabel>{{ 'appointmentDialog.colour' | translate }}</span>
          <div
            class="flex flex-wrap gap-2"
            role="radiogroup"
            [attr.aria-label]="'appointmentDialog.colour' | translate"
          >
            @for (color of colors; track color.value) {
              <button
                type="button"
                role="radio"
                class="size-7 rounded-full outline-offset-2 aria-checked:outline-2"
                [style.background-color]="color.value"
                [style.outline-color]="color.value"
                [attr.aria-checked]="form.color().value() === color.value"
                [attr.aria-label]="'appointment.colors.' + color.name | translate"
                (click)="form.color().value.set(color.value)"
              ></button>
            }
          </div>
        </div>

        <div class="grid gap-2">
          <div class="flex items-center justify-between gap-2">
            <span hlmLabel id="appointment-icon-label">{{
              'appointmentDialog.icon' | translate
            }}</span>
            <app-icon-group-select [value]="iconGroup()" (valueChange)="selectGroup($event)" />
          </div>
          <!--
            Four rows of size-8 buttons with gap-1, plus p-0.5 so the selected
            border is not clipped; the rest scrolls. The stable gutter keeps the
            columns from shifting when the scrollbar appears.
          -->
          <div
            #iconGrid
            class="relative grid max-h-36 grid-cols-5 content-start gap-1 overflow-y-auto p-0.5 [scrollbar-gutter:stable] sm:grid-cols-10"
            role="radiogroup"
            aria-labelledby="appointment-icon-label"
            data-testid="icon-grid"
          >
            @for (icon of groupIcons(); track icon.value) {
              <button
                type="button"
                role="radio"
                class="hover:bg-accent flex size-8 items-center justify-center rounded-md border border-transparent transition-colors focus-visible:outline-none aria-checked:border-current"
                [style.color]="form.color().value()"
                [attr.aria-checked]="form.icon().value() === icon.value"
                [attr.aria-label]="'appointment.icons.' + icon.value | translate"
                (click)="form.icon().value.set(icon.value)"
              >
                <ng-icon [name]="icon.value" class="text-base" />
              </button>
            }
          </div>
        </div>
      </div>

      <div hlmDialogFooter>
        <button hlmBtn variant="outline" type="button" (click)="cancel()" data-testid="cancel">
          {{ 'common.cancel' | translate }}
        </button>
        <button hlmBtn type="submit" [disabled]="form().invalid()" data-testid="save">
          {{ 'common.save' | translate }}
        </button>
      </div>
    </form>
  `,
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
