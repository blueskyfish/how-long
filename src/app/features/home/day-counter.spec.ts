import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { DayCounter } from './day-counter';

describe('DayCounter', () => {
  let fixture: ComponentFixture<DayCounter>;

  function render(days: number) {
    fixture = TestBed.createComponent(DayCounter);
    fixture.componentRef.setInput('days', days);
    fixture.detectChanges();
    return fixture;
  }

  const text = (testId: string) =>
    fixture.nativeElement.querySelector(`[data-testid="${testId}"]`).textContent.trim();

  const circle = () => fixture.nativeElement.querySelector('div');

  it.each([
    [42, '42', 'days to go'],
    [1, '1', 'day to go'],
    [0, '0', 'today'],
    [-1, '1', 'day ago'],
    [-3, '3', 'days ago'],
  ])('renders %i as "%s %s"', (days, count, label) => {
    render(days);

    expect(text('day-count')).toBe(count);
    expect(text('day-label')).toBe(label);
  });

  it('shows a passed date as a positive number, not a minus sign', () => {
    render(-250);

    expect(text('day-count')).toBe('250');
  });

  it('is a circle', () => {
    render(42);

    expect(circle().className).toContain('rounded-[50%]');
    expect(circle().className).toContain('aspect-square');
  });

  it.each([
    [7, 'text-[55cqw]'],
    [42, 'text-[42cqw]'],
    [365, 'text-[32cqw]'],
    [1000, 'text-[25cqw]'],
    [-4000, 'text-[25cqw]'],
  ])('steps the type down for %i so it stays inside the circle', (days, expected) => {
    render(days);

    expect(fixture.nativeElement.querySelector('[data-testid="day-count"]').className).toContain(
      expected,
    );
  });

  it('sizes the number against the circle, not the viewport', () => {
    render(42);

    // cqw only resolves if the circle is itself a container.
    expect(circle().className).toContain('@container');
    expect(fixture.nativeElement.querySelector('[data-testid="day-count"]').className).toContain(
      'cqw',
    );
  });

  it('sets the number in bold', () => {
    render(42);

    expect(fixture.nativeElement.querySelector('[data-testid="day-count"]').className).toContain(
      'font-bold',
    );
  });

  it('stays calm by default', () => {
    render(2);

    expect(circle().hasAttribute('data-urgent')).toBe(false);
  });

  it('turns the rim red and glows when urgent', () => {
    fixture = TestBed.createComponent(DayCounter);
    fixture.componentRef.setInput('days', 2);
    fixture.componentRef.setInput('urgent', true);
    fixture.detectChanges();

    expect(circle().hasAttribute('data-urgent')).toBe(true);
    expect(circle().className).toContain('data-urgent:border-destructive/40');
    expect(circle().className).toContain('data-urgent:shadow-');
  });
});
