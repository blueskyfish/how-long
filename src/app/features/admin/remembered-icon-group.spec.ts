import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { RememberedIconGroup } from './remembered-icon-group';

describe('RememberedIconGroup', () => {
  const setup = () => TestBed.inject(RememberedIconGroup);

  it('remembers nothing at first', () => {
    expect(setup().groupFor(1)).toBeUndefined();
  });

  it('hands back the group remembered for the same countdown', () => {
    const remembered = setup();
    remembered.enter(1);

    remembered.remember(1, 'Celebrations');

    expect(remembered.groupFor(1)).toBe('Celebrations');
  });

  it('keeps the group when the same countdown is opened again', () => {
    const remembered = setup();
    remembered.remember(1, 'Celebrations');

    remembered.enter(1);

    expect(remembered.groupFor(1)).toBe('Celebrations');
  });

  it('forgets the group once another countdown is opened', () => {
    const remembered = setup();
    remembered.remember(1, 'Celebrations');

    remembered.enter(2);
    remembered.enter(1);

    expect(remembered.groupFor(1)).toBeUndefined();
  });

  it('never hands a group to another countdown', () => {
    const remembered = setup();
    remembered.remember(1, 'Celebrations');

    expect(remembered.groupFor(2)).toBeUndefined();
  });
});
