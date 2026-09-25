import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { routerFeatures } from './app.config';
import { routes } from './app.routes';
import { CountdownRepository } from './core/data/countdown-repository';
import { HOW_LONG_DB, HowLongDatabase } from './core/data/db';
import { AdminDetailPage } from './features/admin/admin-detail-page';
import { AdminOverviewPage } from './features/admin/admin-overview-page';
import { HomePage } from './features/home/home-page';
import { settle } from '../testing/settle';
import { provideTestIcons } from '../testing/icons';

describe('routing', () => {
  let db: HowLongDatabase;
  let repository: CountdownRepository;

  beforeEach(async () => {
    db = new HowLongDatabase(`how-long-routes-${crypto.randomUUID()}`);
    TestBed.configureTestingModule({
      providers: [
        { provide: HOW_LONG_DB, useValue: db },
        provideRouter(routes, ...routerFeatures),
        provideTestIcons(),
      ],
    });
    repository = TestBed.inject(CountdownRepository);
    await db.open();
  });

  afterEach(async () => {
    await db.delete();
  });

  it('serves the countdown at the root path', async () => {
    const harness = await RouterTestingHarness.create();

    const component = await harness.navigateByUrl('/', HomePage);

    expect(component).toBeInstanceOf(HomePage);
  });

  it('serves the administration overview at /admin', async () => {
    const harness = await RouterTestingHarness.create();

    const component = await harness.navigateByUrl('/admin', AdminOverviewPage);

    expect(component).toBeInstanceOf(AdminOverviewPage);
  });

  it('binds the :id route parameter into the detail page', async () => {
    const id = await repository.createCountdown({ date: '2026-12-24', description: 'Christmas' });
    const harness = await RouterTestingHarness.create();

    const component = await harness.navigateByUrl(`/admin/${id}`, AdminDetailPage);
    await settle(harness.fixture);

    expect(component.id()).toBe(String(id));
    expect(harness.routeNativeElement?.textContent).toContain('2026-12-24');
  });

  it('falls back to the countdown for an unknown path', async () => {
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/does-not-exist');

    expect(TestBed.inject(Router).url).toBe('/');
  });
});
