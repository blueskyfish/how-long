import { provideTranslateService, provideTranslateLoader } from '@ngx-translate/core';
import { of } from 'rxjs';
import { Language } from '../app/core/i18n/languages';
import de from '../../public/assets/i18n/de.json';
import en from '../../public/assets/i18n/en.json';

const TRANSLATIONS = { en, de };

/**
 * The real translation files, served synchronously, with `language` already in
 * use — so a spec renders the same texts as the application, without a request.
 */
export function provideTestI18n(language: Language = 'en') {
  return [
    provideTranslateService({ lang: language, fallbackLang: 'en' }),
    provideTranslateLoader(() => ({
      getTranslation: (lang: string) => of(TRANSLATIONS[lang as Language]),
    })),
  ];
}
