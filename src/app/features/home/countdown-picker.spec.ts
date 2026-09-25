import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideIcons } from '@ng-icons/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Countdown } from '../../core/models';
import { APP_ICONS } from '../../shared/icons';
import { CountdownPicker } from './countdown-picker';

describe('CountdownPicker', () => {
  let fixture: ComponentFixture<CountdownPicker>;

  const christmas: Countdown = { id: 1, date: '2026-12-24', description: 'Christmas' };
  const newYear: Countdown = { id: 2, date: '2027-01-01', description: 'New year' };
  const undated: Countdown = { id: 3, date: '2027-06-01' };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideIcons(APP_ICONS)] });
  });

  function render(countdowns: Countdown[], selected: Countdown) {
    fixture = TestBed.createComponent(CountdownPicker);
    fixture.componentRef.setInput('countdowns', countdowns);
    fixture.componentRef.setInput('selected', selected);
    fixture.detectChanges();
    return fixture;
  }

  const trigger = () => fixture.nativeElement.querySelector('[data-testid="target-date"]');

  async function openMenu() {
    trigger().click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  const menuItems = () =>
    [...document.querySelectorAll('[data-testid="countdown-menu"] button')].map((b) =>
      b.textContent?.replace(/\s+/g, ' ').trim(),
    );

  it('renders the selected date', () => {
    render([christmas, newYear], christmas);

    expect(trigger().textContent.trim()).toContain('2026-12-24');
  });

  it('is a plain paragraph when there is nothing to pick', () => {
    render([christmas], christmas);

    expect(trigger().tagName).toBe('P');
    expect(trigger().textContent.trim()).toBe('2026-12-24');
  });

  it('becomes a button as soon as a second countdown exists', () => {
    render([christmas, newYear], christmas);

    expect(trigger().tagName).toBe('BUTTON');
  });

  it('lists every countdown with its description', async () => {
    render([christmas, newYear, undated], christmas);

    await openMenu();

    const items = menuItems();
    expect(items).toHaveLength(3);
    expect(items[0]).toContain('2026-12-24');
    expect(items[0]).toContain('Christmas');
    expect(items[2]).toContain('2027-06-01');
  });

  it('marks the selected countdown as current', async () => {
    render([christmas, newYear], newYear);

    await openMenu();

    expect(
      document.querySelector('[data-testid="countdown-option-2"]')?.getAttribute('aria-current'),
    ).toBe('true');
    expect(
      document.querySelector('[data-testid="countdown-option-1"]')?.getAttribute('aria-current'),
    ).toBe('false');
  });

  it('emits the countdown that was picked', async () => {
    render([christmas, newYear], christmas);
    const picked = vi.fn();
    fixture.componentInstance.selectedChange.subscribe(picked);

    await openMenu();
    (document.querySelector('[data-testid="countdown-option-2"]') as HTMLElement).click();

    expect(picked).toHaveBeenCalledWith(newYear);
  });
});
