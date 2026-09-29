import { DIALOG_DATA } from '@angular/cdk/dialog';
import { Platform } from '@angular/cdk/platform';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrnDialogRef } from '@spartan-ng/brain/dialog';
import { describe, expect, it, vi } from 'vitest';
import { LanguageService } from '../../core/i18n/language.service';
import { CountdownDialog, CountdownDialogContext } from './countdown-dialog';
import { provideTestI18n } from '../../../testing/i18n';

describe('CountdownDialog', () => {
  const close = vi.fn();

  /** What `Platform` reports; jsdom itself is neither iOS nor Android. */
  const DEVICES = {
    phone: { IOS: false, ANDROID: true },
    desktop: { IOS: false, ANDROID: false },
  };

  /**
   * Renders the dialog. On a phone the date is the system's own `<input type="date">`,
   * which most specs below drive; `desktop` gets the Spartan date picker.
   */
  function render(
    context: CountdownDialogContext,
    device: keyof typeof DEVICES = 'phone',
  ): ComponentFixture<CountdownDialog> {
    close.mockClear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        ...provideTestI18n(),
        { provide: Platform, useValue: DEVICES[device] },
        { provide: DIALOG_DATA, useValue: context },
        { provide: BrnDialogRef, useValue: { close } },
      ],
    });
    const fixture = TestBed.createComponent(CountdownDialog);
    fixture.detectChanges();
    return fixture;
  }

  /** Reads the signal form of the component under test, which is not public API. */
  const formOf = (fixture: ComponentFixture<CountdownDialog>) =>
    (fixture.componentInstance as unknown as { form: any }).form;

  /** Sets the model directly, for values a native date input would refuse to hold. */
  const fill = (
    fixture: ComponentFixture<CountdownDialog>,
    values: { date: string; description: string },
  ) => {
    formOf(fixture).date().value.set(values.date);
    formOf(fixture).description().value.set(values.description);
  };

  const submit = (fixture: ComponentFixture<CountdownDialog>) =>
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));

  it('starts empty and invalid when creating', () => {
    const fixture = render({});

    expect(fixture.nativeElement.textContent).toContain('New countdown');
    expect(formOf(fixture)().invalid()).toBe(true);
  });

  it('prefills the form when editing', () => {
    const fixture = render({ countdown: { id: 1, date: '2026-12-24', description: 'Christmas' } });

    expect(fixture.nativeElement.textContent).toContain('Edit countdown');
    expect(formOf(fixture)().value()).toEqual({
      date: '2026-12-24',
      description: 'Christmas',
    });
  });

  it('closes with the entered values', () => {
    const fixture = render({});
    fill(fixture, { date: '2026-12-24', description: 'Christmas' });

    submit(fixture);

    expect(close).toHaveBeenCalledWith({ date: '2026-12-24', description: 'Christmas' });
  });

  it('drops a blank description instead of storing an empty string', () => {
    const fixture = render({});
    fill(fixture, { date: '2026-12-24', description: '   ' });

    submit(fixture);

    expect(close).toHaveBeenCalledWith({ date: '2026-12-24', description: undefined });
  });

  it('does not close while no date is entered', () => {
    const fixture = render({});

    submit(fixture);

    expect(close).not.toHaveBeenCalled();
  });

  it('rejects a date that is not a real calendar day', () => {
    const fixture = render({});
    fill(fixture, { date: '2026-02-30', description: '' });

    submit(fixture);

    expect(close).not.toHaveBeenCalled();
  });

  it('explains a rejected date while the user is still typing', () => {
    const fixture = render({});
    const input = fixture.nativeElement.querySelector('#countdown-date');

    input.value = '2026-02-30';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="date-error"]')).not.toBeNull();
  });

  it('shows the date error only after the field was touched', () => {
    const fixture = render({});
    const error = () => fixture.nativeElement.querySelector('[data-testid="date-error"]');
    expect(error()).toBeNull();

    submit(fixture);
    fixture.detectChanges();

    expect(error()).not.toBeNull();
  });

  it('caps the description at 120 characters', () => {
    const fixture = render({});

    expect(fixture.nativeElement.querySelector('#countdown-description').maxLength).toBe(120);

    fill(fixture, { date: '2026-12-24', description: 'x'.repeat(121) });
    submit(fixture);

    expect(close).not.toHaveBeenCalled();
  });

  it('keeps the date error hidden when the field is merely focused and left', () => {
    const fixture = render({});
    const input = fixture.nativeElement.querySelector('#countdown-date');

    input.dispatchEvent(new Event('focus'));
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="date-error"]')).toBeNull();
  });

  it('closes with undefined when cancelled', () => {
    const fixture = render({});

    fixture.nativeElement.querySelector('[data-testid="cancel"]').click();

    expect(close).toHaveBeenCalledWith(undefined);
  });

  it('speaks German', async () => {
    const fixture = render({});
    await TestBed.inject(LanguageService).use('de');
    fixture.detectChanges();

    const page: HTMLElement = fixture.nativeElement;
    expect(page.textContent).toContain('Neuer Countdown');
    expect(page.textContent).toContain('Zieldatum');
    expect(page.querySelector<HTMLInputElement>('#countdown-description')?.placeholder).toBe(
      'Optional',
    );
    expect(page.querySelector('[data-testid="save"]')?.textContent?.trim()).toBe('Speichern');
    expect(page.querySelector('[data-testid="cancel"]')?.textContent?.trim()).toBe('Abbrechen');
  });

  it('explains a rejected date in German', async () => {
    const fixture = render({});
    await TestBed.inject(LanguageService).use('de');
    submit(fixture);
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('[data-testid="date-error"]').textContent.trim(),
    ).toBe('Wähle ein gültiges Zieldatum.');
  });

  describe('on a desktop', () => {
    const typeDate = (fixture: ComponentFixture<CountdownDialog>, text: string) => {
      const input = fixture.nativeElement.querySelector('#countdown-date') as HTMLInputElement;
      input.value = text;
      // A real input event bubbles; the picker listens for it on its own element.
      input.dispatchEvent(new Event('input', { bubbles: true }));
      fixture.detectChanges();
    };

    it('offers the Spartan date picker with a calendar button, not a native date input', () => {
      const fixture = render({}, 'desktop');

      const input = fixture.nativeElement.querySelector('#countdown-date') as HTMLInputElement;
      expect(input.type).toBe('text');
      expect(input.placeholder).toBe('YYYY-MM-DD');
      expect(fixture.nativeElement.querySelector('[aria-label="Open calendar"]')).not.toBeNull();
    });

    it('takes a typed day and saves it as ISO', () => {
      const fixture = render({}, 'desktop');

      typeDate(fixture, '2026-12-24');
      submit(fixture);

      expect(close).toHaveBeenCalledWith({ date: '2026-12-24', description: undefined });
    });

    it('takes the day in German notation once the language is German', async () => {
      const fixture = render({}, 'desktop');
      await TestBed.inject(LanguageService).use('de');
      fixture.detectChanges();
      const input = fixture.nativeElement.querySelector('#countdown-date') as HTMLInputElement;
      expect(input.placeholder).toBe('TT.MM.JJJJ');

      typeDate(fixture, '24.12.2026');
      submit(fixture);

      expect(close).toHaveBeenCalledWith({ date: '2026-12-24', description: undefined });
    });

    it('shows a prefilled day the way the language writes it', async () => {
      const fixture = render({ countdown: { id: 1, date: '2026-12-24' } }, 'desktop');
      const input = () =>
        fixture.nativeElement.querySelector('#countdown-date') as HTMLInputElement;
      expect(input().value).toBe('2026-12-24');

      await TestBed.inject(LanguageService).use('de');
      fixture.detectChanges();

      expect(input().value).toBe('24.12.2026');
    });

    it('explains text that is not a day while it is typed', () => {
      const fixture = render({}, 'desktop');

      typeDate(fixture, '2026-02-30');

      expect(fixture.nativeElement.querySelector('[data-testid="date-error"]')).not.toBeNull();
      submit(fixture);
      expect(close).not.toHaveBeenCalled();
    });

    it('offers the calendar in German', async () => {
      const fixture = render({}, 'desktop');
      await TestBed.inject(LanguageService).use('de');
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('[aria-label="Kalender öffnen"]')).not.toBeNull();
    });
  });
});
