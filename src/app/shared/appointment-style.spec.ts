import * as lucide from '@ng-icons/lucide';
import { describe, expect, it } from 'vitest';
import { APPOINTMENT_ICON_SVGS } from './appointment-icon-svgs';
import {
  APPOINTMENT_ICON_GROUPS,
  APPOINTMENT_ICONS,
  DEFAULT_APPOINTMENT_ICON,
  groupOfIcon,
} from './appointment-style';
import { loadAppointmentIcon } from './icons';

describe('APPOINTMENT_ICONS', () => {
  it('has an SVG for every icon it offers', () => {
    const missing = APPOINTMENT_ICONS.map((icon) => icon.value).filter(
      (value) => !APPOINTMENT_ICON_SVGS[value],
    );

    expect(missing).toEqual([]);
  });

  it('matches the generated SVGs; run `npm run icons:generate` if not', () => {
    const offered = [...new Set(APPOINTMENT_ICONS.map((icon) => icon.value))].sort();
    const library = lucide as unknown as Record<string, string>;

    expect(Object.keys(APPOINTMENT_ICON_SVGS).sort()).toEqual(offered);
    for (const value of offered) {
      expect(APPOINTMENT_ICON_SVGS[value], value).toBe(library[value]);
    }
  });

  it('offers every icon and every label only once', () => {
    const values = APPOINTMENT_ICONS.map((icon) => icon.value);
    const names = APPOINTMENT_ICONS.map((icon) => icon.name);

    expect(new Set(values).size).toBe(values.length);
    expect(new Set(names).size).toBe(names.length);
  });

  it.each(APPOINTMENT_ICON_GROUPS)('offers 20 to 30 icons in "%s"', (group) => {
    const count = APPOINTMENT_ICONS.filter((icon) => icon.group === group).length;

    expect(count).toBeGreaterThanOrEqual(20);
    expect(count).toBeLessThanOrEqual(30);
  });

  it('lists the icons group by group, in the order of the dropdown', () => {
    const order = [...new Set(APPOINTMENT_ICONS.map((icon) => icon.group))];

    expect(order).toEqual([...APPOINTMENT_ICON_GROUPS]);
  });

  it('still offers every icon an existing appointment may use', () => {
    const before = [
      'lucideCalendar',
      'lucideFlag',
      'lucideStar',
      'lucideHeart',
      'lucidePartyPopper',
      'lucideCake',
      'lucideGift',
      'lucideGraduationCap',
      'lucideBriefcase',
      'lucidePlane',
      'lucideHotel',
      'lucideCar',
      'lucideUtensils',
      'lucideTrophy',
      'lucideMusic',
      'lucideStethoscope',
      'lucideBanknote',
      'lucideListChecks',
      'lucideAlarmClock',
      'lucideUmbrella',
    ];

    expect(APPOINTMENT_ICONS.map((icon) => icon.value)).toEqual(expect.arrayContaining(before));
  });

  it('keeps the calendar as the default', () => {
    expect(DEFAULT_APPOINTMENT_ICON).toBe('lucideCalendar');
  });
});

describe('groupOfIcon', () => {
  it('finds the group of an offered icon', () => {
    expect(groupOfIcon('lucideCake')).toBe('Celebrations');
  });

  it('falls back to the first group for an icon not on offer', () => {
    expect(groupOfIcon('event')).toBe(APPOINTMENT_ICON_GROUPS[0]);
  });
});

describe('loadAppointmentIcon', () => {
  it('loads the SVG of an appointment icon on demand', async () => {
    await expect(loadAppointmentIcon('lucideCake')).resolves.toBe(
      APPOINTMENT_ICON_SVGS['lucideCake'],
    );
  });

  it('renders nothing for an unknown name instead of failing', async () => {
    await expect(loadAppointmentIcon('event')).resolves.toBe('');
  });
});
