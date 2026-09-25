import { DIALOG_DATA } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { BrnDialogRef } from '@spartan-ng/brain/dialog';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmDialog, ConfirmDialogContext } from './confirm-dialog';

describe('ConfirmDialog', () => {
  const close = vi.fn();

  function render(context: ConfirmDialogContext) {
    close.mockClear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: DIALOG_DATA, useValue: context },
        { provide: BrnDialogRef, useValue: { close } },
      ],
    });
    const fixture = TestBed.createComponent(ConfirmDialog);
    fixture.detectChanges();
    return fixture;
  }

  const context: ConfirmDialogContext = {
    title: 'Delete countdown?',
    message: '2026-12-24 and all of its appointments will be removed.',
  };

  it('shows the title and message', () => {
    const fixture = render(context);

    expect(fixture.nativeElement.textContent).toContain('Delete countdown?');
    expect(fixture.nativeElement.textContent).toContain('will be removed');
  });

  it('defaults the confirm button to "Delete"', () => {
    const fixture = render(context);

    expect(fixture.nativeElement.querySelector('[data-testid="confirm"]').textContent.trim()).toBe(
      'Delete',
    );
  });

  it('uses a custom confirm label when given', () => {
    const fixture = render({ ...context, confirmLabel: 'Discard' });

    expect(fixture.nativeElement.querySelector('[data-testid="confirm"]').textContent.trim()).toBe(
      'Discard',
    );
  });

  it('closes with true when confirmed', () => {
    const fixture = render(context);

    fixture.nativeElement.querySelector('[data-testid="confirm"]').click();

    expect(close).toHaveBeenCalledWith(true);
  });

  it('closes with false when cancelled', () => {
    const fixture = render(context);

    fixture.nativeElement.querySelector('[data-testid="cancel"]').click();

    expect(close).toHaveBeenCalledWith(false);
  });
});
