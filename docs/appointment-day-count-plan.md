# Appointment Day Count Plan

- **Status:** Implemented
- **Change type:** Feature
- **Scope:** Show the number of calendar days from today until each appointment.

## Change strategy

Treat this as a user-facing feature, not as a bug fix or a general date-handling refactor.
Follow the architecture and UI guidance in `CLAUDE.md`: use the shared appointment-list
component, route day arithmetic through `core/services/date-utils.ts`, localize display text
in both language files, and cover the behavior with specs. Keep the scope to appointment
display and the date refresh it needs; do not change storage, backup data, filtering, ordering,
or countdown behavior.

## Context

Appointments are rendered by the shared `AppointmentList` component as an icon, date, and
title on the home page and in the full appointment dialog. The admin detail page renders
editable appointment rows separately. The date utilities already provide
`daysUntil(target, today)`, which calculates whole calendar days from local dates using UTC
midnights.

## Proposed behavior

- Show a localized day count alongside each appointment date on every shared appointment
  list, so the value is consistent across the home page, full list, and admin detail.
- Use calendar days in the user's local time zone, not elapsed 24-hour periods.
- Show `Today` / `Heute` when the appointment is today and a localized “in N days” value for
  future appointments.
- Keep showing past appointments in views that currently include them. Show a localized
  “N days ago” value for those appointments rather than hiding them or changing their
  ordering.
- Recalculate from the current local date when the displayed day changes, including when a
  suspended or backgrounded page becomes visible again.
- Keep the appointment date as the machine-readable `<time datetime>` value; the day count is
  supplemental display text only.

The signed result from `daysUntil` supports all three date cases. The exact past-date wording
should be confirmed as part of implementation; “N days ago” is the proposed neutral label.

## Implementation steps

1. Add a small shared day-count component that uses `daysUntil` and a reactive current-local-date
   service, then render it from `AppointmentList` and the admin detail rows.
2. Refresh the current date at local midnight and after the page becomes visible or is restored
   from the back-forward cache. This keeps the home page, full appointment dialog, and admin
   detail page in sync without capturing `new Date()` once in a computed value.
3. Add matching English and German translation entries under the appointment-related keys in
   `public/assets/i18n/en.json` and `public/assets/i18n/de.json`. Cover today, one day, and
   plural future/past values, using the project's existing ngx-translate conventions.
4. Extend the `AppointmentList` specs to cover today, future and past appointments, local
   calendar-day and daylight-saving boundaries, and translated singular/plural wording.
   Update the home, admin detail, and full appointment dialog specs where they assert the
   rendered rows or date text.
5. Run the focused specs, then the full unit suite and formatting check. Build the app to
   verify both language files and templates.

## Out of scope

- No database or backup-format changes: the appointment's stored ISO date remains the source
  of truth.
- No changes to appointment filtering, sorting, countdown selection, or date validation.
- No change to the existing date formatting or machine-readable date attribute.

## Acceptance criteria

- Every rendered appointment row includes a localized day count relative to the current local
  date, on all three shared-list surfaces.
- The count is zero on the appointment date, positive for future dates, and negative in the
  underlying calculation for past dates, with past dates displayed using localized
  past-tense wording.
- Calendar-day arithmetic remains correct across daylight-saving changes.
- Changing the current date while the app is backgrounded does not leave stale counts after
  the page becomes visible again.
- English and German have matching translation keys and interpolation placeholders.
