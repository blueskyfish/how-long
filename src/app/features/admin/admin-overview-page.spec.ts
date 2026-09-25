import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CountdownRepository } from '../../core/data/countdown-repository';
import { HOW_LONG_DB, HowLongDatabase } from '../../core/data/db';
import { settle } from '../../../testing/settle';
import { stubDialog } from '../../../testing/dialog';
import { provideNotificationSpy } from '../../../testing/notification';
import { AdminOverviewPage } from './admin-overview-page';
import { provideTestIcons } from '../../../testing/icons';

describe('AdminOverviewPage', () => {
  let db: HowLongDatabase;
  let repository: CountdownRepository;
  let fixture: ComponentFixture<AdminOverviewPage>;

  beforeEach(async () => {
    db = new HowLongDatabase(`how-long-overview-${crypto.randomUUID()}`);
    TestBed.configureTestingModule({
      providers: [
        { provide: HOW_LONG_DB, useValue: db },
        provideRouter([]),
        provideTestIcons(),
        provideNotificationSpy().provider,
      ],
    });
    repository = TestBed.inject(CountdownRepository);
    await db.open();
  });

  afterEach(async () => {
    await db.delete();
  });

  async function render(): Promise<void> {
    fixture = TestBed.createComponent(AdminOverviewPage);
    await settle(fixture);
  }

  it('lists the stored countdowns ordered by date', async () => {
    await repository.createCountdown({ date: '2026-12-24', description: 'Christmas' });
    await repository.createCountdown({ date: '2026-01-01', description: 'New year' });

    await render();

    const rows = [...fixture.nativeElement.querySelectorAll('main li')].map((row: Element) =>
      row.textContent?.replace(/\s+/g, ' ').trim(),
    );
    expect(rows).toHaveLength(2);
    expect(rows[0]).toContain('2026-01-01');
    expect(rows[0]).toContain('New year');
    expect(rows[1]).toContain('2026-12-24');
  });

  it('explains how to get started when there is nothing stored', async () => {
    await render();

    expect(fixture.nativeElement.querySelector('[data-testid="empty-state"]')).toBeTruthy();
  });

  it('links each row to its detail page', async () => {
    const id = await repository.createCountdown({ date: '2026-12-24' });

    await render();

    expect(fixture.nativeElement.querySelector('main li a').getAttribute('href')).toBe(
      `/admin/${id}`,
    );
  });

  it('stores the countdown returned by the create dialog', async () => {
    await render();
    stubDialog({ date: '2026-12-24', description: 'Christmas' });

    fixture.nativeElement.querySelector('[data-testid="add-countdown"]').click();
    await settle(fixture);

    expect(await repository.listCountdowns()).toMatchObject([
      { date: '2026-12-24', description: 'Christmas' },
    ]);
  });

  it('stores nothing when the create dialog is cancelled', async () => {
    await render();
    stubDialog(undefined);

    fixture.nativeElement.querySelector('[data-testid="add-countdown"]').click();
    await settle(fixture);

    expect(await repository.listCountdowns()).toEqual([]);
  });

  it('deletes a countdown once the confirmation is accepted', async () => {
    await repository.createCountdown({ date: '2026-12-24' });
    await render();
    stubDialog(true);

    fixture.nativeElement.querySelector('[aria-label="Delete countdown 2026-12-24"]').click();
    await settle(fixture);

    expect(await repository.listCountdowns()).toEqual([]);
  });

  it('keeps the countdown when the confirmation is declined', async () => {
    await repository.createCountdown({ date: '2026-12-24' });
    await render();
    stubDialog(false);

    fixture.nativeElement.querySelector('[aria-label="Delete countdown 2026-12-24"]').click();
    await settle(fixture);

    expect(await repository.listCountdowns()).toHaveLength(1);
  });

  it('highlights the drop zone while a file is dragged over the page', async () => {
    await render();
    const dataTransfer = { types: ['Files'] } as unknown as DataTransfer;

    fixture.nativeElement.dispatchEvent(
      Object.assign(new Event('dragover', { bubbles: true }), { dataTransfer }),
    );
    await settle(fixture, 2);

    expect(fixture.nativeElement.textContent).toContain('Drop a JSON backup to import');
  });

  it('ignores drags that do not carry a file', async () => {
    await render();
    const dataTransfer = { types: ['text/plain'] } as unknown as DataTransfer;

    fixture.nativeElement.dispatchEvent(
      Object.assign(new Event('dragover', { bubbles: true }), { dataTransfer }),
    );
    await settle(fixture, 2);

    expect(fixture.nativeElement.textContent).not.toContain('Drop a JSON backup to import');
  });
});
