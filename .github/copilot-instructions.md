# Copilot instructions

## Communication and language

- Write chat responses in German.
- Write documentation and source-code comments in English.

## Build, test, and checks

Node 24 and npm 12 are pinned in `mise.toml`.

```bash
npm start
npm test -- --watch=false
npm test -- --watch=false --include src/app/features/home/home-page.spec.ts
npm run test:e2e
npx playwright test e2e/countdown.spec.ts
npx playwright install chrome ffmpeg
npm run build
npx prettier --check .
npm audit --audit-level=high
```

The test `--include` value can be a spec path or the corresponding source file path. There is
no ESLint script. CI runs the formatting check, audit, tests, and build for pull requests to
`main`; it also runs Playwright browser tests in Chrome and uploads recordings and traces if
they fail.

## Architecture

This is an Angular 22 PWA with standalone components, signals, zoneless change detection,
`OnPush`, inline templates, and lazy-loaded hash-based routes. `src/app/app.config.ts` exports
`routerFeatures`; reuse it when configuring the router in tests.

The app has no backend. `core/data/db.ts` defines the Dexie IndexedDB schema and
`HOW_LONG_DB`; `CountdownRepository` is the single access point for data. It enforces valid
`yyyy-mm-dd` calendar dates, appointment dates not later than their countdown target, and
transactional deletion of a countdown with its appointments. Keep these domain invariants in
the repository, not only in forms. `BackupService` validates the complete import before
writing and restores in one transaction.

Day calculations belong in `core/services/date-utils.ts` and use UTC midnights for day
arithmetic. Countdown selection is in `pickNextCountdown`; the home page combines that with
the URL query parameter and the remembered per-device selection.

`LanguageService` owns the language signal and persistence. Translation files are
`public/assets/i18n/en.json` and `de.json`; keep their keys and placeholders in sync. Format
display dates with `localDate` or `LanguageService.formatDate`, while stored dates and
`<time datetime>` values remain ISO. User-facing service errors use `LocalizedError`.

## Repository conventions

- UI uses Spartan (`@spartan-ng/brain` and generated helm components) with Tailwind CSS 4.
  Do not hand-edit `src/app/ui`; add primitives with
  `npx ng g @spartan-ng/cli:ui <name> --interactive=false --defaults`.
- Use Signal Forms (`@angular/forms/signals`), not reactive forms. Keep validation in the
  form schema; bind controls with `[formField]` and the form with `[formRoot]`.
- Native-backed pickers use CDK `Platform`: native controls on iOS/Android and Spartan
  controls elsewhere. Specs must provide `Platform` explicitly because jsdom is neither.
- Edge-anchored UI must use the safe-area utilities defined in `src/styles.css`. Dialogs
  should be opened with `openDialog()` from `shared/dialog.ts` for viewport-based sizing.
- Add user-visible strings to both translation files. Specs use `provideTestI18n()` from
  `src/testing/i18n.ts`.
- Dexie `liveQuery` needs multiple macrotasks to settle in tests; use `settle(fixture)` from
  `src/testing/settle.ts`. Use the existing dialog stub and notification spy helpers where
  relevant.
- Appointment icons are listed in `shared/appointment-style.ts`, named in both languages,
  and regenerated with `npm run icons:generate`. They load lazily through
  `loadAppointmentIcon`; do not statically import appointment icons into app code.
- Keep the app usable under a subpath: routing uses hash location, assets are relative to the
  base href, and the Pages build sets `/how-long/` so the service worker resolves correctly.
- `main` is protected; submit changes through pull requests and leave merging to the user.
