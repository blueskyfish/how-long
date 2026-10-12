import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { BrnDialogRef } from '@spartan-ng/brain/dialog';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmDialogFooter, HlmDialogHeader, HlmDialogTitle } from '@spartan-ng/helm/dialog';
import { APP_NAME, APP_VERSION, REPOSITORY_URL } from '../../core/app-info';

/** Project information shown from the unobtrusive version label on the home page. */
@Component({
  selector: 'app-about-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HlmButton, HlmDialogFooter, HlmDialogHeader, HlmDialogTitle, TranslatePipe],
  host: { class: 'grid gap-6' },
  template: `
    <div hlmDialogHeader>
      <h2 hlmDialogTitle>{{ 'home.about.title' | translate }}</h2>
    </div>

    <div class="grid gap-2 text-sm">
      <p class="font-medium">{{ appName }}</p>
      <p class="text-muted-foreground">
        {{ 'home.about.version' | translate: { version: appVersion } }}
      </p>
      <a
        class="text-primary w-fit underline underline-offset-4"
        [href]="repositoryUrl"
        target="_blank"
        rel="noopener noreferrer"
      >
        {{ 'home.about.repository' | translate }}
      </a>
    </div>

    <div hlmDialogFooter>
      <button hlmBtn variant="outline" (click)="close()" data-testid="close">
        {{ 'common.close' | translate }}
      </button>
    </div>
  `,
})
export class AboutDialog {
  protected readonly appName = APP_NAME;
  protected readonly appVersion = APP_VERSION;
  protected readonly repositoryUrl = REPOSITORY_URL;
  private readonly dialogRef = inject(BrnDialogRef);

  protected close(): void {
    this.dialogRef.close(undefined);
  }
}
