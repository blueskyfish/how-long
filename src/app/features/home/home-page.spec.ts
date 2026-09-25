import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideIcons } from '@ng-icons/core';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CountdownRepository } from '../../core/data/countdown-repository';
import { HOW_LONG_DB, HowLongDatabase } from '../../core/data/db';
import { toIsoDate } from '../../core/services/date-utils';
import { APP_ICONS } from '../../shared/icons';
import { settle } from '../../../testing/settle';
import { HomePage } from './home-page';

describe('HomePage', () => {
  let db: HowLongDatabase;
  let repository: CountdownRepository;
  let fixture: ComponentFixture<HomePage>;

  const today = new Date();
  const inDays = (days: number) =>
    toIsoDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + days));

  const text = (testId: string) =>
    fixture.nativeElement.querySelector(`[data-testid="${testId}"]`)?.textContent?.trim();

  beforeEach(async () => {
    db = new HowLongDatabase(`how-long-home-${crypto.randomUUID()}`);
    TestBed.configureTestingModule({
      providers: [
        { provide: HOW_LONG_DB, useValue: db },
        provideRouter([]),
        provideIcons(APP_ICONS),
      ],
    });
    repository = TestBed.inject(CountdownRepository);
    await db.open();
  });

  afterEach(async () => {
    await db.delete();
  });

  /** Creates the component and lets its Dexie live queries settle. */
  async function render(): Promise<void> {
    fixture = TestBed.createComponent(HomePage);
    await settle(fixture);
  }

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
});
