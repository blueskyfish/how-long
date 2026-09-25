import { DIALOG_DATA } from '@angular/cdk/dialog';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideIcons } from '@ng-icons/core';
import { BrnDialogRef } from '@spartan-ng/brain/dialog';
import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_APPOINTMENT_COLOR,
  DEFAULT_APPOINTMENT_ICON,
} from '../../shared/appointment-style';
import { APP_ICONS } from '../../shared/icons';
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
        provideIcons(APP_ICONS),
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

    fixture.nativeElement.querySelector('[aria-label="Cake"]').click();
    fixture.detectChanges();

    expect(internals(fixture).form.getRawValue().icon).toBe('lucideCake');
  });

  it('closes with undefined when cancelled', () => {
    const fixture = render({ targetDate: '2026-12-24' });

    fixture.nativeElement.querySelector('[data-testid="cancel"]').click();

    expect(close).toHaveBeenCalledWith(undefined);
  });
});
