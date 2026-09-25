import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmDialogFooter, HlmDialogHeader, HlmDialogTitle } from '@spartan-ng/helm/dialog';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { Appointment } from '../../core/models';
import { isValidIsoDate, parseIsoDate, toIsoDate } from '../../core/services/date-utils';
import {
  APPOINTMENT_COLORS,
  APPOINTMENT_ICONS,
  DEFAULT_APPOINTMENT_COLOR,
  DEFAULT_APPOINTMENT_ICON,
} from '../../shared/appointment-style';

export interface AppointmentDialogContext {
  /** The countdown's target date; appointments must fall strictly before it. */
  targetDate: string;
  appointment?: Appointment;
}

export type AppointmentDialogResult = Pick<Appointment, 'date' | 'title' | 'color' | 'icon'>;

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
    NgIcon,
    ReactiveFormsModule,
  ],
  template: `
    <form [formGroup]="form" (ngSubmit)="save()" class="grid gap-6">
      <div hlmDialogHeader>
        <h2 hlmDialogTitle>
          {{ context.appointment ? 'Edit appointment' : 'New appointment' }}
        </h2>
      </div>

      <div class="grid gap-4">
        <div class="grid gap-2">
          <label hlmLabel for="appointment-title">Title</label>
          <input
            hlmInput
            id="appointment-title"
            type="text"
            maxlength="80"
            formControlName="title"
            required
          />
        </div>

        <div class="grid gap-2">
          <label hlmLabel for="appointment-date">Date</label>
          <input
            hlmInput
            id="appointment-date"
            type="date"
            (input)="dateTouched.set(true)"
            [max]="maxDate"
            formControlName="date"
            required
          />
          <p class="text-muted-foreground text-xs">Must be before {{ context.targetDate }}.</p>
          @if (dateTouched() && form.controls.date.hasError('afterTarget')) {
            <p class="text-destructive text-sm" data-testid="date-error">
              The date must be before {{ context.targetDate }}.
            </p>
          }
        </div>

        <div class="grid gap-2">
          <span hlmLabel>Colour</span>
          <div class="flex flex-wrap gap-2" role="radiogroup" aria-label="Colour">
            @for (color of colors; track color.value) {
              <button
                type="button"
                role="radio"
                class="size-7 rounded-full outline-offset-2 aria-checked:outline-2"
                [style.background-color]="color.value"
                [style.outline-color]="color.value"
                [attr.aria-checked]="form.controls.color.value === color.value"
                [attr.aria-label]="color.name"
                (click)="form.controls.color.setValue(color.value)"
              ></button>
            }
          </div>
        </div>

        <div class="grid gap-2">
          <span hlmLabel>Icon</span>
          <div class="grid grid-cols-10 gap-1" role="radiogroup" aria-label="Icon">
            @for (icon of icons; track icon.value) {
              <button
                type="button"
                role="radio"
                class="hover:bg-accent flex size-8 items-center justify-center rounded-md border border-transparent transition-colors focus-visible:outline-none aria-checked:border-current"
                [style.color]="form.controls.color.value"
                [attr.aria-checked]="form.controls.icon.value === icon.value"
                [attr.aria-label]="icon.name"
                (click)="form.controls.icon.setValue(icon.value)"
              >
                <ng-icon [name]="icon.value" class="text-base" />
              </button>
            }
          </div>
        </div>
      </div>

      <div hlmDialogFooter>
        <button hlmBtn variant="outline" type="button" (click)="cancel()" data-testid="cancel">
          Cancel
        </button>
        <button hlmBtn type="submit" [disabled]="form.invalid" data-testid="save">Save</button>
      </div>
    </form>
  `,
})
export class AppointmentDialog {
  protected readonly context = injectBrnDialogContext<AppointmentDialogContext>();
  private readonly dialogRef = inject<BrnDialogRef<AppointmentDialogResult>>(BrnDialogRef);

  protected readonly colors = APPOINTMENT_COLORS;
  protected readonly icons = APPOINTMENT_ICONS;

  /** The day before the target date — also fed to the input's `max` attribute. */
  protected readonly maxDate = this.dayBeforeTarget();

  protected readonly form = inject(FormBuilder).nonNullable.group({
    title: [this.context.appointment?.title ?? '', [Validators.required, Validators.maxLength(80)]],
    date: [
      this.context.appointment?.date ?? '',
      [Validators.required, this.beforeTargetValidator()],
    ],
    color: [this.context.appointment?.color ?? DEFAULT_APPOINTMENT_COLOR],
    icon: [this.context.appointment?.icon ?? DEFAULT_APPOINTMENT_ICON],
  });

  /**
   * Set as soon as the user types into the date field, or tries to save. Without
   * it a rejected date would show up only as a disabled Save button with no
   * explanation, since `touched` alone waits for the field to lose focus.
   */
  protected readonly dateTouched = signal(false);

  protected save(): void {
    this.dateTouched.set(true);
    if (this.form.invalid) {
      return;
    }
    const { title, date, color, icon } = this.form.getRawValue();
    this.dialogRef.close({ title: title.trim(), date, color, icon });
  }

  protected cancel(): void {
    this.dialogRef.close(undefined);
  }

  private dayBeforeTarget(): string {
    const target = parseIsoDate(this.context.targetDate);
    if (!target) {
      return '';
    }
    return toIsoDate(new Date(target.getFullYear(), target.getMonth(), target.getDate() - 1));
  }

  /** Mirrors the repository invariant so the user sees the problem before saving. */
  private beforeTargetValidator() {
    return (control: { value: string }) => {
      if (!control.value) {
        return null;
      }
      if (!isValidIsoDate(control.value)) {
        return { isoDate: true };
      }
      return control.value < this.context.targetDate ? null : { afterTarget: true };
    };
  }
}
