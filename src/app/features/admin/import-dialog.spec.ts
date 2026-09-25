import { DIALOG_DATA } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { BrnDialogRef } from '@spartan-ng/brain/dialog';
import { describe, expect, it, vi } from 'vitest';
import { BACKUP_VERSION, Backup } from '../../core/models';
import { ImportDialog, ImportDialogContext } from './import-dialog';

describe('ImportDialog', () => {
  const close = vi.fn();

  const backup: Backup = {
    version: BACKUP_VERSION,
    exportedAt: '2026-09-25T00:00:00.000Z',
    countdowns: [
      {
        date: '2026-12-24',
        appointments: [
          { date: '2026-12-01', title: 'a', color: '#1e88e5', icon: 'lucideFlag' },
          { date: '2026-12-06', title: 'b', color: '#1e88e5', icon: 'lucideFlag' },
        ],
      },
      { date: '2027-01-01', appointments: [] },
    ],
  };

  function render(context: ImportDialogContext) {
    close.mockClear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: DIALOG_DATA, useValue: context },
        { provide: BrnDialogRef, useValue: { close } },
      ],
    });
    const fixture = TestBed.createComponent(ImportDialog);
    fixture.detectChanges();
    return fixture;
  }

  it('summarises how much the file holds', () => {
    const fixture = render({ backup, existingCountdowns: 0 });

    const text = fixture.nativeElement.textContent.replace(/\s+/g, ' ');
    expect(text).toContain('2 countdown(s)');
    expect(text).toContain('2 appointment(s)');
  });

  it('warns about the data that replacing would discard', () => {
    const fixture = render({ backup, existingCountdowns: 3 });

    expect(fixture.nativeElement.textContent).toContain('discards the 3 countdown(s)');
  });

  it('stays quiet about replacing when the database is empty', () => {
    const fixture = render({ backup, existingCountdowns: 0 });

    expect(fixture.nativeElement.textContent).not.toContain('discards');
  });

  it.each([
    ['replace', 'replace'],
    ['merge', 'merge'],
  ])('closes with "%s" when that button is pressed', (testId, expected) => {
    const fixture = render({ backup, existingCountdowns: 1 });

    fixture.nativeElement.querySelector(`[data-testid="${testId}"]`).click();

    expect(close).toHaveBeenCalledWith(expected);
  });

  it('closes with undefined when cancelled', () => {
    const fixture = render({ backup, existingCountdowns: 1 });

    fixture.nativeElement.querySelector('[data-testid="cancel"]').click();

    expect(close).toHaveBeenCalledWith(undefined);
  });
});
