import { TestBed } from '@angular/core/testing';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { of } from 'rxjs';
import { vi } from 'vitest';

/**
 * Makes the next dialog opened through {@link HlmDialogService} close immediately
 * with `result`, so feature specs can exercise the surrounding flow without
 * rendering an overlay.
 */
export function stubDialog(result: unknown) {
  return vi
    .spyOn(TestBed.inject(HlmDialogService), 'open')
    .mockReturnValue({ closed$: of(result) } as ReturnType<HlmDialogService['open']>);
}
