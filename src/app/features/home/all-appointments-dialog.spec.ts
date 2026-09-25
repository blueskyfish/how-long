import { DIALOG_DATA } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { provideIcons } from '@ng-icons/core';
import { BrnDialogRef } from '@spartan-ng/brain/dialog';
import { describe, expect, it, vi } from 'vitest';
import { Appointment } from '../../core/models';
import { APP_ICONS } from '../../shared/icons';
import { AllAppointmentsDialog, AllAppointmentsDialogContext } from './all-appointments-dialog';

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
        { provide: DIALOG_DATA, useValue: context },
        { provide: BrnDialogRef, useValue: { close } },
        provideIcons(APP_ICONS),
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

  it('closes when dismissed', () => {
    const fixture = render({ targetDate: '2026-12-24', appointments });

    fixture.nativeElement.querySelector('[data-testid="close"]').click();

    expect(close).toHaveBeenCalled();
  });
});
