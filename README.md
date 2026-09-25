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
  When a newer version has been published, a toast offers to update.
- **Light and dark** — follows the operating system's colour scheme.

## Running it

Node and npm are pinned in [`mise.toml`](mise.toml) (Node 24, npm 12); with
[mise](https://mise.jdx.dev) installed, `mise install` sets them up.

```bash
npm install
npm start          # dev server on http://localhost:4200
npm test           # unit tests (vitest, single run: npm test -- --no-watch)
npm run build      # production bundle into dist/how-long
```

The production build is a set of static files. Because routing uses the hash location
strategy and `<base href="./">`, the `dist/how-long/browser` directory can be served from
any path — no server-side rewrite rules required. The service worker is the exception: with
a relative base href it looks for its files at the server root, so a build served from a
sub-path needs that path as its base href (`npm run build -- --base-href /how-long/`).

## Deployment

The app is published to GitHub Pages at <https://blueskyfish.github.io/how-long/>.

- **Pull requests into `main`** run [`ci.yml`](.github/workflows/ci.yml): formatting
  (`prettier --check`), `npm audit --audit-level=high`, the tests and a build. Its `test` job
  is a required check, so a pull request can only be merged once it is green.
- **A merged pull request** runs [`deploy.yml`](.github/workflows/deploy.yml): the same
  checks and tests again on `main`, then the build with the `/how-long/` base href, then the
  publish. A `guard` job first confirms the commit on `main` came from a merged pull
  request; anything else is not published.
- **Manually**, "Run workflow" on the Deploy workflow in the Actions tab publishes the current
  `main`.

`main` is protected: changes only arrive through pull requests, for administrators too.
Merging stays a manual step on GitHub.

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

The pick is also remembered in `localStorage`, so reopening the app without the parameter —
from the home screen, for instance — shows the same countdown again. The order is: the query
parameter, then the remembered pick, then the next countdown due. A remembered countdown
that has since been deleted is skipped, and so is one whose date has passed — the target day
itself still counts — so the page moves on to the next countdown due. A passed countdown
named by the query parameter is still shown. The pick is a per-device preference and is not part
of the backup.

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

Appointment icons are Lucide names, offered in six groups of 20 to 30 that the appointment
form switches between with a dropdown. Editing opens on the group of the appointment's icon.
A new appointment opens on the group used when the last one was saved in the same countdown,
or on the first group; opening another countdown forgets it. That memory lives in
[`RememberedIconGroup`](src/app/features/admin/remembered-icon-group.ts), in memory only. To offer another one, add it with its label and group
to `APPOINTMENT_ICONS` in
[`src/app/shared/appointment-style.ts`](src/app/shared/appointment-style.ts), then run

```bash
npm run icons:generate
```

which writes the SVGs to `src/app/shared/appointment-icon-svgs.ts`. Run it again after
upgrading `@ng-icons/lucide`; a spec fails while the two are out of step.

The appointment icons are not registered at bootstrap. `loadAppointmentIcon` in
[`src/app/shared/icons.ts`](src/app/shared/icons.ts) loads them on first use from their own
chunk (about 10 kB compressed), which the service worker prefetches, so they also work
offline. The SVGs are copied as literals rather than imported from `@ng-icons/lucide`: that
package is a single module, and since the UI icons in `APP_ICONS` come from it, importing the
appointment icons from it too would pull them into the initial bundle.
