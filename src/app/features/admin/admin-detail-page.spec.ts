import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideIcons } from '@ng-icons/core';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CountdownRepository } from '../../core/data/countdown-repository';
import { HOW_LONG_DB, HowLongDatabase } from '../../core/data/db';
import { APP_ICONS } from '../../shared/icons';
import { settle } from '../../../testing/settle';
import { stubDialog } from '../../../testing/dialog';
import { provideNotificationSpy } from '../../../testing/notification';
import { AdminDetailPage } from './admin-detail-page';

describe('AdminDetailPage', () => {
  let db: HowLongDatabase;
  let repository: CountdownRepository;
  let fixture: ComponentFixture<AdminDetailPage>;
  let countdownId: number;
  let notifications: ReturnType<typeof provideNotificationSpy>['notifications'];

  beforeEach(async () => {
    db = new HowLongDatabase(`how-long-detail-${crypto.randomUUID()}`);
    const notificationSpy = provideNotificationSpy();
    notifications = notificationSpy.notifications;
    TestBed.configureTestingModule({
      providers: [
        { provide: HOW_LONG_DB, useValue: db },
        provideRouter([]),
        provideIcons(APP_ICONS),
        notificationSpy.provider,
      ],
    });
    repository = TestBed.inject(CountdownRepository);
    await db.open();
    countdownId = await repository.createCountdown({
      date: '2026-12-24',
      description: 'Christmas',
    });
  });

  afterEach(async () => {
    await db.delete();
  });

  async function render(id: number | string = countdownId): Promise<void> {
    fixture = TestBed.createComponent(AdminDetailPage);
    fixture.componentRef.setInput('id', String(id));
    await settle(fixture);
  }

  const addAppointment = (date: string, title: string) =>
    repository.createAppointment({
      countdownId,
      date,
      title,
      color: '#1e88e5',
      icon: 'lucideFlag',
    });

  it('shows the target date and description', async () => {
    await render();

    expect(
      fixture.nativeElement.querySelector('[data-testid="target-date"]').textContent.trim(),
    ).toBe('2026-12-24');
    expect(fixture.nativeElement.textContent).toContain('Christmas');
  });

  it('lists the appointments ordered by date', async () => {
    await addAppointment('2026-12-06', 'St Nicholas');
    await addAppointment('2026-12-01', 'Advent');

    await render();

    const titles = [
      ...fixture.nativeElement.querySelectorAll('main li > span > span:first-child'),
    ].map((node: Element) => node.textContent?.trim());
    expect(titles).toEqual(['Advent', 'St Nicholas']);
  });

  it('reports a countdown that does not exist', async () => {
    await render(4711);

    expect(fixture.nativeElement.querySelector('[data-testid="not-found"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="add-appointment"]')).toBeNull();
  });

  it('adds the appointment returned by the dialog', async () => {
    await render();
    stubDialog({ date: '2026-12-01', title: 'Advent', color: '#e53935', icon: 'lucideStar' });

    fixture.nativeElement.querySelector('[data-testid="add-appointment"]').click();
    await settle(fixture);

    expect(await repository.listAppointments(countdownId)).toMatchObject([
      { date: '2026-12-01', title: 'Advent', color: '#e53935', icon: 'lucideStar' },
    ]);
  });

  it('reports the invariant violation when the dialog returns a date on the target day', async () => {
    await render();
    stubDialog({ date: '2026-12-24', title: 'Too late', color: '#e53935', icon: 'lucideStar' });

    fixture.nativeElement.querySelector('[data-testid="add-appointment"]').click();
    await settle(fixture);

    expect(await repository.listAppointments(countdownId)).toEqual([]);
    expect(notifications.error).toHaveBeenCalledWith(
      expect.stringContaining('must be before the target date'),
    );
  });

  it('applies an edit to an existing appointment', async () => {
    await addAppointment('2026-12-01', 'Advent');
    await render();
    stubDialog({ date: '2026-12-02', title: 'Renamed', color: '#43a047', icon: 'lucideCake' });

    fixture.nativeElement.querySelector('[aria-label="Edit Advent"]').click();
    await settle(fixture);

    expect(await repository.listAppointments(countdownId)).toMatchObject([
      { date: '2026-12-02', title: 'Renamed', color: '#43a047', icon: 'lucideCake' },
    ]);
  });

  it('deletes an appointment once the confirmation is accepted', async () => {
    await addAppointment('2026-12-01', 'Advent');
    await render();
    stubDialog(true);

    fixture.nativeElement.querySelector('[aria-label="Delete Advent"]').click();
    await settle(fixture);

    expect(await repository.listAppointments(countdownId)).toEqual([]);
  });

  it('keeps the appointment when the confirmation is declined', async () => {
    await addAppointment('2026-12-01', 'Advent');
    await render();
    stubDialog(false);

    fixture.nativeElement.querySelector('[aria-label="Delete Advent"]').click();
    await settle(fixture);

    expect(await repository.listAppointments(countdownId)).toHaveLength(1);
  });

  it('applies an edit to the countdown itself', async () => {
    await render();
    stubDialog({ date: '2027-01-01', description: 'New year' });

    fixture.nativeElement.querySelector('[aria-label="Edit countdown"]').click();
    await settle(fixture);

    expect(await repository.getCountdown(countdownId)).toMatchObject({
      date: '2027-01-01',
      description: 'New year',
    });
  });

  it('refuses to move the target date before an existing appointment', async () => {
    await addAppointment('2026-12-01', 'Advent');
    await render();
    stubDialog({ date: '2026-11-01', description: undefined });

    fixture.nativeElement.querySelector('[aria-label="Edit countdown"]').click();
    await settle(fixture);

    expect((await repository.getCountdown(countdownId))?.date).toBe('2026-12-24');
    expect(notifications.error).toHaveBeenCalledWith(
      expect.stringContaining('must be before the target date'),
    );
  });
});
