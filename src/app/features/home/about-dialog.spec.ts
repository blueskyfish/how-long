import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrnDialogRef } from '@spartan-ng/brain/dialog';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { provideTestI18n } from '../../../testing/i18n';
import { APP_NAME, APP_VERSION, REPOSITORY_URL } from '../../core/app-info';
import { AboutDialog } from './about-dialog';

describe('AboutDialog', () => {
  let fixture: ComponentFixture<AboutDialog>;
  const close = vi.fn();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AboutDialog],
      providers: [...provideTestI18n(), { provide: BrnDialogRef, useValue: { close } }],
    });
    fixture = TestBed.createComponent(AboutDialog);
    fixture.detectChanges();
  });

  it('shows the project name, current version and repository link', () => {
    expect(fixture.nativeElement.textContent).toContain(APP_NAME);
    expect(fixture.nativeElement.textContent).toContain(`Version ${APP_VERSION}`);

    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a');
    expect(link.href).toBe(REPOSITORY_URL);
    expect(link.target).toBe('_blank');
    expect(link.rel).toBe('noopener noreferrer');
  });

  it('closes when the close button is activated', () => {
    fixture.nativeElement.querySelector('[data-testid="close"]').click();

    expect(close).toHaveBeenCalledWith(undefined);
  });
});
