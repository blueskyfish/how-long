import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmDialogFooter, HlmDialogHeader, HlmDialogTitle } from '@spartan-ng/helm/dialog';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { Countdown } from '../../core/models';
import { isValidIsoDate } from '../../core/services/date-utils';

export interface CountdownDialogContext {
  countdown?: Countdown;
}

export type CountdownDialogResult = Pick<Countdown, 'date' | 'description'>;

/** Create / edit form for a countdown's target date and description. */
@Component({
  selector: 'app-countdown-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HlmButton,
    HlmDialogFooter,
    HlmDialogHeader,
    HlmDialogTitle,
    HlmInput,
    HlmLabel,
    ReactiveFormsModule,
  ],
  template: `
    <form [formGroup]="form" (ngSubmit)="save()" class="grid gap-6">
      <div hlmDialogHeader>
        <h2 hlmDialogTitle>{{ context.countdown ? 'Edit countdown' : 'New countdown' }}</h2>
      </div>

      <div class="grid gap-4">
        <div class="grid gap-2">
          <label hlmLabel for="countdown-date">Target date</label>
          <input
            hlmInput
            id="countdown-date"
            type="date"
            (input)="dateTouched.set(true)"
            formControlName="date"
            required
          />
          @if (dateTouched() && form.controls.date.invalid) {
            <p class="text-destructive text-sm" data-testid="date-error">
              Pick a valid target date.
            </p>
          }
        </div>

        <div class="grid gap-2">
          <label hlmLabel for="countdown-description">Description</label>
          <input
            hlmInput
            id="countdown-description"
            type="text"
            maxlength="120"
            formControlName="description"
            placeholder="Optional"
          />
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
export class CountdownDialog {
  protected readonly context = injectBrnDialogContext<CountdownDialogContext>();
  private readonly dialogRef = inject<BrnDialogRef<CountdownDialogResult>>(BrnDialogRef);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    date: [this.context.countdown?.date ?? '', [Validators.required, isoDateValidator]],
    description: [this.context.countdown?.description ?? ''],
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
    const { date, description } = this.form.getRawValue();
    this.dialogRef.close({ date, description: description.trim() || undefined });
  }

  protected cancel(): void {
    this.dialogRef.close(undefined);
  }
}

/** Native date inputs yield `yyyy-mm-dd` or an empty string; anything else is a typo. */
function isoDateValidator(control: { value: string }) {
  return !control.value || isValidIsoDate(control.value) ? null : { isoDate: true };
}
