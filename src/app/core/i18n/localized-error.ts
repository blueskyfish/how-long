/**
 * An error the user gets to read. `message` is the English text, which logs and
 * specs see; the UI shows the translation under `key` instead, filled with
 * `params` (see `LanguageService.errorMessage`).
 */
export class LocalizedError extends Error {
  constructor(
    readonly key: string,
    message: string,
    readonly params: Readonly<Record<string, string | number>> = {},
  ) {
    super(message);
    this.name = 'LocalizedError';
  }
}
