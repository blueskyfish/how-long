import { describe, expect, it } from 'vitest';
import { calendarI18n } from './calendar-i18n';

describe('calendarI18n', () => {
  const texts = { previousMonth: 'Back', nextMonth: 'Forward' };
  const german = calendarI18n('de', texts);
  const english = calendarI18n('en', texts);

  it('writes the heading in the language', () => {
    expect(german.formatHeader(11, 2026)).toBe('Dezember 2026');
    expect(english.formatHeader(11, 2026)).toBe('December 2026');
  });

  it('names the weekdays, counted from Sunday, in two letters', () => {
    expect([0, 1, 2, 3, 4, 5, 6].map(german.formatWeekdayName)).toEqual([
      'So',
      'Mo',
      'Di',
      'Mi',
      'Do',
      'Fr',
      'Sa',
    ]);
    expect([0, 1, 2].map(english.formatWeekdayName)).toEqual(['Su', 'Mo', 'Tu']);
  });

  it('names the weekdays in full for assistive technology', () => {
    expect(german.labelWeekday(1)).toBe('Montag');
    expect(english.labelWeekday(1)).toBe('Monday');
  });

  it('offers twelve month names', () => {
    expect(german.months()).toHaveLength(12);
    expect(german.months()[2]).toBe('Mär');
    expect(english.months()[2]).toBe('Mar');
    expect(german.formatMonth(2)).toBe('Mär');
  });

  it('starts the week on Monday in both languages, like the ISO dates', () => {
    expect(german.firstDayOfWeek()).toBe(1);
    expect(english.firstDayOfWeek()).toBe(1);
  });

  it('takes the labels of the buttons from the given texts', () => {
    expect(german.labelPrevious()).toBe('Back');
    expect(german.labelNext()).toBe('Forward');
  });
});
