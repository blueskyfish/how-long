import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { LanguageService } from '../core/i18n/language.service';
import { CurrentDateService } from '../core/services/current-date.service';
import { provideTestI18n } from '../../testing/i18n';
import { afterEach, describe, expect, it } from 'vitest';
import { AppointmentDayCount } from './appointment-day-count';

describe('AppointmentDayCount', () => {
  const today = signal(new Date(2026, 9, 13, 12));

  function render(date: string) {
    TestBed.configureTestingModule({
      imports: [AppointmentDayCount],
      providers: [
        ...provideTestI18n(),
        { provide: CurrentDateService, useValue: { today: today.asReadonly() } },
      ],
    });
    const fixture = TestBed.createComponent(AppointmentDayCount);
    fixture.componentRef.setInput('date', date);
    fixture.detectChanges();
    return fixture;
  }

  afterEach(() => {
    TestBed.resetTestingModule();
    today.set(new Date(2026, 9, 13, 12));
  });

  it.each([
    ['2026-10-13', 'Today'],
    ['2026-10-14', 'In one day'],
    ['2026-10-17', 'In 4 days'],
    ['2026-10-12', 'One day ago'],
    ['2026-10-10', '3 days ago'],
  ])('shows the right day count for %s', (date, expected) => {
    const fixture = render(date);

    expect(fixture.nativeElement.textContent.trim()).toBe(expected);
  });

  it('counts across a daylight-saving transition', () => {
    today.set(new Date(2026, 2, 28, 12));
    const fixture = render('2026-03-30');

    expect(fixture.nativeElement.textContent.trim()).toBe('In 2 days');
  });

  it('updates when the current date changes', () => {
    const fixture = render('2026-10-14');

    today.set(new Date(2026, 9, 14, 12));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent.trim()).toBe('Today');
  });

  it('localizes singular and plural day counts', async () => {
    const fixture = render('2026-10-14');
    await TestBed.inject(LanguageService).use('de');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent.trim()).toBe('In einem Tag');

    today.set(new Date(2026, 9, 15, 12));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent.trim()).toBe('Vor einem Tag');

    today.set(new Date(2026, 9, 17, 12));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent.trim()).toBe('Vor 3 Tagen');
  });
});
