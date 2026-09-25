import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CountdownRepository } from '../../core/data/countdown-repository';
import { HOW_LONG_DB, HowLongDatabase } from '../../core/data/db';
import { toIsoDate } from '../../core/services/date-utils';
import { settle } from '../../../testing/settle';
import { memoryStorage } from '../../../testing/storage';
import { CountdownPicker } from './countdown-picker';
import { HomePage } from './home-page';
import { COUNTDOWN_STORAGE } from './remembered-countdown';
import { provideTestIcons } from '../../../testing/icons';

describe('HomePage', () => {
  let db: HowLongDatabase;
  let repository: CountdownRepository;
  let fixture: ComponentFixture<HomePage>;
  let storage: Storage;

  const today = new Date();
  const inDays = (days: number) =>
    toIsoDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + days));

  const text = (testId: string) =>
    fixture.nativeElement.querySelector(`[data-testid="${testId}"]`)?.textContent?.trim();

  beforeEach(async () => {
    db = new HowLongDatabase(`how-long-home-${crypto.randomUUID()}`);
    storage = memoryStorage();
    TestBed.configureTestingModule({
      providers: [
        { provide: HOW_LONG_DB, useValue: db },
        { provide: COUNTDOWN_STORAGE, useValue: storage },
        provideRouter([]),
        provideTestIcons(),
      ],
    });
    repository = TestBed.inject(CountdownRepository);
    await db.open();
  });

  afterEach(async () => {
    await db.delete();
  });

  /** Creates the component and lets its Dexie live queries settle. */
  async function render(selectedId?: number | string): Promise<void> {
    fixture = TestBed.createComponent(HomePage);
    if (selectedId !== undefined) {
      fixture.componentRef.setInput('countdown', String(selectedId));
    }
    await settle(fixture);
  }

  const addAppointment = (countdownId: number, date: string, title: string) =>
    repository.createAppointment({
      countdownId,
      date,
      title,
      color: '#1e88e5',
      icon: 'lucideFlag',
    });

  it('shows the day count, target date and description', async () => {
    await repository.createCountdown({ date: inDays(42), description: 'Project launch' });

    await render();

    expect(text('day-count')).toBe('42');
    expect(text('day-label')).toBe('days to go');
    expect(text('target-date')).toBe(inDays(42));
    expect(text('description')).toBe('Project launch');
  });

  it('uses the singular label one day before the target', async () => {
    await repository.createCountdown({ date: inDays(1) });

    await render();

    expect(text('day-count')).toBe('1');
    expect(text('day-label')).toBe('day to go');
  });

  it('says "today" on the target date', async () => {
    await repository.createCountdown({ date: inDays(0) });

    await render();

    expect(text('day-count')).toBe('0');
    expect(text('day-label')).toBe('today');
  });

  it('counts up when every countdown has already passed', async () => {
    await repository.createCountdown({ date: inDays(-3) });

    await render();

    expect(text('day-count')).toBe('3');
    expect(text('day-label')).toBe('days ago');
  });

  describe('when the target date is close', () => {
    const isUrgent = () => ({
      page: (fixture.nativeElement as HTMLElement).hasAttribute('data-urgent'),
      circle: fixture.nativeElement
        .querySelector('[data-testid="day-circle"]')
        .hasAttribute('data-urgent'),
    });

    it.each([3, 1, 0])('tints the page and lights the circle %i day(s) before', async (days) => {
      await repository.createCountdown({ date: inDays(days) });

      await render();

      expect(isUrgent()).toEqual({ page: true, circle: true });
    });

    it('stays calm four days before', async () => {
      await repository.createCountdown({ date: inDays(4) });

      await render();

      expect(isUrgent()).toEqual({ page: false, circle: false });
    });

    it('stays calm once the date has passed', async () => {
      await repository.createCountdown({ date: inDays(-1) });

      await render();

      expect(isUrgent()).toEqual({ page: false, circle: false });
    });

    it('follows the countdown picked in the URL', async () => {
      await repository.createCountdown({ date: inDays(2) });
      const later = await repository.createCountdown({ date: inDays(30) });

      await render(later);

      expect(isUrgent()).toEqual({ page: false, circle: false });
    });
  });

  it('keeps the page calm when the database is empty', async () => {
    await render();

    expect((fixture.nativeElement as HTMLElement).hasAttribute('data-urgent')).toBe(false);
  });

  it('prompts to create a countdown when the database is empty', async () => {
    await render();

    expect(text('empty-state')).toBe('No countdown configured yet.');
    expect(text('day-count')).toBeUndefined();
  });

  it('previews at most five upcoming appointments and offers the rest behind "More"', async () => {
    const countdownId = await repository.createCountdown({ date: inDays(60) });
    for (let i = 1; i <= 7; i++) {
      await repository.createAppointment({
        countdownId,
        date: inDays(i),
        title: `Milestone ${i}`,
        color: '#1e88e5',
        icon: 'flag',
      });
    }

    await render();

    const titles = [...fixture.nativeElement.querySelectorAll('app-appointment-list li')].map(
      (li: Element) => li.textContent?.trim(),
    );
    expect(titles).toHaveLength(5);
    expect(titles[0]).toContain('Milestone 1');
    expect(titles[4]).toContain('Milestone 5');
    expect(text('more-button')).toBe('More (7)');
  });

  it('leaves past appointments out of the preview', async () => {
    const countdownId = await repository.createCountdown({ date: inDays(60) });
    await repository.createAppointment({
      countdownId,
      date: inDays(-5),
      title: 'Already done',
      color: '#1e88e5',
      icon: 'flag',
    });
    await repository.createAppointment({
      countdownId,
      date: inDays(5),
      title: 'Still ahead',
      color: '#1e88e5',
      icon: 'flag',
    });

    await render();

    const list = fixture.nativeElement.querySelector('app-appointment-list').textContent;
    expect(list).toContain('Still ahead');
    expect(list).not.toContain('Already done');
  });

  it('hides the "More" button when every appointment already fits', async () => {
    const countdownId = await repository.createCountdown({ date: inDays(60) });
    await repository.createAppointment({
      countdownId,
      date: inDays(5),
      title: 'Only one',
      color: '#1e88e5',
      icon: 'flag',
    });

    await render();

    expect(text('more-button')).toBeUndefined();
  });

  it('links the FAB to the administration area', async () => {
    await repository.createCountdown({ date: inDays(10) });

    await render();

    expect(
      fixture.nativeElement.querySelector('[data-testid="admin-fab"]').getAttribute('href'),
    ).toBe('/admin');
  });

  describe('remembering the pick', () => {
    /** A new page instance, as after reopening the app without a query parameter. */
    async function reopen(): Promise<void> {
      fixture.destroy();
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          { provide: HOW_LONG_DB, useValue: db },
          { provide: COUNTDOWN_STORAGE, useValue: storage },
          provideRouter([]),
          provideTestIcons(),
        ],
      });
      await render();
    }

    it('shows the picked countdown again after reopening the app', async () => {
      await repository.createCountdown({ date: inDays(10), description: 'Sooner' });
      const later = await repository.createCountdown({ date: inDays(60), description: 'Later' });
      await render(later);

      await reopen();

      expect(text('description')).toBe('Later');
    });

    it('shows the next countdown due while nothing has been picked', async () => {
      await repository.createCountdown({ date: inDays(60), description: 'Later' });
      await repository.createCountdown({ date: inDays(10), description: 'Sooner' });

      await render();

      expect(text('description')).toBe('Sooner');
      expect(storage.length).toBe(0);
    });

    it('lets the query parameter win over the remembered pick', async () => {
      const sooner = await repository.createCountdown({ date: inDays(10), description: 'Sooner' });
      const later = await repository.createCountdown({ date: inDays(60), description: 'Later' });
      await render(later);
      fixture.destroy();

      await render(sooner);

      expect(text('description')).toBe('Sooner');
    });

    it('moves on to the next countdown once the remembered one has passed', async () => {
      const passed = await repository.createCountdown({ date: inDays(-2), description: 'Passed' });
      await repository.createCountdown({ date: inDays(10), description: 'Sooner' });
      await render(passed);

      await reopen();

      expect(text('description')).toBe('Sooner');
    });

    it('keeps the remembered countdown on its target day', async () => {
      await repository.createCountdown({ date: inDays(10), description: 'Sooner' });
      const today = await repository.createCountdown({ date: inDays(0), description: 'Today' });
      await render(today);

      await reopen();

      expect(text('description')).toBe('Today');
    });

    it('still shows a passed countdown named by the query parameter', async () => {
      const passed = await repository.createCountdown({ date: inDays(-2), description: 'Passed' });
      await repository.createCountdown({ date: inDays(10), description: 'Sooner' });

      await render(passed);

      expect(text('description')).toBe('Passed');
    });

    it('falls back to the next countdown once the remembered one is deleted', async () => {
      await repository.createCountdown({ date: inDays(10), description: 'Sooner' });
      const later = await repository.createCountdown({ date: inDays(60), description: 'Later' });
      await render(later);
      await repository.deleteCountdown(later);

      await reopen();

      expect(text('description')).toBe('Sooner');
    });
  });

  describe('switching between countdowns', () => {
    it('shows the countdown named by the query parameter, not the next one due', async () => {
      await repository.createCountdown({ date: inDays(10), description: 'Sooner' });
      const later = await repository.createCountdown({ date: inDays(60), description: 'Later' });

      await render(later);

      expect(text('target-date')).toContain(inDays(60));
      expect(text('description')).toBe('Later');
    });

    it('shows the appointments of the picked countdown', async () => {
      const sooner = await repository.createCountdown({ date: inDays(10) });
      const later = await repository.createCountdown({ date: inDays(60) });
      await addAppointment(sooner, inDays(5), 'Belongs to the sooner one');
      await addAppointment(later, inDays(30), 'Belongs to the later one');

      await render(later);

      const list = fixture.nativeElement.querySelector('app-appointment-list').textContent;
      expect(list).toContain('Belongs to the later one');
      expect(list).not.toContain('Belongs to the sooner one');
    });

    it('falls back to the next countdown when the parameter names a deleted one', async () => {
      await repository.createCountdown({ date: inDays(10), description: 'Sooner' });

      await render(4711);

      expect(text('target-date')).toContain(inDays(10));
    });

    it('falls back to the next countdown when the parameter is not a number', async () => {
      await repository.createCountdown({ date: inDays(10), description: 'Sooner' });

      await render('not-an-id');

      expect(text('target-date')).toContain(inDays(10));
    });

    it('puts the pick in the URL so it survives a reload', async () => {
      await repository.createCountdown({ date: inDays(10) });
      const later = await repository.createCountdown({ date: inDays(60) });
      await render();
      const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

      const picker = fixture.debugElement.query(By.directive(CountdownPicker));
      picker.componentInstance.selectedChange.emit({ id: later, date: inDays(60) });

      expect(navigate).toHaveBeenCalledWith([], { queryParams: { countdown: later } });
    });

    it('offers no picker while only one countdown exists', async () => {
      await repository.createCountdown({ date: inDays(10) });

      await render();

      expect(fixture.nativeElement.querySelector('[data-testid="target-date"]').tagName).toBe('P');
    });

    it('offers a picker as soon as there are two', async () => {
      await repository.createCountdown({ date: inDays(10) });
      await repository.createCountdown({ date: inDays(60) });

      await render();

      expect(fixture.nativeElement.querySelector('[data-testid="target-date"]').tagName).toBe(
        'BUTTON',
      );
    });
  });
});
