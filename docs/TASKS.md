# Tasks

## Completed In Phase 0

- Inspected the project root and Stitch reference files.
- Created official docs folder and memory files.
- Created a root-level Next.js skeleton.
- Added Thucydides-branded app shell.
- Added placeholder module pages.
- Added reusable UI foundation components.
- Recorded architecture and decisions.

## Completed In Phase 1

- Added Prisma + SQLite local persistence.
- Created candidate profile and job data models.
- Seeded Adel profile and 10 jobs.
- Implemented deterministic role validation rules.
- Added Vitest coverage for role validation.
- Built editable `/profile`.
- Built manual intake and job list on `/jobs`.
- Built real `/jobs/[id]` detail view.
- Verified install, migration, seed, test, build, lint, and HTTP smoke checks.

## Completed In Phase 2

- Added canonical job statuses.
- Added job edit route and validation rerun on save.
- Added manual validation rerun action.
- Added archive and hard delete actions.
- Added status transitions backed by `ApplicationEvent`.
- Added event history timeline on job detail pages.
- Replaced dashboard placeholders with SQLite metrics.
- Replaced pipeline placeholder with real grouped jobs and status controls.
- Improved profile validation and save feedback.
- Added source-file intake placeholder.
- Added status, lifecycle, dashboard metric, and profile validation tests.

## Completed In Phase 3

- Added job search, filters, sorting, active-filter state, and clear filters.
- Improved job list usability with metadata, counts, and quick actions.
- Added priority, next-action date/note, and last-contacted tracking.
- Added dashboard follow-up and priority metrics.
- Added `/sources` for manual source records and pasted text intake.
- Added sidebar Sources navigation.
- Added Israeli job fixtures and stronger Hebrew rule patterns.
- Added type-to-confirm hard delete.
- Added tests for filters, priority, source types, fixture validation, and follow-up metrics.

## Next Tasks

- Add follow-up notification surfaces and daily review workflow.
- Add richer source editing and manual source-to-profile linking.
- Add saved job-search views.
- Add first AI preparation design without API calls.
- Add persistence/server-action integration tests.
