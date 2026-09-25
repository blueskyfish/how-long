# How long

A small progressive web app that answers one question in very large type: **how many days
until the date that matters?** Below the number it lists the milestones on the way there.

Everything is stored locally in IndexedDB — there is no backend and no account. Data moves
between devices as a JSON file you download and drop back in.

## Features

- **Countdown** — days remaining in a circle, the target date, an optional description, and
  the next five upcoming appointments, with a "More" overlay for the full list. With several
  target dates stored, the date doubles as a dropdown to switch between them.
- **Administration** — manage several target dates and the appointments belonging to each.
- **Backup** — export everything as JSON; import it back by file picker or by dropping the
  file onto the administration page, either replacing or adding to what is stored.
- **Installable** — web app manifest and a service worker, so it works offline once loaded.
- **Light and dark** — follows the operating system's colour scheme.

## Running it

```bash
npm install
npm start          # dev server on http://localhost:4200
npm test           # unit tests (vitest, single run: npm test -- --no-watch)
npm run build      # production bundle into dist/how-long
```

The production build is a set of static files. Because routing uses the hash location
strategy and `<base href="./">`, the `dist/how-long/browser` directory can be served from
any path — no server-side rewrite rules required.

## Architecture

| Concern   | Choice                                                                             |
| --------- | ---------------------------------------------------------------------------------- |
| Framework | Angular 22, standalone components, signals, zoneless change detection              |
| UI        | [Spartan UI](https://spartan.ng) (`@spartan-ng/brain` + generated helm components) |
| Styling   | Tailwind CSS 4, "Azure & Blue" tokens in [`src/styles.css`](src/styles.css)        |
| Icons     | [Lucide](https://lucide.dev) via `@ng-icons`                                       |
| Storage   | IndexedDB through [Dexie](https://dexie.org), with `liveQuery`                     |
| PWA       | `@angular/service-worker` + `public/manifest.webmanifest`                          |
| Tests     | Vitest + jsdom + `fake-indexeddb`                                                  |

### Layout

```
src/app/
  core/
    models/       Countdown, Appointment, Backup — the domain types
    data/         Dexie schema (db.ts) and CountdownRepository
    services/     date-utils.ts, backup.service.ts
  features/
    home/         the countdown page, its day-counter circle, countdown picker and overlay
    admin/        overview, detail, and the create/edit dialogs
  shared/         appointment list, palette, dialogs, file and toast services
  ui/             Spartan helm components, generated — see "Regenerating" below
src/testing/      helpers shared by specs (settle, dialog stub, notification spy)
```

### Data model

A **countdown** is a target date plus an optional description. An **appointment** belongs to
exactly one countdown and carries a date, a title, a colour and an icon.

Two rules hold everywhere, enforced centrally in
[`CountdownRepository`](src/app/core/data/countdown-repository.ts) rather than in each form:

1. Dates are `yyyy-mm-dd` strings that name a real calendar day. Storing them as strings
   makes them sortable and comparable directly, and keeps them free of time zones.
2. An appointment's date is strictly **before** the target date of its countdown. This is
   re-checked when an appointment moves _and_ when a countdown's target date moves, so the
   invariant cannot be broken from either side.

Deleting a countdown deletes its appointments in the same transaction.

Day counts are computed from UTC midnights in
[`date-utils.ts`](src/app/core/services/date-utils.ts), so a daylight saving transition in
the range cannot produce an off-by-one.

### Responsive layout

Portrait stacks: counter, target date, description, appointments. A phone held sideways has
no vertical room for that, so the start page puts the two blocks next to each other —
counter on the right, appointments on the left — via the `landscape-phone` variant defined
in [`src/styles.css`](src/styles.css). It is bounded by height (`max-height: 30rem`), so
tablets and desktop windows, which are also "landscape", keep the stacked layout.

Dialogs are sized against the viewport rather than their content: 92% of the width on a
phone, capped at 32rem, and tall enough to leave the safe areas free, scrolling beyond that.
Sizing them with `w-full` / `max-h-full` does not work — the CDK sizes its overlay panes to
their content, so those percentages resolve against the content box and collapse.

### Safe areas

`index.html` sets `viewport-fit=cover`, so on an iPhone the page paints behind the notch,
the rounded corners and the home indicator. Every edge-anchored element therefore has to
keep clear of those strips itself.

The four insets are mirrored from `env(safe-area-inset-*)` into `--safe-top` / `--safe-bottom`
/ `--safe-left` / `--safe-right` in [`src/styles.css`](src/styles.css), and a set of
utilities layers them on top of the design's own spacing: `pt-safe-16` reads as "pt-16, plus
whatever the notch needs", `px-safe-6` as "px-6, or the side inset if that is larger".
`bottom-safe-6` and `right-safe-6` position the floating action buttons, and the CDK overlay
wrapper is padded so a dialog is centred within the safe area rather than the raw viewport.

Because the values come from variables rather than from `env()` at each use site, a browser
without a notch can exercise the whole layout by overriding the four of them:

```js
document.documentElement.style.setProperty('--safe-top', '59px');
```

### Which countdown does the start page show?

By default the earliest countdown that has not passed — today counts as "not passed". If
every target date is in the past, the most recent one is shown instead, counting upwards
("3 days ago"), so the page is never blank while data exists. The rule lives in
[`pickNextCountdown`](src/app/core/services/next-countdown.ts) and is shared with the
repository.

Once a second target date exists, the date under the circle becomes a dropdown. Picking one
writes it to the `countdown` query parameter (`#/?countdown=3`), which is bound straight
into the page as a component input: the choice survives a reload, the back button steps
through it, and a parameter naming a deleted countdown falls back to the default.

### Backup format

```json
{
  "version": 1,
  "exportedAt": "2026-09-25T07:00:00.000Z",
  "countdowns": [
    {
      "date": "2026-12-24",
      "description": "Christmas",
      "appointments": [
        { "date": "2026-12-01", "title": "Advent", "color": "#e53935", "icon": "lucideStar" }
      ]
    }
  ]
}
```

Database ids are not exported; they are reassigned on import. A file is validated in full
before anything is written, and the restore itself runs in one transaction, so a malformed
file can never leave the database half-imported.

## Testing

`npm test` runs the whole suite. The specs cover the date arithmetic, the repository
invariants, backup parsing and restoring, each page, and each dialog. Database specs run
against `fake-indexeddb` under a per-spec database name, so they are isolated and need no
cleanup between tests.

Two details worth knowing when adding specs:

- Dexie's `liveQuery` resolves over several macrotasks. Use `settle(fixture)` from
  [`src/testing/settle.ts`](src/testing/settle.ts) instead of `fixture.whenStable()` alone.
- Dialogs are opened through `HlmDialogService`. Use `stubDialog(result)` from
  [`src/testing/dialog.ts`](src/testing/dialog.ts) to make one resolve without rendering an
  overlay, and `provideNotificationSpy()` to assert on toasts.

## Regenerating Spartan components

`src/app/ui` is generated by the Spartan CLI and checked in unchanged (it is in
`.prettierignore` so regeneration stays diffable). The settings live in `components.json`;
add another primitive with:

```bash
npx ng g @spartan-ng/cli:ui <name> --interactive=false --defaults
```

The generator also registers the `@spartan-ng/helm/<name>` path alias in `tsconfig.json`.

## Adding an icon

Appointment icons are Lucide names. Add the import to
[`src/app/shared/icons.ts`](src/app/shared/icons.ts) so it is registered at bootstrap, then
list it in `APPOINTMENT_ICONS` in
[`src/app/shared/appointment-style.ts`](src/app/shared/appointment-style.ts) to offer it in
the appointment form.
