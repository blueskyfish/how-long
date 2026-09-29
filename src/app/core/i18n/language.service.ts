import { DOCUMENT, Injectable, InjectionToken, computed, effect, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { isValidIsoDate } from '../services/date-utils';
import { formatDate } from './format-date';
import { DEFAULT_LANGUAGE, LANGUAGES, Language, isLanguage } from './languages';
import { LocalizedError } from './localized-error';

/**
 * Where the choice is kept: a per-device preference, so it lives beside the data
 * rather than in it, and stays out of backups. `null` when the browser refuses
 * access to storage, in which case the choice is simply not remembered.
 */
export const LANGUAGE_STORAGE = new InjectionToken<Storage | null>('LANGUAGE_STORAGE', {
  providedIn: 'root',
  factory: () => {
    try {
      return globalThis.localStorage ?? null;
    } catch {
      return null;
    }
  },
});

const STORAGE_KEY = 'how-long.language';

/**
 * The application's language: which one is shown, how a day is written in it,
 * and the switch between the two. Everything reads {@link current}, a signal, so
 * a switch reaches every text and date at once.
 */
@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translate = inject(TranslateService);
  private readonly storage = inject(LANGUAGE_STORAGE);
  private readonly document = inject(DOCUMENT);

  readonly languages = LANGUAGES;

  /** The language in use; the default until the first one has been loaded. */
  readonly current = computed<Language>(() => {
    const language = this.translate.currentLang();
    return isLanguage(language) ? language : DEFAULT_LANGUAGE;
  });

  constructor() {
    // Screen readers and the browser's hyphenation and spell check follow it.
    effect(() => (this.document.documentElement.lang = this.current()));
  }

  /**
   * Loads the language the page opens in — the saved choice, else the browser's,
   * else English. Awaited before the first render, so no key ever shows.
   */
  async init(): Promise<void> {
    await firstValueFrom(this.translate.use(this.initial()));
  }

  /** Switches the language and keeps the choice for the next visit. */
  async use(language: Language): Promise<void> {
    await firstValueFrom(this.translate.use(language));
    try {
      this.storage?.setItem(STORAGE_KEY, language);
    } catch {
      // Storage refused: the switch still holds for this visit.
    }
  }

  /** A `yyyy-mm-dd` day written the way the current language does. */
  formatDate(value: string): string {
    return formatDate(value, this.current());
  }

  /**
   * The text of an error for the user. A {@link LocalizedError} is translated;
   * anything else keeps its own message. Days among its parameters are written in
   * the current language too.
   */
  errorMessage(error: unknown): string {
    if (!(error instanceof LocalizedError)) {
      return error instanceof Error ? error.message : String(error);
    }
    const params = Object.fromEntries(
      Object.entries(error.params).map(([name, value]) => [
        name,
        typeof value === 'string' && isValidIsoDate(value) ? this.formatDate(value) : value,
      ]),
    );
    return this.translate.instant(error.key, params);
  }

  private initial(): Language {
    let stored: string | null = null;
    try {
      stored = this.storage?.getItem(STORAGE_KEY) ?? null;
    } catch {
      // Storage refused: fall through to the browser's language.
    }
    if (isLanguage(stored)) {
      return stored;
    }
    const browser = this.translate.getBrowserLang();
    return isLanguage(browser) ? browser : DEFAULT_LANGUAGE;
  }
}
