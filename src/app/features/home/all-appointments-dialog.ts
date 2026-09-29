import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmDialogFooter, HlmDialogHeader, HlmDialogTitle } from '@spartan-ng/helm/dialog';
import { Appointment } from '../../core/models';
import { AppointmentList } from '../../shared/appointment-list';

export interface AllAppointmentsDialogContext {
  targetDate: string;
  appointments: readonly Appointment[];
}

/** Overlay listing every appointment of the active countdown. */
@Component({
  selector: 'app-all-appointments-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppointmentList, HlmButton, HlmDialogFooter, HlmDialogHeader, HlmDialogTitle],
  // The dialog host is not a grid on its own, so without this header, list and
  // footer would touch; `gap-6` matches the form dialogs.
  host: { class: 'grid gap-6' },
  template: `
    <div hlmDialogHeader>
      <h2 hlmDialogTitle>All appointments</h2>
      <p class="text-muted-foreground text-sm">Leading up to {{ context.targetDate }}</p>
    </div>
    <!--
      Ten rows, then a scrollbar: a row is 2.25rem high with a 0.25rem gap
      (10 × 2.25 + 9 × 0.25 = 24.75rem). On a phone in landscape the viewport
      is the tighter limit.
    -->
    <div
      class="max-h-[min(24.75rem,60dvh)] overflow-y-auto [scrollbar-gutter:stable]"
      data-testid="appointment-scroller"
    >
      <app-appointment-list [appointments]="context.appointments" />
    </div>
    <div hlmDialogFooter>
      <button hlmBtn variant="outline" (click)="close()" data-testid="close">Close</button>
    </div>
  `,
})
export class AllAppointmentsDialog {
  protected readonly context = injectBrnDialogContext<AllAppointmentsDialogContext>();
  private readonly dialogRef = inject(BrnDialogRef);

  protected close(): void {
    this.dialogRef.close(undefined);
  }
}
