import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';
import { BrnDialogRef } from '@spartan-ng/brain/dialog';
import { HlmDialogHeader, HlmDialogTitle } from '@spartan-ng/helm/dialog';
import { APP_NAME, APP_VERSION, REPOSITORY_URL } from '../../core/app-info';

/** Project information shown from the unobtrusive version label on the home page. */
@Component({
  selector: 'app-about-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HlmDialogHeader, HlmDialogTitle, NgIcon, TranslatePipe],
  host: { class: 'grid gap-6' },
  template: `
    <div class="flex items-center justify-between gap-4">
      <div hlmDialogHeader>
        <h2 hlmDialogTitle>{{ 'home.about.title' | translate }}</h2>
      </div>
      <button
        class="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex size-8 shrink-0 items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none"
        type="button"
        [attr.aria-label]="'common.close' | translate"
        (click)="close()"
        data-testid="close"
      >
        <ng-icon name="lucideX" class="size-4" />
      </button>
    </div>

    <img
      class="mx-auto h-[196px] w-[196px] max-h-[196px] max-w-[196px] rounded-xl"
      src="./logo.svg"
      alt=""
    />

    <div class="grid gap-2 text-sm">
      <p class="text-xl font-semibold tracking-tight">{{ appName }}</p>
      <p class="text-muted-foreground">
        {{ 'home.about.version' | translate: { version: appVersion } }}
      </p>
      <a
        class="text-primary w-fit underline underline-offset-4"
        [href]="repositoryUrl"
        target="_blank"
        rel="noopener noreferrer"
      >
        {{ repositoryUrl }}
      </a>
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
