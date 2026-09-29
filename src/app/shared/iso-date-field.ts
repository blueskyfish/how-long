import { Platform } from '@angular/cdk/platform';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  untracked,
} from '@angular/core';
import type { FormValueControl } from '@angular/forms/signals';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BrnCalendarI18nService } from '@spartan-ng/brain/calendar';
import { HlmDatePickerImports } from '@spartan-ng/helm/date-picker';
import { HlmInput } from '@spartan-ng/helm/input';
import { LanguageService } from '../core/i18n/language.service';
import { parseLocalDate } from '../core/i18n/format-date';
import { parseIsoDate, toIsoDate } from '../core/services/date-utils';
import { calendarI18n } from './calendar-i18n';

/**
 * A `yyyy-mm-dd` day as a form control. On iOS and Android the system's own date
 * picker (`<input type="date">`); everywhere else the Spartan date picker — a text
 * field written in the language's date format, with a calendar behind the calendar
 * icon. Either way the value is the ISO string the rest of the app works with.
 *
 * Bind it with `[formField]`. `edited` fires when the *user* changes the day, which
 * a form's own state cannot tell apart from a value set by code.
 */
@Component({
  selector: 'app-iso-date-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HlmDatePickerImports, HlmInput, TranslatePipe],
  template: `
    @if (native) {
      <input
        hlmInput
        type="date"
        class="appearance-none"
        [id]="inputId()"
        [value]="value()"
        [max]="latest() ?? null"
        [disabled]="disabled()"
        (input)="onNativeInput($event)"
      />
    } @else {
      <hlm-date-picker
        autoCloseOnSelect
        align="end"
        [date]="date()"
        [maxDate]="latestDate()"
        [disabled]="disabled()"
        [formatDate]="format"
        (dateChange)="onPick($event)"
        (input)="onTyping($event)"
      >
        <hlm-date-picker-input
          [inputId]="inputId()"
          [placeholder]="'dateField.placeholder' | translate"
          [parseDate]="parse"
          [formatInputDate]="format"
          [calendarAriaLabel]="'dateField.openCalendar' | translate"
          [clearAriaLabel]="'dateField.clear' | translate"
        />
      </hlm-date-picker>
    }
  `,
})
export class IsoDateField implements FormValueControl<string> {
  private readonly language = inject(LanguageService);
  private readonly translate = inject(TranslateService);

  /** The day as `yyyy-mm-dd`, or an empty string while there is none. */
  readonly value = model('');

  readonly disabled = input(false);

  /** The id of the text field, for its `<label for>`. */
  readonly inputId = input.required<string>();

  /** The last day that may be picked, as `yyyy-mm-dd`. */
  readonly latest = input<string>();

  /** The user changed the day, by typing or picking. */
  readonly edited = output<void>();

  /** Decided once: a device does not change its kind while the page is open. */
  protected readonly native = ((platform) => platform.IOS || platform.ANDROID)(inject(Platform));

  protected readonly date = computed(() => parseIsoDate(this.value()) ?? undefined);
  protected readonly latestDate = computed(() => {
    const latest = this.latest();
    return latest ? (parseIsoDate(latest) ?? undefined) : undefined;
  });

  /** Reads the language signal, so what the picker shows follows a language switch. */
  protected readonly format = (date: Date) => this.language.formatDate(toIsoDate(date));

  protected readonly parse = (text: string): Date | null => {
    const day = parseLocalDate(text);
    return day ? parseIsoDate(day) : null;
  };

  constructor() {
    const calendar = inject(BrnCalendarI18nService);
    // Month and weekday names, headings and labels of the calendar follow the language.
    effect(() => {
      if (this.native) {
        return;
      }
      const texts = calendarI18n(this.language.current(), {
        previousMonth: this.translate.instant('dateField.previousMonth'),
        nextMonth: this.translate.instant('dateField.nextMonth'),
      });
      // `use` reads the service's own signal before writing it; tracked, this effect
      // would depend on what it sets and run forever.
      untracked(() => calendar.use(texts));
    });
  }

  protected onNativeInput(event: Event): void {
    this.value.set((event.target as HTMLInputElement).value);
    this.edited.emit();
  }

  /**
   * The picker's text field only commits on blur or Enter, so a Save pressed right
   * after typing would see the old value. The text is taken as it is typed instead:
   * a complete, real day becomes the value, anything else empties it, so a stale day
   * never stays behind text that says something else.
   */
  protected onTyping(event: Event): void {
    const day = parseLocalDate((event.target as HTMLInputElement).value);
    this.value.set(day ?? '');
    this.edited.emit();
  }

  protected onPick(date: Date | null): void {
    this.value.set(date ? toIsoDate(date) : '');
    this.edited.emit();
  }
}
