import { DIALOG_DATA } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { BrnDialogRef } from '@spartan-ng/brain/dialog';
import { provideTestIcons } from '../../../testing/icons';
import { describe, expect, it, vi } from 'vitest';
import { Appointment } from '../../core/models';
import { LanguageService } from '../../core/i18n/language.service';
import { AllAppointmentsDialog, AllAppointmentsDialogContext } from './all-appointments-dialog';
import { provideTestI18n } from '../../../testing/i18n';

describe('AllAppointmentsDialog', () => {
  const close = vi.fn();

  const appointments: Appointment[] = [
    {
      id: 1,
      countdownId: 1,
      date: '2026-12-01',
      title: 'Advent',
      color: '#1e88e5',
      icon: 'lucideStar',
    },
    {
      id: 2,
      countdownId: 1,
      date: '2026-12-06',
      title: 'St Nicholas',
      color: '#43a047',
      icon: 'lucideGift',
    },
  ];

  function render(context: AllAppointmentsDialogContext) {
    close.mockClear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        ...provideTestI18n(),
        { provide: DIALOG_DATA, useValue: context },
        { provide: BrnDialogRef, useValue: { close } },
        provideTestIcons(),
      ],
    });
    const fixture = TestBed.createComponent(AllAppointmentsDialog);
    fixture.detectChanges();
    return fixture;
  }

  it('lists every appointment it was handed, past ones included', () => {
    const fixture = render({ targetDate: '2026-12-24', appointments });

    const rows = [...fixture.nativeElement.querySelectorAll('li')].map((li: Element) =>
      li.textContent?.replace(/\s+/g, ' ').trim(),
    );
    expect(rows).toHaveLength(2);
    expect(rows[0]).toContain('Advent');
    expect(rows[1]).toContain('St Nicholas');
  });

  it('names the target date the appointments lead up to', () => {
    const fixture = render({ targetDate: '2026-12-24', appointments });

    expect(fixture.nativeElement.textContent).toContain('Leading up to 2026-12-24');
  });

  it('falls back to an empty-state row', () => {
    const fixture = render({ targetDate: '2026-12-24', appointments: [] });

    expect(fixture.nativeElement.textContent).toContain('No appointments yet.');
  });

  it('keeps header, list and button apart like the other dialogs', () => {
    const fixture = render({ targetDate: '2026-12-24', appointments });
    const host: HTMLElement = fixture.nativeElement;

    expect(host.classList).toContain('grid');
    expect(host.classList).toContain('gap-6');
  });

  it('caps the list at ten rows and scrolls the rest', () => {
    const many = Array.from({ length: 15 }, (_, i) => ({
      ...appointments[0],
      id: i + 1,
      title: `Appointment ${i + 1}`,
    }));
    const fixture = render({ targetDate: '2026-12-24', appointments: many });

    const scroller: HTMLElement = fixture.nativeElement.querySelector(
      '[data-testid="appointment-scroller"]',
    );

    // Every row is still in the list; only the box is limited, to 10 × 2.25rem + 9 × 0.25rem.
    expect(scroller.querySelectorAll('li')).toHaveLength(15);
    expect(scroller.className).toContain('max-h-[min(24.75rem,60dvh)]');
    expect(scroller.className).toContain('overflow-y-auto');
  });

  it('closes when dismissed', () => {
    const fixture = render({ targetDate: '2026-12-24', appointments });

    fixture.nativeElement.querySelector('[data-testid="close"]').click();

    expect(close).toHaveBeenCalled();
  });

  it('speaks German and writes the dates the German way', async () => {
    const fixture = render({ targetDate: '2026-12-24', appointments });
    await TestBed.inject(LanguageService).use('de');
    fixture.detectChanges();

    const text: string = fixture.nativeElement.textContent.replace(/\s+/g, ' ');
    expect(text).toContain('Alle Termine');
    expect(text).toContain('Bis zum 24.12.2026');
    expect(text).toContain('01.12.2026');
    expect(fixture.nativeElement.querySelector('[data-testid="close"]').textContent.trim()).toBe(
      'Schließen',
    );
  });
});
