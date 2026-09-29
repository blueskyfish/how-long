import { Component, DOCUMENT } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { touch } from '../../../testing/touch';
import { PULL_THRESHOLD_PX, PullToRefresh } from './pull-to-refresh';

@Component({
  imports: [PullToRefresh],
  template: `<div appPullToRefresh (refresh)="refreshes = refreshes + 1"></div>`,
})
class Host {
  refreshes = 0;
}

describe('PullToRefresh', () => {
  let fixture: ComponentFixture<Host>;
  let element: HTMLElement;
  let directive: PullToRefresh;

  beforeEach(() => {
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    element = fixture.nativeElement.querySelector('div');
    directive = fixture.debugElement.children[0].injector.get(PullToRefresh);
  });

  /** A drag straight down, in raw finger pixels. */
  function drag(dy: number, dx = 0): void {
    touch(element, 'touchstart', [{ x: 100, y: 100 }]);
    touch(element, 'touchmove', [{ x: 100 + dx, y: 100 + dy }]);
  }

  it('refreshes when a pull is released past the threshold', () => {
    drag(PULL_THRESHOLD_PX * 2 + 10);
    expect(directive.armed()).toBe(true);

    touch(element, 'touchend', []);

    expect(fixture.componentInstance.refreshes).toBe(1);
    expect(directive.distance()).toBe(0);
  });

  it('damps the pull and stops following the finger eventually', () => {
    drag(40);
    expect(directive.distance()).toBe(20);

    touch(element, 'touchmove', [{ x: 100, y: 1000 }]);
    expect(directive.distance()).toBe(96);
  });

  it('does nothing when released short of the threshold', () => {
    drag(PULL_THRESHOLD_PX);

    touch(element, 'touchend', []);

    expect(fixture.componentInstance.refreshes).toBe(0);
  });

  it('ignores a mostly sideways swipe', () => {
    drag(150, 200);

    touch(element, 'touchend', []);

    expect(directive.distance()).toBe(0);
    expect(fixture.componentInstance.refreshes).toBe(0);
  });

  it('ignores an upward drag', () => {
    drag(-150);

    touch(element, 'touchend', []);

    expect(fixture.componentInstance.refreshes).toBe(0);
  });

  it('gives up as soon as a second finger joins', () => {
    drag(200);

    touch(element, 'touchmove', [
      { x: 100, y: 300 },
      { x: 200, y: 300 },
    ]);
    touch(element, 'touchend', []);

    expect(fixture.componentInstance.refreshes).toBe(0);
  });

  it('does nothing when the gesture is cancelled', () => {
    drag(200);

    touch(element, 'touchcancel', []);

    expect(fixture.componentInstance.refreshes).toBe(0);
  });

  it('only starts at the top of the page', () => {
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 120 });
    try {
      drag(200);
      touch(element, 'touchend', []);
    } finally {
      Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
    }

    expect(fixture.componentInstance.refreshes).toBe(0);
  });

  it("switches the browser's own pull-to-refresh off while it is alive", () => {
    const root = TestBed.inject(DOCUMENT).documentElement;
    expect(root.style.overscrollBehaviorY).toBe('contain');

    fixture.destroy();

    expect(root.style.overscrollBehaviorY).toBe('');
  });
});
