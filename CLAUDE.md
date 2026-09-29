# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

`README.md` is the detailed reference (data model, layout rules, backup format). This file
summarises what matters when changing code.

## Commands

```bash
npm start                                    # dev server on http://localhost:4200
npm start -- --host 0.0.0.0                  # reachable from a phone on the LAN
npm test                                     # Vitest in watch mode
npm test -- --watch=false                    # single run
npm test -- --watch=false --include <path>   # one spec; a source file path runs its .spec.ts
npm run build                                # production bundle into dist/how-long
npx prettier --write .                       # format (there is no ESLint)
```

The same commands exist as Zed tasks in `.zed/tasks.json`, with debug configurations in
`.zed/debug.json`. Node 24 and npm 12 are pinned in `mise.toml`, which CI reads as well.

## CI and deployment

- `.github/workflows/ci.yml` runs on pull requests into `main`: `prettier --check .`,
  `npm audit --audit-level=high`, the tests and a build. Keep all four green; its `test` job is
  a required check of the branch protection.
- `.github/workflows/deploy.yml` publishes to GitHub Pages after a pull request is merged
  into `main` (a `guard` job skips commits that did not come from a merged pull request).
  The Pages build uses `--base-href /how-long/`: with the relative `./` base href the service
  worker would fetch its files from the server root and never install.
- `main` is protected and accepts changes only through pull requests. Never push to it
  directly, and leave merging to the user.

## Architecture

Angular 22 PWA with no backend: standalone components, signals, zoneless change detection,
`OnPush` everywhere, templates inline in the component file. Routes are lazy-loaded and use
the hash location strategy (`#/admin/3`), so the build can be served from any path.

- **Storage** — IndexedDB through Dexie. `core/data/db.ts` defines the schema and the
  `HOW_LONG_DB` injection token. All reads and writes go through `CountdownRepository`;
  components consume its `watch*()` methods (Dexie `liveQuery`, converted with `toSignal`).
- **Domain invariants live in the repository, not in forms:** dates are `yyyy-mm-dd`
  strings of a real calendar day, and an appointment's date is not after its
  countdown's target date (the target day itself is allowed). Both are checked when an appointment moves _and_ when a
  countdown's date moves. Deleting a countdown deletes its appointments in one transaction.
- **Dates** — day arithmetic goes through `core/services/date-utils.ts` (UTC midnights, so
  DST cannot cause off-by-one). Which countdown the start page shows is decided by
  `pickNextCountdown` in `core/services/next-countdown.ts`; a user's choice is kept in the
  `countdown` query parameter, bound as a component input, and remembered in `localStorage`
  by `features/home/remembered-countdown.ts` (query parameter → remembered, unless its date
  has passed → next due).
  Specs provide `COUNTDOWN_STORAGE` with `memoryStorage()` from `src/testing/storage.ts`.
- **Forms** — Signal Forms (`@angular/forms/signals`), not reactive forms. A dialog keeps its
  values in a `signal` model and wraps it in `form(model, schema)`; rules (`required`,
  `maxLength`, `validate`) live in the schema, bound to inputs with `[formField]` and to the
  `<form>` with `[formRoot]`. Attributes such as `maxlength` come from the rules, not the
  template. Specs set values through `form.<field>().value.set(...)`. A date field's error
  follows the DOM `input` event (`dateTouched`), not `touched` or `dirty`: the first fires on
  merely leaving the field, and a native date input can set the second by itself.
- **Languages** — ngx-translate 18; texts in `public/assets/i18n/{en,de}.json`, both listed in
  `ngsw-config.json`. `LanguageService` (`core/i18n`) owns the language as a signal, saves it in
  `localStorage` and loads it in an app initializer before the first render. Templates use the
  `translate` pipe, classes `translate(() => key)` (signal) or `instant` (one-off toasts).
  Dates go through the `localDate` pipe (`DD.MM.YYYY` in German, ISO in English); stored data
  and `<time datetime>` stay ISO. Text the user reads from a service is a `LocalizedError`
  (English `message`, translated via `key`/`params`). Never add a text to only one file: a spec
  compares keys and placeholders. Specs provide `...provideTestI18n()` from
  `src/testing/i18n.ts` and render in English; German is set with `LanguageService.use('de')`.
