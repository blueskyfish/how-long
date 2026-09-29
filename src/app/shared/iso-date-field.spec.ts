import { Platform } from '@angular/cdk/platform';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { LanguageService } from '../core/i18n/language.service';
import { provideTestI18n } from '../../testing/i18n';
import { IsoDateField } from './iso-date-field';

describe('IsoDateField', () => {
  let fixture: ComponentFixture<IsoDateField>;
  let values: string[];
  let edits: number;

  const IPHONE = { IOS: true, ANDROID: false };
  const PIXEL = { IOS: false, ANDROID: true };
  const DESKTOP = { IOS: false, ANDROID: false };

  function render(
    platform: { IOS: boolean; ANDROID: boolean },
    inputs: { value?: string; latest?: string } = {},
  ) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [...provideTestI18n(), { provide: Platform, useValue: platform }],
    });
    fixture = TestBed.createComponent(IsoDateField);
    fixture.componentRef.setInput('inputId', 'day');
    for (const [name, value] of Object.entries(inputs)) {
      fixture.componentRef.setInput(name, value);
    }
    values = [];
    edits = 0;
    fixture.componentInstance.value.subscribe((value) => values.push(value));
    fixture.componentInstance.edited.subscribe(() => edits++);
    fixture.detectChanges();
  }

  const field = () => fixture.nativeElement.querySelector('#day') as HTMLInputElement;

  async function settle() {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  /** Types like a person: the browser's input event bubbles. */
  function type(text: string) {
    field().value = text;
    field().dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
  }

  describe.each([
    ['an iPhone', IPHONE],
    ['an Android phone', PIXEL],
  ])('on %s', (_name, platform) => {
    it('is the native date input', () => {
      render(platform, { value: '2026-12-24' });

      expect(field().type).toBe('date');
      expect(field().value).toBe('2026-12-24');
      expect(fixture.nativeElement.querySelector('hlm-date-picker')).toBeNull();
    });

    it('caps the input at the latest day', () => {
      render(platform, { latest: '2026-12-31' });

      expect(field().max).toBe('2026-12-31');
    });

    it('passes on what the user picks and says so', () => {
      render(platform);

      type('2026-12-24');

      expect(values).toEqual(['2026-12-24']);
      expect(edits).toBe(1);
    });

    it('passes on a cleared field as an empty day', () => {
      render(platform, { value: '2026-12-24' });

      type('');

      expect(values).toEqual(['']);
    });
  });

  describe('on a desktop', () => {
    beforeEach(() => render(DESKTOP, { value: '2026-12-15' }));

    it('is the Spartan date picker, not a native date input', () => {
      expect(field().type).toBe('text');
      expect(fixture.nativeElement.querySelector('hlm-date-picker')).not.toBeNull();
    });

    it('shows the day in the format of the language and the placeholder for it', async () => {
      expect(field().value).toBe('2026-12-15');
      expect(field().placeholder).toBe('YYYY-MM-DD');

      await TestBed.inject(LanguageService).use('de');
      await settle();

      expect(field().value).toBe('15.12.2026');
      expect(field().placeholder).toBe('TT.MM.JJJJ');
    });

    it('has a calendar button, labelled in the language', async () => {
      expect(fixture.nativeElement.querySelector('[aria-label="Open calendar"]')).not.toBeNull();

      await TestBed.inject(LanguageService).use('de');
      await settle();

      expect(fixture.nativeElement.querySelector('[aria-label="Kalender öffnen"]')).not.toBeNull();
    });

    it('takes a complete day as it is typed, in either notation', () => {
      type('24.12.2026');
      type('2027-01-05');

      expect(values).toEqual(['2026-12-24', '2027-01-05']);
      expect(edits).toBe(2);
    });

    it('empties the value while the text is not a day, so no stale day stays behind it', () => {
      type('24.12.');

      expect(values).toEqual(['']);
      expect(edits).toBe(1);
    });

    it('turns a day that was typed wrongly into no day at all', () => {
      type('24.12.2026');
      type('31.02.2026');

      expect(values).toEqual(['2026-12-24', '']);
    });

    async function openCalendar() {
      (
        fixture.nativeElement.querySelector(
          '[aria-label="Open calendar"], [aria-label="Kalender öffnen"]',
        ) as HTMLElement
      ).click();
      await settle();
    }

    const dayButton = (label: string) =>
      [...document.querySelectorAll<HTMLButtonElement>('td[brncalendarcell] button')].find(
        (button) => button.textContent?.trim() === label,
      );

    it('opens a calendar on the month of the day and picks from it', async () => {
      await openCalendar();
      expect(document.querySelector('[brncalendarheader]')?.textContent?.trim()).toBe(
        'December 2026',
      );

      dayButton('24')!.click();
      await settle();

      expect(values).toEqual(['2026-12-24']);
      expect(edits).toBe(1);
    });

    it('writes the calendar in German, weeks starting on Monday', async () => {
      await TestBed.inject(LanguageService).use('de');
      await settle();

      await openCalendar();

      expect(document.querySelector('[brncalendarheader]')?.textContent?.trim()).toBe(
        'Dezember 2026',
      );
      const weekdays = [...document.querySelectorAll('th[brncalendarweekday], thead th')].map(
        (th) => th.textContent?.trim(),
      );
      expect(weekdays[0]).toBe('Mo');
      expect(weekdays[6]).toBe('So');
    });

    it('clears the day', async () => {
      (fixture.nativeElement.querySelector('[aria-label="Clear date"]') as HTMLElement).click();
      await settle();

      expect(values).toEqual(['']);
      expect(edits).toBe(1);
    });
  });

  describe('on a desktop, with a latest day', () => {
    it('does not offer the days after it', async () => {
      render(DESKTOP, { value: '2026-12-15', latest: '2026-12-20' });
      (fixture.nativeElement.querySelector('[aria-label="Open calendar"]') as HTMLElement).click();
      await settle();

      const button = (label: string) =>
        [...document.querySelectorAll<HTMLButtonElement>('td[brncalendarcell] button')].find(
          (b) => b.textContent?.trim() === label,
        )!;
      button('21').click();
      await settle();
      expect(values).toEqual([]);

      button('20').click();
      await settle();
      expect(values).toEqual(['2026-12-20']);
    });
  });
});
