import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmDialogFooter, HlmDialogHeader, HlmDialogTitle } from '@spartan-ng/helm/dialog';

export interface ConfirmDialogContext {
  title: string;
  message: string;
  confirmLabel?: string;
}

/** Generic yes/no overlay; closes with `true` when confirmed. */
@Component({
  selector: 'app-confirm-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HlmButton, HlmDialogFooter, HlmDialogHeader, HlmDialogTitle],
  template: `
    <div hlmDialogHeader>
      <h2 hlmDialogTitle>{{ context.title }}</h2>
      <p class="text-muted-foreground text-sm">{{ context.message }}</p>
    </div>
    <div hlmDialogFooter>
      <button hlmBtn variant="outline" (click)="close(false)" data-testid="cancel">Cancel</button>
      <button hlmBtn variant="destructive" (click)="close(true)" data-testid="confirm">
        {{ context.confirmLabel ?? 'Delete' }}
      </button>
    </div>
  `,
})
export class ConfirmDialog {
  protected readonly context = injectBrnDialogContext<ConfirmDialogContext>();
  private readonly dialogRef = inject<BrnDialogRef<boolean>>(BrnDialogRef);

  protected close(confirmed: boolean): void {
    this.dialogRef.close(confirmed);
  }
}
