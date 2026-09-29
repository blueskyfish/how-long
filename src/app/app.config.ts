import {
  ApplicationConfig,
  inject,
  isDevMode,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import {
  provideRouter,
  withComponentInputBinding,
  withHashLocation,
  withInMemoryScrolling,
} from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { provideIcons, provideNgIconLoader, withCaching } from '@ng-icons/core';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { provideSpartanHlm } from '@spartan-ng/helm/utils';
import { routes } from './app.routes';
import { DEFAULT_LANGUAGE } from './core/i18n/languages';
import { LanguageService } from './core/i18n/language.service';
import { APP_ICONS, loadAppointmentIcon } from './shared/icons';

/**
 * Router configuration shared with the routing spec, so a missing feature — the
 * component input binding that feeds `admin/:id`, for instance — fails a test
 * rather than only the real application.
 */
export const routerFeatures = [
  withHashLocation(),
  withComponentInputBinding(),
  withInMemoryScrolling({ scrollPositionRestoration: 'enabled' }),
] as const;

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideSpartanHlm(),
    provideIcons(APP_ICONS),
    provideNgIconLoader(loadAppointmentIcon, withCaching()),
    // Relative to the base href, so the files are found under any deployment path.
    provideTranslateService({ fallbackLang: DEFAULT_LANGUAGE }),
    provideTranslateHttpLoader({ prefix: './assets/i18n/', suffix: '.json' }),
    // Holds the first render back until the language is loaded, so no key shows.
    provideAppInitializer(() => inject(LanguageService).init()),
    provideRouter(routes, ...routerFeatures),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
