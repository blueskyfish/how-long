import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { LANGUAGE_STORAGE, LanguageService } from '../core/i18n/language.service';
import { provideTestI18n } from '../../testing/i18n';
import { provideTestIcons } from '../../testing/icons';
import { memoryStorage } from '../../testing/storage';
import { LanguageSwitch } from './language-switch';

describe('LanguageSwitch', () => {
  let fixture: ComponentFixture<LanguageSwitch>;
  let storage: Storage;

  beforeEach(() => {
    storage = memoryStorage();
    TestBed.configureTestingModule({
      providers: [
        ...provideTestI18n(),
        provideTestIcons(),
        { provide: LANGUAGE_STORAGE, useValue: storage },
      ],
    });
    fixture = TestBed.createComponent(LanguageSwitch);
    fixture.detectChanges();
  });

  const trigger = (): HTMLButtonElement =>
    fixture.nativeElement.querySelector('[data-testid="language-switch"]');

  async function settle() {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  async function openMenu() {
    trigger().click();
    await settle();
  }

  const option = (language: string): HTMLElement =>
    document.querySelector(`[data-testid="language-option-${language}"]`)!;

  it('shows the current language and is named for assistive technology', () => {
    expect(trigger().textContent?.trim()).toBe('en');
    expect(trigger().getAttribute('aria-label')).toBe('Language');
  });

  it('offers both languages by their own names', async () => {
    await openMenu();

    expect(option('en').textContent?.trim()).toBe('English');
    expect(option('de').textContent?.trim()).toBe('Deutsch');
  });

  it('marks the current language', async () => {
    await openMenu();

    expect(option('en').getAttribute('aria-current')).toBe('true');
    expect(option('de').getAttribute('aria-current')).toBe('false');
  });

  it('switches the language, the label and the saved choice', async () => {
    await openMenu();

    option('de').click();
    await settle();

    expect(TestBed.inject(LanguageService).current()).toBe('de');
    expect(trigger().textContent?.trim()).toBe('de');
    expect(trigger().getAttribute('aria-label')).toBe('Sprache');
    expect(storage.getItem('how-long.language')).toBe('de');
  });
});
