/** Languages the application ships translations for; the first is the fallback. */
export const LANGUAGES = ['en', 'de'] as const;

export type Language = (typeof LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = LANGUAGES[0];

export function isLanguage(value: unknown): value is Language {
  return LANGUAGES.includes(value as Language);
}
