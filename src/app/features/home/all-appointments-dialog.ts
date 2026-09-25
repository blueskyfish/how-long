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
  template: `
    <div hlmDialogHeader>
      <h2 hlmDialogTitle>All appointments</h2>
      <p class="text-muted-foreground text-sm">Leading up to {{ context.targetDate }}</p>
    </div>
    <div class="max-h-[60dvh] overflow-y-auto">
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
