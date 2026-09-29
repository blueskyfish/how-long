import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { provideTestI18n } from '../../../testing/i18n';
import { LanguageService } from './language.service';
import { LocalDatePipe } from './local-date.pipe';

@Component({ imports: [LocalDatePipe], template: `<p>{{ day() | localDate }}</p>` })
class Host {
  readonly day = signal<string | null | undefined>('2026-12-24');
}

describe('LocalDatePipe', () => {
  function render() {
    TestBed.configureTestingModule({ providers: [...provideTestI18n()] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    return fixture;
  }

  const shown = (fixture: ReturnType<typeof render>) =>
    fixture.nativeElement.querySelector('p').textContent;

  it('writes the day the way the current language does', async () => {
    const fixture = render();
    expect(shown(fixture)).toBe('2026-12-24');

    await TestBed.inject(LanguageService).use('de');
    fixture.detectChanges();

    expect(shown(fixture)).toBe('24.12.2026');
  });

  it('follows the language without the day changing', async () => {
    const fixture = render();
    const language = TestBed.inject(LanguageService);

    await language.use('de');
    fixture.detectChanges();
    await language.use('en');
    fixture.detectChanges();

    expect(shown(fixture)).toBe('2026-12-24');
  });

  it.each([null, undefined, ''])('renders %j as nothing', (value) => {
    const fixture = render();
    fixture.componentInstance.day.set(value);
    fixture.detectChanges();

    expect(shown(fixture)).toBe('');
  });
});
