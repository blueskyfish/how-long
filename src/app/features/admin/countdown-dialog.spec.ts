import { DIALOG_DATA } from '@angular/cdk/dialog';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrnDialogRef } from '@spartan-ng/brain/dialog';
import { describe, expect, it, vi } from 'vitest';
import { CountdownDialog, CountdownDialogContext } from './countdown-dialog';

describe('CountdownDialog', () => {
  const close = vi.fn();

  function render(context: CountdownDialogContext): ComponentFixture<CountdownDialog> {
    close.mockClear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: DIALOG_DATA, useValue: context },
        { provide: BrnDialogRef, useValue: { close } },
      ],
    });
    const fixture = TestBed.createComponent(CountdownDialog);
    fixture.detectChanges();
    return fixture;
  }

  /** Reads the reactive form of the component under test, which is not public API. */
  const formOf = (fixture: ComponentFixture<CountdownDialog>) =>
    (fixture.componentInstance as unknown as { form: any }).form;

  const submit = (fixture: ComponentFixture<CountdownDialog>) =>
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));

  it('starts empty and invalid when creating', () => {
    const fixture = render({});

    expect(fixture.nativeElement.textContent).toContain('New countdown');
    expect(formOf(fixture).invalid).toBe(true);
  });

  it('prefills the form when editing', () => {
    const fixture = render({ countdown: { id: 1, date: '2026-12-24', description: 'Christmas' } });

    expect(fixture.nativeElement.textContent).toContain('Edit countdown');
    expect(formOf(fixture).getRawValue()).toEqual({
      date: '2026-12-24',
      description: 'Christmas',
    });
  });

  it('closes with the entered values', () => {
    const fixture = render({});
    formOf(fixture).setValue({ date: '2026-12-24', description: 'Christmas' });

    submit(fixture);

    expect(close).toHaveBeenCalledWith({ date: '2026-12-24', description: 'Christmas' });
  });

  it('drops a blank description instead of storing an empty string', () => {
    const fixture = render({});
    formOf(fixture).setValue({ date: '2026-12-24', description: '   ' });

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
    formOf(fixture).setValue({ date: '2026-02-30', description: '' });

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

  it('closes with undefined when cancelled', () => {
    const fixture = render({});

    fixture.nativeElement.querySelector('[data-testid="cancel"]').click();

    expect(close).toHaveBeenCalledWith(undefined);
  });
});
