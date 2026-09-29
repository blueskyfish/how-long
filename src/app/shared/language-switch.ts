import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';
import { LanguageService } from '../core/i18n/language.service';
import { Language } from '../core/i18n/languages';

/** The switch between the application's languages: the current code, opening a menu of them. */
@Component({
  selector: 'app-language-switch',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HlmButton, HlmDropdownMenuImports, NgIcon, TranslatePipe],
  template: `
    <button
      hlmBtn
      variant="ghost"
      size="sm"
      class="font-mono uppercase"
      [hlmDropdownMenuTrigger]="menu"
      align="end"
      [attr.aria-label]="'language.label' | translate"
      data-testid="language-switch"
    >
      {{ language.current() }}
    </button>

    <ng-template #menu>
      <div hlmDropdownMenu class="min-w-40" data-testid="language-menu">
        @for (option of language.languages; track option) {
          <button
            hlmDropdownMenuItem
            class="w-full"
            [attr.aria-current]="option === language.current()"
            [attr.data-testid]="'language-option-' + option"
            (click)="choose(option)"
          >
            <ng-icon
              name="lucideCheck"
              class="text-base"
              [class.invisible]="option !== language.current()"
            />
            {{ 'language.' + option | translate }}
          </button>
        }
      </div>
    </ng-template>
  `,
})
export class LanguageSwitch {
  protected readonly language = inject(LanguageService);

  protected choose(option: Language): void {
    void this.language.use(option);
  }
}
