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

## Completed In Phase 4.0

- Refactored Dashboard first view into Today's Mission.
- Added deterministic Jobs Ready To Apply helper.
- Added dashboard mission grouping helper.
- Added source readiness helper.
- Added card-based Job Inbox review.
- Added quick review filters for ready, high-priority, follow-up due, risky, and forbidden views.
- Made paste job description the primary Job Inbox intake path.
- Added source readiness indicators.
- Added source detail/edit route.
- Made source delete require typing DELETE.
- Added tests for job readiness, dashboard mission grouping, source readiness, and quick filters.

## Completed In Phase 4.1

- Added additive `ProfileSourceLink` schema and migration.
- Added manual evidence links from sources to profile fields.
- Added profile source-link whitelist and source-type recommendation helper.
- Added profile evidence grouping/readiness summary.
- Added source detail UI for creating and deleting evidence links.
- Added Profile evidence section grouped by target field.
- Added Dashboard evidence readiness count.
- Added local agent output contract types with safety/review/evidence fields.
- Updated Agent Council page to show contract-only status and safety principles.
- Added tests for profile source links and agent contract id validation.

## Completed In Phase 5.0

- Added additive `ApplicationPacket` schema and migration.
- Added deterministic application packet helper for CV language, decision, checklist, missing items, and readiness.
- Added job-specific `/jobs/[id]/application` manual workspace.
- Added save and mark-ready packet actions.
- Linked Job Detail and Job Inbox cards to packet preparation.
- Replaced Resume Lab placeholder with manual Resume Lab MVP.
- Added Dashboard Resume Lab link and packet counts.
- Added tests for application packet language, decision, checklist, and missing inputs.

## Next Tasks

- Phase 5.1 Controlled AI Drafting after Application Packet MVP is stable.
- Refine manual source-to-profile linking after Adel adds real sources.
- Add saved job-search views.
- Add persistence/server-action integration tests.
