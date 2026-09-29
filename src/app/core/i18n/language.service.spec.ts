import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { provideTestI18n } from '../../../testing/i18n';
import { memoryStorage } from '../../../testing/storage';
import { LANGUAGE_STORAGE, LanguageService } from './language.service';
import { LocalizedError } from './localized-error';

describe('LanguageService', () => {
  let storage: Storage;

  function create(initial: Record<string, string> = {}, browser?: string): LanguageService {
    storage = memoryStorage(initial);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [...provideTestI18n(), { provide: LANGUAGE_STORAGE, useValue: storage }],
    });
    vi.spyOn(TestBed.inject(TranslateService), 'getBrowserLang').mockReturnValue(browser);
    return TestBed.inject(LanguageService);
  }

  beforeEach(() => TestBed.resetTestingModule());

  describe('the language the page opens in', () => {
    it('is English when nothing else is known', async () => {
      const service = create();
      await service.init();

      expect(service.current()).toBe('en');
    });

    it('follows a German browser', async () => {
      const service = create({}, 'de');
      await service.init();

      expect(service.current()).toBe('de');
    });

    it('falls back to English for a browser language it has no translation for', async () => {
      const service = create({}, 'fr');
      await service.init();

      expect(service.current()).toBe('en');
    });

    it('prefers the saved choice over the browser', async () => {
      const service = create({ 'how-long.language': 'en' }, 'de');
      await service.init();

      expect(service.current()).toBe('en');
    });

    it('ignores a saved value that is not a language', async () => {
      const service = create({ 'how-long.language': 'klingon' }, 'de');
      await service.init();

      expect(service.current()).toBe('de');
    });
  });

  describe('switching', () => {
    it('changes the current language, the texts and the date format at once', async () => {
      const service = create();
      await service.init();
      const translate = TestBed.inject(TranslateService);
      expect(translate.instant('common.cancel')).toBe('Cancel');
      expect(service.formatDate('2026-12-24')).toBe('2026-12-24');

      await service.use('de');

      expect(service.current()).toBe('de');
      expect(translate.instant('common.cancel')).toBe('Abbrechen');
      expect(service.formatDate('2026-12-24')).toBe('24.12.2026');
    });

    it('keeps the choice for the next visit', async () => {
      const service = create();

      await service.use('de');

      expect(storage.getItem('how-long.language')).toBe('de');
    });

    it('still switches when the browser refuses storage', async () => {
      const service = create();
      vi.spyOn(storage, 'setItem').mockImplementation(() => {
        throw new Error('quota');
      });

      await service.use('de');

      expect(service.current()).toBe('de');
    });

    it('sets the language of the document', async () => {
      const service = create();
      await service.init();
      const root = TestBed.inject(DOCUMENT).documentElement;
      TestBed.tick();
      expect(root.lang).toBe('en');

      await service.use('de');
      TestBed.tick();

      expect(root.lang).toBe('de');
    });
  });

  describe('errorMessage', () => {
    it('translates a localized error and fills in its parameters', async () => {
      const service = create();
      await service.use('de');

      const message = service.errorMessage(
        new LocalizedError('errors.unknownCountdown', 'Unknown countdown 7', { id: 7 }),
      );

      expect(message).toBe('Unbekannter Countdown 7');
    });

    it('writes the days among the parameters in the current language', async () => {
      const service = create();
      const error = new LocalizedError('errors.appointmentAfterTarget', 'English', {
        date: '2026-12-25',
        target: '2026-12-24',
      });

      await service.use('de');
      expect(service.errorMessage(error)).toContain('25.12.2026');
      expect(service.errorMessage(error)).toContain('24.12.2026');

      await service.use('en');
      expect(service.errorMessage(error)).toContain('2026-12-25');
    });

    it('leaves a value that only looks like a day alone', async () => {
      const service = create();
      await service.use('de');

      const message = service.errorMessage(
        new LocalizedError('errors.invalidDate', 'English', { date: '2026-02-30' }),
      );

      expect(message).toContain('2026-02-30');
    });

    it('passes any other error through with its own message', () => {
      const service = create();

      expect(service.errorMessage(new Error('boom'))).toBe('boom');
      expect(service.errorMessage('plain')).toBe('plain');
    });
  });
});
