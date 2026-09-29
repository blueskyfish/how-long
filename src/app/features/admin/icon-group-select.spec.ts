import { Platform } from '@angular/cdk/platform';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { LanguageService } from '../../core/i18n/language.service';
import { APPOINTMENT_ICON_GROUPS, AppointmentIconGroup } from '../../shared/appointment-style';
import { provideTestI18n } from '../../../testing/i18n';
import { provideTestIcons } from '../../../testing/icons';
import { IconGroupSelect } from './icon-group-select';

describe('IconGroupSelect', () => {
  let fixture: ComponentFixture<IconGroupSelect>;
  let chosen: AppointmentIconGroup[];

  function render(
    platform: { IOS: boolean; ANDROID: boolean },
    value: AppointmentIconGroup = APPOINTMENT_ICON_GROUPS[0],
  ) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        ...provideTestI18n(),
        provideTestIcons(),
        { provide: Platform, useValue: platform },
      ],
    });
    fixture = TestBed.createComponent(IconGroupSelect);
    fixture.componentRef.setInput('value', value);
    chosen = [];
    fixture.componentInstance.valueChange.subscribe((group) => chosen.push(group));
    fixture.detectChanges();
  }

  const IPHONE = { IOS: true, ANDROID: false };
  const PIXEL = { IOS: false, ANDROID: true };
  const DESKTOP = { IOS: false, ANDROID: false };

  const nativeSelect = () =>
    fixture.nativeElement.querySelector('select') as HTMLSelectElement | null;
  const trigger = () =>
    fixture.nativeElement.querySelector('[data-testid="icon-group"] button') as HTMLButtonElement;

  async function settle() {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  async function openDropdown() {
    trigger().click();
    await settle();
  }

  const options = () => [...document.querySelectorAll('hlm-select-item')];

  beforeEach(() =>
    document.body.querySelectorAll('.cdk-overlay-container').forEach((c) => c.replaceChildren()),
  );

  describe.each([
    ['an iPhone', IPHONE],
    ['an Android phone', PIXEL],
  ])('on %s', (_name, platform) => {
    beforeEach(() => render(platform, 'Celebrations'));

    it('is the native select', () => {
      expect(nativeSelect()).not.toBeNull();
      expect(fixture.nativeElement.querySelector('hlm-select')).toBeNull();
    });

    it('offers every group by its name, keeping the group itself as the value', () => {
      const offered = Array.from(nativeSelect()!.options, (o) => [o.value, o.textContent?.trim()]);

      expect(offered.map(([value]) => value)).toEqual([...APPOINTMENT_ICON_GROUPS]);
      expect(offered).toContainEqual(['School & work', 'School & work']);
    });

    it('shows the chosen group and names itself for assistive technology', () => {
      expect(nativeSelect()!.value).toBe('Celebrations');
      expect(nativeSelect()!.getAttribute('aria-label')).toBe('Icon group');
    });

    it('reports the group that was picked', () => {
      nativeSelect()!.value = 'Health & sport';
      nativeSelect()!.dispatchEvent(new Event('change'));

      expect(chosen).toEqual(['Health & sport']);
    });

    it('shows the German names once the language changes', async () => {
      await TestBed.inject(LanguageService).use('de');
      fixture.detectChanges();

      expect(nativeSelect()!.selectedOptions[0].textContent?.trim()).toBe('Feiern');
      expect(nativeSelect()!.value).toBe('Celebrations');
    });
  });

  describe('on a desktop', () => {
    beforeEach(() => render(DESKTOP, 'Celebrations'));

    it('is the app’s own dropdown, not a native select', () => {
      expect(nativeSelect()).toBeNull();
      expect(fixture.nativeElement.querySelector('hlm-select')).not.toBeNull();
    });

    it('shows the chosen group on the trigger', () => {
      expect(trigger().textContent?.trim()).toContain('Celebrations');
    });

    it('is labelled for assistive technology', () => {
      const label = fixture.nativeElement.querySelector('label');

      expect(label.textContent.trim()).toBe('Icon group');
      expect(label.getAttribute('for')).toBe(trigger().id);
    });

    it('lists every group when opened', async () => {
      await openDropdown();

      expect(options().map((o) => o.textContent?.trim())).toEqual([...APPOINTMENT_ICON_GROUPS]);
    });

    it('reports the group that was picked', async () => {
      await openDropdown();

      (
        document.querySelector('[data-testid="icon-group-option-Health & sport"]') as HTMLElement
      ).click();
      await settle();

      expect(chosen).toEqual(['Health & sport']);
    });

    it('names the groups in German, on the trigger and in the list', async () => {
      await TestBed.inject(LanguageService).use('de');
      await settle();
      expect(trigger().textContent?.trim()).toContain('Feiern');

      await openDropdown();

      expect(options().map((o) => o.textContent?.trim())).toContain('Schule & Arbeit');
    });

    it('ignores a value that is not one of the groups', () => {
      (fixture.componentInstance as unknown as { pick(value: unknown): void }).pick('Klingon');
      (fixture.componentInstance as unknown as { pick(value: unknown): void }).pick(undefined);

      expect(chosen).toEqual([]);
    });
  });
});
