import { DIALOG_DATA } from '@angular/cdk/dialog';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrnDialogRef } from '@spartan-ng/brain/dialog';
import { provideTestIcons } from '../../../testing/icons';
import { describe, expect, it, vi } from 'vitest';
import {
  APPOINTMENT_ICON_GROUPS,
  APPOINTMENT_ICONS,
  DEFAULT_APPOINTMENT_COLOR,
  DEFAULT_APPOINTMENT_ICON,
} from '../../shared/appointment-style';
import { AppointmentDialog, AppointmentDialogContext } from './appointment-dialog';

describe('AppointmentDialog', () => {
  const close = vi.fn();

  function render(context: AppointmentDialogContext): ComponentFixture<AppointmentDialog> {
    close.mockClear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: DIALOG_DATA, useValue: context },
        { provide: BrnDialogRef, useValue: { close } },
        provideTestIcons(),
      ],
    });
    const fixture = TestBed.createComponent(AppointmentDialog);
    fixture.detectChanges();
    return fixture;
  }

  const internals = (fixture: ComponentFixture<AppointmentDialog>) =>
    fixture.componentInstance as unknown as { form: any; maxDate: string };

  const submit = (fixture: ComponentFixture<AppointmentDialog>) =>
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));

  it('defaults to the first colour and icon of the palette', () => {
    const fixture = render({ targetDate: '2026-12-24' });

    expect(internals(fixture).form.getRawValue()).toMatchObject({
      color: DEFAULT_APPOINTMENT_COLOR,
      icon: DEFAULT_APPOINTMENT_ICON,
    });
  });

  it('caps the date input at the day before the target date', () => {
    const fixture = render({ targetDate: '2026-12-24' });

    expect(internals(fixture).maxDate).toBe('2026-12-23');
    expect(fixture.nativeElement.querySelector('#appointment-date').getAttribute('max')).toBe(
      '2026-12-23',
    );
  });

  it('caps correctly across a month boundary', () => {
    const fixture = render({ targetDate: '2026-03-01' });

    expect(internals(fixture).maxDate).toBe('2026-02-28');
  });

  it('prefills the form when editing', () => {
    const fixture = render({
      targetDate: '2026-12-24',
      appointment: {
        id: 7,
        countdownId: 1,
        date: '2026-12-01',
        title: 'Advent',
        color: '#e53935',
        icon: 'lucideStar',
      },
    });

    expect(fixture.nativeElement.textContent).toContain('Edit appointment');
    expect(internals(fixture).form.getRawValue()).toEqual({
      title: 'Advent',
      date: '2026-12-01',
      color: '#e53935',
      icon: 'lucideStar',
    });
  });

  it('closes with a trimmed title', () => {
    const fixture = render({ targetDate: '2026-12-24' });
    internals(fixture).form.setValue({
      title: '  Advent  ',
      date: '2026-12-01',
      color: '#e53935',
      icon: 'lucideStar',
    });

    submit(fixture);

    expect(close).toHaveBeenCalledWith({
      title: 'Advent',
      date: '2026-12-01',
      color: '#e53935',
      icon: 'lucideStar',
    });
  });

  it('refuses a date on or after the target date', () => {
    const fixture = render({ targetDate: '2026-12-24' });
    internals(fixture).form.patchValue({ title: 'Too late', date: '2026-12-24' });

    submit(fixture);
    fixture.detectChanges();

    expect(close).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('[data-testid="date-error"]')).not.toBeNull();
  });

  it('explains a rejected date while the user is still typing', () => {
    const fixture = render({ targetDate: '2026-12-24' });
    const input = fixture.nativeElement.querySelector('#appointment-date');

    input.value = '2026-12-25';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="date-error"]')).not.toBeNull();
  });

  it('is invalid without a title', () => {
    const fixture = render({ targetDate: '2026-12-24' });
    internals(fixture).form.patchValue({ date: '2026-12-01', title: '' });

    expect(internals(fixture).form.invalid).toBe(true);
  });

  it('picks a colour from the swatches', () => {
    const fixture = render({ targetDate: '2026-12-24' });

    fixture.nativeElement.querySelector('[aria-label="Red"]').click();
    fixture.detectChanges();

    expect(internals(fixture).form.getRawValue().color).toBe('#e53935');
  });

  it('picks an icon from the grid', () => {
    const fixture = render({ targetDate: '2026-12-24' });

    fixture.nativeElement.querySelector('[aria-label="Star"]').click();
    fixture.detectChanges();

    expect(internals(fixture).form.getRawValue().icon).toBe('lucideStar');
  });

  it('closes with undefined when cancelled', () => {
    const fixture = render({ targetDate: '2026-12-24' });

    fixture.nativeElement.querySelector('[data-testid="cancel"]').click();

    expect(close).toHaveBeenCalledWith(undefined);
  });

  describe('icon picker', () => {
    const labels = (fixture: ComponentFixture<AppointmentDialog>) =>
      Array.from(
        fixture.nativeElement.querySelectorAll('[data-testid="icon-grid"] [role="radio"]'),
        (button: Element) => button.getAttribute('aria-label'),
      );

    const groupSelect = (fixture: ComponentFixture<AppointmentDialog>): HTMLSelectElement =>
      fixture.nativeElement.querySelector('[data-testid="icon-group"]');

    function pickGroup(fixture: ComponentFixture<AppointmentDialog>, group: string): void {
      const select = groupSelect(fixture);
      select.value = group;
      select.dispatchEvent(new Event('change'));
      fixture.detectChanges();
    }

    const editing = (icon: string): AppointmentDialogContext => ({
      targetDate: '2026-12-24',
      appointment: {
        id: 1,
        countdownId: 1,
        date: '2026-12-01',
        title: 'Advent',
        color: '#e53935',
        icon,
      },
    });

    it('shows four rows and scrolls the rest', () => {
      const fixture = render({ targetDate: '2026-12-24' });

      const grid = fixture.nativeElement.querySelector('[data-testid="icon-grid"]');
      expect(grid.className).toContain('max-h-36');
      expect(grid.className).toContain('overflow-y-auto');
    });

    it('offers every group in the dropdown', () => {
      const fixture = render({ targetDate: '2026-12-24' });

      const options = Array.from(groupSelect(fixture).options, (option) => option.value);
      expect(options).toEqual([...APPOINTMENT_ICON_GROUPS]);
    });

    it('opens a new appointment on the first group', () => {
      const fixture = render({ targetDate: '2026-12-24' });

      expect(groupSelect(fixture).value).toBe('General');
      expect(labels(fixture)).toEqual(
        APPOINTMENT_ICONS.filter((icon) => icon.group === 'General').map((icon) => icon.name),
      );
    });

    it('opens an existing appointment on the group of its icon', () => {
      const fixture = render(editing('lucidePawPrint'));

      expect(groupSelect(fixture).value).toBe('Health & sport');
      expect(labels(fixture)).toContain('Pet');
    });

    it('shows only the icons of the picked group', () => {
      const fixture = render({ targetDate: '2026-12-24' });

      pickGroup(fixture, 'Celebrations');

      expect(labels(fixture)).toContain('Cake');
      expect(labels(fixture)).not.toContain('Calendar');
      expect(labels(fixture)).toHaveLength(
        APPOINTMENT_ICONS.filter((icon) => icon.group === 'Celebrations').length,
      );
    });

    it('keeps the selected icon when switching to another group', () => {
      const fixture = render({ targetDate: '2026-12-24' });
      pickGroup(fixture, 'Celebrations');
      fixture.nativeElement.querySelector('[aria-label="Cake"]').click();
      fixture.detectChanges();

      pickGroup(fixture, 'Travel & seasons');

      expect(internals(fixture).form.getRawValue().icon).toBe('lucideCake');
    });

    it('opens an icon that is no longer offered on the first group', () => {
      const fixture = render(editing('event'));

      expect(groupSelect(fixture).value).toBe('General');
      expect(internals(fixture).form.getRawValue().icon).toBe('event');
    });
  });
});
