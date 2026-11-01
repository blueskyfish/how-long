# Changelog

## [0.3.5] - 2026-11-01

### Changed

- Passed countdowns and appointments are no longer shown on the start page, in the dropdown or in the full appointment list. When every countdown has passed, the start page shows the same empty state as when none exists.
- In the administration, a passed countdown is listed without a link and can only be deleted. A passed appointment stays listed but can only be deleted, and a passed countdown opened by its address offers no editing.

## [0.3.4] - 2026-10-16

### Changed

- The browser's top bar around the notch now matches the page background in light and dark mode instead of a fixed blue.
- Appointment rows are more compact: the day count sits closer to the date in a smaller font.
- The start page previews four appointments instead of five and no longer scrolls the page. Only where the screen is too short does the content scroll within itself, so "More" stays reachable.

## [0.3.3] - 2026-10-13

### Added

- The number of days until each appointment is now shown.

### Changed

- The About screen has a refined layout.

## [0.3.2] - 2026-10-13

## [0.3.1] - 2026-10-12

### Changed

- GitHub Pages now deploys stable app versions only; prereleases stay off the live app.

## [0.3.0] - 2026-10-12

### Added

- A project logo, plus an About screen with the app version and repository link.

### Changed

- The current date is now shown above the countdown.

This file records user-facing changes for app versions. A release entry is
added only when the `publish` skill prepares a release; there is no rolling
Unreleased section.

Entries are ordered newest first and use `## [<version>] - <YYYY-MM-DD>`, followed by
relevant `### Added`, `### Changed`, and `### Fixed` sections. Omit empty sections.
