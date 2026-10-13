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
  templateUrl: './language-switch.html',
})
export class LanguageSwitch {
  protected readonly language = inject(LanguageService);

  protected choose(option: Language): void {
    void this.language.use(option);
  }
}
