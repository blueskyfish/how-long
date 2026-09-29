import { Pipe, PipeTransform, inject } from '@angular/core';
import { LanguageService } from './language.service';

/**
 * `{{ '2026-12-24' | localDate }}`: a `yyyy-mm-dd` day in the current language's
 * format. Impure on purpose — a pure pipe would only run again when its input
 * changes, not when the language does. Reading the language signal inside
 * `transform` is what ties the view to it.
 */
@Pipe({ name: 'localDate', pure: false })
export class LocalDatePipe implements PipeTransform {
  private readonly language = inject(LanguageService);

  transform(value: string | null | undefined): string {
    return value ? this.language.formatDate(value) : '';
  }
}