- **Backup** — `core/services/backup.service.ts` validates a whole file before writing and
  restores in a single transaction; database ids are not exported.
- **Router features** are exported as `routerFeatures` from `app.config.ts` and reused by the
  routing spec — add new router features there, not inline in `provideRouter`.
- **Updates** — `shared/app-update.service.ts`, started by the app shell, checks for a newer
  published build on start, when the page becomes visible again and every six hours, and
  offers it in a toast. The service worker only runs in production builds.

## UI conventions

- UI is Spartan (`@spartan-ng/brain` + helm components) with Tailwind 4 — not Angular
  Material. `src/app/ui` is generated by the Spartan CLI and excluded from Prettier; do not
  hand-edit it. Add primitives with
  `npx ng g @spartan-ng/cli:ui <name> --interactive=false --defaults` (registers the
  `@spartan-ng/helm/<name>` path alias in `tsconfig.json`).
- Font: Geist (variable, SIL OFL), self-hosted from `@fontsource-variable/geist` through the
  `@font-face` rules in `src/styles.css` and set as `--font-sans`. Only the Latin subsets are
  declared, and `ngsw-config.json` prefetches `/media/*.woff2` so the font works offline. Apple's
  SF Pro is not an option: its license forbids serving it from a web server.
- Open dialogs with `openDialog()` from `shared/dialog.ts`, which applies viewport-based
  sizing. `w-full` / `max-h-full` on dialog content do not work because the CDK sizes
  overlay panes to their content.
- Edge-anchored elements must clear the iPhone notch and home indicator: use the safe-area
  utilities from `src/styles.css` (`pt-safe-16`, `px-safe-6`, `bottom-safe-6`, …) instead of
  plain spacing. Test without a notch by overriding `--safe-top` etc. on `<html>`.
- Pickers with a native counterpart go through the CDK's `Platform`: the icon group is a
  native `<select>` only on iOS and Android (`IconGroupSelect`), the Spartan select
  elsewhere; a day is a native `<input type="date">` there and the Spartan date picker
  elsewhere (`IsoDateField`, a Signal Forms control holding the `yyyy-mm-dd` string, with the
  calendar's texts from `calendarI18n`). Never write to `BrnCalendarI18nService` in a
  tracked context: `use()` reads its own signal, so an `effect` calling it loops forever. `Platform` reads the user agent once at start, so switch the emulated device
  and reload. Specs provide `Platform` themselves, since jsdom is neither.
- Landscape phones use the custom `landscape-phone:` variant. It is bounded by
  `max-height: 30rem`, so tablets and desktops keep the stacked layout.
- Appointment icons: list them (English label, Lucide value, group) in `APPOINTMENT_ICONS` in
  `shared/appointment-style.ts`, name each in both language files under
  `appointment.icons.<value>`, then run `npm run icons:generate` to regenerate
  `shared/appointment-icon-svgs.ts`. Never import them from `@ng-icons/lucide` in app code or
  add them to `APP_ICONS` (UI icons only): they are loaded lazily by `loadAppointmentIcon`,
  and a static import would put them back into the initial bundle. Specs register all icons
  with `provideTestIcons()` from `src/testing/icons.ts`.

## Tests

Vitest + jsdom + `fake-indexeddb` (loaded in `src/test-setup.ts`). Database specs create a
`HowLongDatabase` with a unique name per spec and provide it via `HOW_LONG_DB`.

- `liveQuery` resolves over several macrotasks: use `settle(fixture)` from
  `src/testing/settle.ts` instead of `fixture.whenStable()` alone.
- Use `stubDialog(result)` from `src/testing/dialog.ts` to resolve a dialog without
  rendering it, and `provideNotificationSpy()` from `src/testing/notification.ts` to assert
  on toasts.

## Commits

Conventional Commits with a scope, e.g. `feat(home): …`, `fix(layout): …`, `chore(zed): …`.
