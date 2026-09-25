import { ApplicationConfig, isDevMode, provideBrowserGlobalErrorListeners } from '@angular/core';
import {
  provideRouter,
  withComponentInputBinding,
  withHashLocation,
  withInMemoryScrolling,
} from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { provideIcons } from '@ng-icons/core';
import { provideSpartanHlm } from '@spartan-ng/helm/utils';
import { routes } from './app.routes';
import { APP_ICONS } from './shared/icons';

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
    provideRouter(routes, ...routerFeatures),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
