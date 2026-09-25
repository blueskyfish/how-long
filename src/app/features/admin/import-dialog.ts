import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmDialogFooter, HlmDialogHeader, HlmDialogTitle } from '@spartan-ng/helm/dialog';
import { Backup } from '../../core/models';
import { RestoreMode } from '../../core/services/backup.service';

export interface ImportDialogContext {
  backup: Backup;
  /** How many countdowns are currently stored, to warn before replacing them. */
  existingCountdowns: number;
}

/** Asks whether an imported backup replaces the current data or is added to it. */
@Component({
  selector: 'app-import-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HlmButton, HlmDialogFooter, HlmDialogHeader, HlmDialogTitle],
  template: `
    <div hlmDialogHeader>
      <h2 hlmDialogTitle>Import backup</h2>
      <p class="text-muted-foreground text-sm">
        The file contains {{ context.backup.countdowns.length }} countdown(s) and
        {{ appointmentCount }} appointment(s).
      </p>
    </div>
    @if (context.existingCountdowns > 0) {
      <p class="text-muted-foreground text-sm">
        Replacing discards the {{ context.existingCountdowns }} countdown(s) already stored on this
        device.
      </p>
    }
    <div hlmDialogFooter>
      <button hlmBtn variant="outline" (click)="close(undefined)" data-testid="cancel">
        Cancel
      </button>
      <button hlmBtn variant="secondary" (click)="close('merge')" data-testid="merge">
        Add to existing
      </button>
      <button hlmBtn (click)="close('replace')" data-testid="replace">Replace all</button>
    </div>
  `,
})
export class ImportDialog {
  protected readonly context = injectBrnDialogContext<ImportDialogContext>();
  private readonly dialogRef = inject<BrnDialogRef<RestoreMode>>(BrnDialogRef);

  protected readonly appointmentCount = this.context.backup.countdowns.reduce(
    (sum, countdown) => sum + countdown.appointments.length,
    0,
  );

  protected close(mode: RestoreMode | undefined): void {
    this.dialogRef.close(mode);
  }
}
