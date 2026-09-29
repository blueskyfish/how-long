import { describe, expect, it } from 'vitest';
import de from '../../../../public/assets/i18n/de.json';
import en from '../../../../public/assets/i18n/en.json';
import {
  APPOINTMENT_COLORS,
  APPOINTMENT_ICON_GROUPS,
  APPOINTMENT_ICONS,
} from '../../shared/appointment-style';

type Tree = { [key: string]: string | Tree };

/** `a.b.c` → text, for every text in the tree. */
function flatten(tree: Tree, prefix = ''): Record<string, string> {
  return Object.entries(tree).reduce<Record<string, string>>((all, [key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === 'string'
      ? { ...all, [path]: value }
      : { ...all, ...flatten(value, path) };
  }, {});
}

const placeholders = (text: string) =>
  [...text.matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map((m) => m[1]).sort();

const english = flatten(en as Tree);
const german = flatten(de as Tree);

describe('translation files', () => {
  it('have the same keys in both languages', () => {
    expect(Object.keys(german).sort()).toEqual(Object.keys(english).sort());
  });

  it.each(Object.keys(english))('%s has no empty text', (key) => {
    expect(english[key].trim()).not.toBe('');
    expect(german[key].trim()).not.toBe('');
  });

  it('use the same placeholders in both languages', () => {
    const mismatched = Object.keys(english).filter(
      (key) => placeholders(english[key]).join() !== placeholders(german[key]).join(),
    );

    expect(mismatched).toEqual([]);
  });

  describe('names of what the pickers offer', () => {
    it('cover every colour, group and icon', () => {
      const wanted = [
        ...APPOINTMENT_COLORS.map(({ name }) => `appointment.colors.${name}`),
        ...APPOINTMENT_ICON_GROUPS.map((group) => `appointment.groups.${group}`),
        ...APPOINTMENT_ICONS.map(({ value }) => `appointment.icons.${value}`),
      ];

      expect(wanted.filter((key) => !(key in english))).toEqual([]);
      expect(wanted.filter((key) => !(key in german))).toEqual([]);
    });

    it('offer nothing the pickers no longer have', () => {
      const known = new Set([
        ...APPOINTMENT_COLORS.map(({ name }) => `appointment.colors.${name}`),
        ...APPOINTMENT_ICON_GROUPS.map((group) => `appointment.groups.${group}`),
        ...APPOINTMENT_ICONS.map(({ value }) => `appointment.icons.${value}`),
      ]);
      const stale = Object.keys(english).filter(
        (key) => key.startsWith('appointment.') && !known.has(key),
      );

      expect(stale).toEqual([]);
    });

    it('keep the English name in the data and in the file the same', () => {
      const differing = [
        ...APPOINTMENT_COLORS.filter(
          ({ name }) => english[`appointment.colors.${name}`] !== name,
        ).map(({ name }) => name),
        ...APPOINTMENT_ICONS.filter(
          ({ name, value }) => english[`appointment.icons.${value}`] !== name,
        ).map(({ name }) => name),
      ];

      expect(differing).toEqual([]);
    });

    it('name every icon differently within a language', () => {
      const icons = APPOINTMENT_ICONS.map(({ value }) => `appointment.icons.${value}`);

      expect(new Set(icons.map((key) => german[key])).size).toBe(icons.length);
      expect(new Set(icons.map((key) => english[key])).size).toBe(icons.length);
    });
  });
});
