import { Language } from '../core/i18n/languages';

/** What the calendar needs to write itself in a language; see `BrnCalendarI18nService.use`. */
export interface CalendarTexts {
  previousMonth: string;
  nextMonth: string;
}

/** The calendar wants exactly twelve month names. */
type Months = [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
];

const LOCALES: Record<Language, string> = { en: 'en-GB', de: 'de-DE' };

/**
 * The calendar's month and weekday names, headings and labels for `language`.
 * Weeks start on Monday in both: it is the ISO week the `YYYY-MM-DD` dates come from.
 */
export function calendarI18n(language: Language, texts: CalendarTexts) {
  const locale = LOCALES[language];
  const on = (year: number, month: number, day: number, format: Intl.DateTimeFormatOptions) =>
    new Date(year, month, day).toLocaleDateString(locale, format);
  // 1 January 2023 was a Sunday, so day `index` of that week is weekday `index`.
  const weekday = (index: number, format: Intl.DateTimeFormatOptions) =>
    on(2023, 0, 1 + index, format);

  return {
    // Two letters as a column heading, without the abbreviation dot German adds.
    formatWeekdayName: (index: number) =>
      weekday(index, { weekday: 'short' }).replace('.', '').slice(0, 2),
    labelWeekday: (index: number) => weekday(index, { weekday: 'long' }),
    months: () =>
      Array.from({ length: 12 }, (_, month) => on(2000, month, 1, { month: 'short' })) as Months,
    formatMonth: (month: number) => on(2000, month, 1, { month: 'short' }),
    formatYear: (year: number) => on(year, 0, 1, { year: 'numeric' }),
    formatHeader: (month: number, year: number) =>
      on(year, month, 1, { month: 'long', year: 'numeric' }),
    labelPrevious: () => texts.previousMonth,
    labelNext: () => texts.nextMonth,
    firstDayOfWeek: () => 1 as const,
  };
}
