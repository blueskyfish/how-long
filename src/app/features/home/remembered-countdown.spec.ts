import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { memoryStorage } from '../../../testing/storage';
import { COUNTDOWN_STORAGE, RememberedCountdown } from './remembered-countdown';

const KEY = 'how-long.selected-countdown';

describe('RememberedCountdown', () => {
  function setup(storage: Storage | null): RememberedCountdown {
    TestBed.configureTestingModule({
      providers: [{ provide: COUNTDOWN_STORAGE, useValue: storage }],
    });
    return TestBed.inject(RememberedCountdown);
  }

  it('starts with nothing remembered', () => {
    expect(setup(memoryStorage()).id()).toBeUndefined();
  });

  it('reads a pick kept by an earlier visit', () => {
    expect(setup(memoryStorage({ [KEY]: '3' })).id()).toBe(3);
  });

  it.each(['', 'abc', '2.5'])('ignores a stored value of "%s"', (value) => {
    expect(setup(memoryStorage({ [KEY]: value })).id()).toBeUndefined();
  });

  it('keeps a pick in storage', () => {
    const storage = memoryStorage();
    const remembered = setup(storage);

    remembered.remember(7);

    expect(remembered.id()).toBe(7);
    expect(storage.getItem(KEY)).toBe('7');
  });

  it('still remembers for the session when storage is unavailable', () => {
    const remembered = setup(null);

    remembered.remember(7);

    expect(remembered.id()).toBe(7);
  });

  it('survives storage that throws', () => {
    const throwing = {
      ...memoryStorage(),
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('full');
      },
    } as Storage;
    const remembered = setup(throwing);

    expect(remembered.id()).toBeUndefined();
    expect(() => remembered.remember(7)).not.toThrow();
    expect(remembered.id()).toBe(7);
  });
});
