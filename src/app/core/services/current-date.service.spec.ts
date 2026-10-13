import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { toIsoDate } from './date-utils';
import { CurrentDateService } from './current-date.service';

describe('CurrentDateService', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
  });

  it('refreshes at the next local midnight', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 13, 23, 59, 59, 900));
    TestBed.configureTestingModule({});
    const service = TestBed.inject(CurrentDateService);

    vi.advanceTimersByTime(100);

    expect(toIsoDate(service.today())).toBe('2026-10-14');
  });

  it('refreshes when a page is restored from the back-forward cache', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 13, 12));
    TestBed.configureTestingModule({});
    const service = TestBed.inject(CurrentDateService);

    vi.setSystemTime(new Date(2026, 9, 14, 12));
    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));

    expect(toIsoDate(service.today())).toBe('2026-10-14');
  });
});
