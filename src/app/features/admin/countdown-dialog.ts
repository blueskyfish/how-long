import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormField, FormRoot, form, maxLength, required, validate } from '@angular/forms/signals';
import { TranslatePipe } from '@ngx-translate/core';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmDialogFooter, HlmDialogHeader, HlmDialogTitle } from '@spartan-ng/helm/dialog';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { Countdown } from '../../core/models';
import { isValidIsoDate } from '../../core/services/date-utils';
import { IsoDateField } from '../../shared/iso-date-field';

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
    IsoDateField,
    FormField,
    FormRoot,
    TranslatePipe,
  ],
  template: `
    <form [formRoot]="form" (submit)="save()" class="grid gap-6">
      <div hlmDialogHeader>
        <h2 hlmDialogTitle>
          {{
            (context.countdown ? 'countdownDialog.titleEdit' : 'countdownDialog.titleNew')
              | translate
          }}
        </h2>
      </div>

      <div class="grid gap-4">
        <div class="grid gap-2">
          <label hlmLabel for="countdown-date">{{ 'countdownDialog.date' | translate }}</label>
          <app-iso-date-field
            inputId="countdown-date"
            [formField]="form.date"
            (edited)="dateTouched.set(true)"
          />
          @if (dateTouched() && form.date().invalid()) {
            <p class="text-destructive text-sm" data-testid="date-error">
              {{ 'countdownDialog.dateError' | translate }}
            </p>
          }
        </div>

        <div class="grid gap-2">
          <label hlmLabel for="countdown-description">
            {{ 'countdownDialog.description' | translate }}
          </label>
          <input
            hlmInput
            id="countdown-description"
            type="text"
            [formField]="form.description"
            [placeholder]="'countdownDialog.optional' | translate"
          />
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
export class CountdownDialog {
  protected readonly context = injectBrnDialogContext<CountdownDialogContext>();
  private readonly dialogRef = inject<BrnDialogRef<CountdownDialogResult>>(BrnDialogRef);

  private readonly model = signal({
    date: this.context.countdown?.date ?? '',
    description: this.context.countdown?.description ?? '',
  });

  protected readonly form = form(this.model, (path) => {
    required(path.date);
    maxLength(path.description, 120);
    validate(path.date, ({ value }) =>
      !value() || isValidIsoDate(value()) ? null : { kind: 'isoDate' },
    );
  });

  /**
   * Set as soon as the user types into the date field, or tries to save. Without
   * it a rejected date would show up only as a disabled Save button with no
   * explanation. Neither `touched` (fires when the field merely loses focus) nor
   * `dirty` (a native date input can set it by itself while it tracks its
   * validity) tells a real edit apart.
   */
  protected readonly dateTouched = signal(false);

  protected save(): void {
    this.dateTouched.set(true);
    if (this.form().invalid()) {
      return;
    }
    const { date, description } = this.model();
    this.dialogRef.close({ date, description: description.trim() || undefined });
  }

  protected cancel(): void {
    this.dialogRef.close(undefined);
  }
}
