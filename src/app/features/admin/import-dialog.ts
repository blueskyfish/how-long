import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
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
  imports: [HlmButton, HlmDialogFooter, HlmDialogHeader, HlmDialogTitle, TranslatePipe],
  template: `
    <div hlmDialogHeader>
      <h2 hlmDialogTitle>{{ 'importDialog.title' | translate }}</h2>
      <p class="text-muted-foreground text-sm">
        {{
          'importDialog.contains'
            | translate
              : { countdowns: context.backup.countdowns.length, appointments: appointmentCount }
        }}
      </p>
    </div>
    @if (context.existingCountdowns > 0) {
      <p class="text-muted-foreground text-sm">
        {{ 'importDialog.replaceWarning' | translate: { count: context.existingCountdowns } }}
      </p>
    }
    <div hlmDialogFooter>
      <button hlmBtn variant="outline" (click)="close(undefined)" data-testid="cancel">
        {{ 'common.cancel' | translate }}
      </button>
      <button hlmBtn variant="secondary" (click)="close('merge')" data-testid="merge">
        {{ 'importDialog.merge' | translate }}
      </button>
      <button hlmBtn (click)="close('replace')" data-testid="replace">
        {{ 'importDialog.replace' | translate }}
      </button>
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
