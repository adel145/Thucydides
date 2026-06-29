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

## Completed In Phase 5.1

- Added Application Packet READY safety gate for forbidden, archived, rejected, closed, and critically incomplete packets.
- Added additive `AiDraftRun` schema and migration for controlled draft audit records.
- Added env-gated OpenAI Responses API drafting for Application Packets only.
- Added review-only AI draft preview and explicit copy-to-packet action.
- Added tests for packet readiness safety and controlled AI drafting helpers.

## Completed In Phase 5.2

- Added helper-level persistence safety coverage for Application Packet save and mark-ready behavior.
- Added helper-level AI draft audit coverage for disabled config, blocked jobs, success records, error records, and explicit packet draft replacement.
- Refined Application Packet evidence review with available sources, missing source groups, and missing evidence links.
- Refined Resume Lab manual readiness with source group status, missing evidence links, and recent packet status counts.
- Clarified Source detail copy around manual evidence links.

## Completed In Phase 5.3

- Refreshed Job Inbox cards with clearer hierarchy, company fallback initials, metadata rows, and stronger Prepare application action.
- Refreshed Application Packet workflow summary, recommendation/status cards, and READY blocker section.
- Refreshed Resume Lab with clearer missing-data tasks and less dense base CV summaries.
- Added manual local source-file upload intake with additive upload metadata.
- Stored uploaded files under gitignored `local_uploads/sources/`.
- Added source upload helper tests.

## Completed In Phase 5.3 Correction Patch

- Added URL-only source intake for LinkedIn, GitHub, portfolio, certificate/course, and other career links.
- Separated Sources intake into upload files, profile/link sources, and pasted text/notes.
- Updated Source Detail to show URL sources with a manual Open source link action.
- Refreshed Job Inbox, Application Packet, Resume Lab, Sources, and Source Detail readability with clearer surfaces, stronger actions, and short Arabic/Hebrew helper labels.
- Updated source readiness wording so CV, LinkedIn, GitHub/projects, certificates, and academic evidence can be files, URLs, or notes where appropriate.

## Completed In Phase 5.4

- Added manual bulk evidence linking from one source to multiple profile fields.
- Added helper/test coverage for duplicate and invalid evidence-link target handling.
- Refined Resume Lab to separate profile text, source records, and evidence links.
- Added direct Resume Lab action links to Profile and Sources for missing data/evidence.
- Improved Profile real-data entry with missing-field callouts and examples for key CV fields.
- Refined comfort theme surfaces, badges, card spacing, and primary actions across main workflow pages.

## Completed In Phase 5.5

- Locked the future safe workflow: Find jobs -> Review jobs -> Select jobs -> Generate packets -> Review -> Export -> Manual apply.
- Recorded future discovery source priority and future DOCX/PDF/TXT/local-folder export goals.
- Split top-bar AI drafting status from Gmail connection status.
- Added AI/ML research student roles as deterministic positive technical signals.
- Added fixtures proving hard forbidden blockers still override AI/ML technical signals.
- Clarified Application Packet READY versus NEEDS_MANUAL_REVIEW copy.
- Added planned-only dashboard/export/Gmail-intake copy without enabling those features.

## Completed In Phase 6.0

- Added additive `GmailJobAlert` and `JobDiscoveryLead` schema models and migration.
- Added local/manual Gmail job-alert paste intake on `/gmail`.
- Added provider classification for LinkedIn, Indeed, Drushim, AllJobs, Glassdoor, Google Jobs, and Other.
- Added conservative local parser for pasted job-alert text.
- Added lead review cards with validation status, allowed signals, forbidden flags, risk notes, duplicate warnings, URLs, and snippets.
- Added manual import from safe non-forbidden leads into normal local Job records.
- Added skip and duplicate actions for local lead review.
- Added dashboard count for manual Gmail alert leads awaiting review.
- Added `npm run verify`.
- Added tests for provider classification, parser behavior, role safety, import helper behavior, duplicate detection, and lead counts.

## Next Tasks

- Tune pasted Gmail alert parsing conservatively after real copied alerts.
- Improve packet quality review before exports.
- Refine manual source-to-profile linking after Adel adds more real sources.
- Add saved job-search views if still useful.
- Add persistence/server-action integration tests.
