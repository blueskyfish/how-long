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
  APPOINTMENT_ICON_GROUPS,
  APPOINTMENT_ICONS,
  AppointmentIconGroup,
  DEFAULT_APPOINTMENT_COLOR,
  DEFAULT_APPOINTMENT_ICON,
  groupOfIcon,
} from '../../shared/appointment-style';

export interface AppointmentDialogContext {
  /** The countdown's target date; appointments must fall strictly before it. */
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
            class="appearance-none"
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
          <div class="flex items-center justify-between gap-2">
            <span hlmLabel id="appointment-icon-label">Icon</span>
            <select
              class="border-input focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 h-8 rounded-md border bg-transparent px-2 text-sm outline-none focus-visible:ring-3"
              aria-label="Icon group"
              data-testid="icon-group"
              (change)="selectGroup($any($event.target).value)"
            >
              @for (group of iconGroups; track group) {
                <option [value]="group" [selected]="group === iconGroup()">{{ group }}</option>
              }
            </select>
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
  protected readonly iconGroups = APPOINTMENT_ICON_GROUPS;

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
    if (this.form.invalid) {
      return;
    }
    const { title, date, color, icon } = this.form.getRawValue();
    this.dialogRef.close({ title: title.trim(), date, color, icon, iconGroup: this.iconGroup() });
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
