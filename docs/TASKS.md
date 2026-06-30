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

## Completed In Phase 6.1

- Added env-gated internet discovery foundation with company career pages first, job platforms second, Gmail alerts third.
- Added optional Tavily and SerpApi provider config helpers and clients with timeouts.
- Added company-career query generation and target company defaults.
- Added Greenhouse public board token detection and job mapping.
- Added public page fetch and JSON-LD JobPosting / visible HTML extraction.
- Added deterministic discovery fit scoring and review counts.
- Added `/discovery` page with provider status, run form, run history, and lead review board.
- Added discovery server actions for running discovery, enrichment retry, import, skip, and duplicate marking.
- Added discovery import path that uses enriched/extracted descriptions before noisy snippets.
- Added additive `JobDiscoveryRun` model and internet discovery fields on `JobDiscoveryLead`.
- Expanded deterministic role rules for backend, full-stack, Python, software engineer, AI training, and software-student titles.
- Added tests for provider config, query generation, Greenhouse, extraction, scoring, role rules, import behavior, and counts.

## Completed In Phase 6.1A

- Added `DiscoverySourceCandidate` so Tavily/search/career-page results are stored before any job lead is created.
- Added source classification for actual job postings, ATS job postings, ATS boards, career listings, search pages, aggregator lists, generic company pages, noisy pages, and blocked pages.
- Tightened discovery import so only verified single postings or structured Google Jobs results can become importable leads.
- Hardened public page fetching with URL scheme, localhost/private-IP, and content-type safety checks.
- Tightened Greenhouse handling so exact job URLs map one job and boards are filtered for Israel/remote target roles.
- Split `/discovery` into source candidates and job leads, with import disabled for low-confidence or non-posting sources.
- Added skip-non-imported-leads action for discovery runs without touching imported leads.
- Added tests for broad/generic titles, JSON-LD importability, Greenhouse exact/board behavior, unsafe URLs, non-importable sources, hard forbidden verified postings, and skip safety.

## Completed In Phase 6.1B

- Added provider diagnostics for Tavily and SerpApi on `/discovery`.
- Added clear SerpApi 401 message: check `SERPAPI_API_KEY`/account outside the app.
- Added source candidate actions for retry classify, try enumerate jobs, and skip candidate.
- Added safe public Workday foundation for search-page classification, visible specific job links, exact public job-page verification, and JS-only/blocked-page errors.
- Added generic public career-link extraction for target technical roles.
- Added source candidate enumeration that creates new candidates for specific links or verified leads only for single postings.
- Kept broad Glassdoor/listing pages unsupported and non-importable.
- Added tests for provider diagnostics, Workday behavior, generic link extraction, unsupported aggregators, enumeration count updates, strict import gates, and hard-forbidden verified postings.

## Completed In Phase 6.1C

- Renamed provider status copy to key present/missing and separated it from verified/failed provider tests.
- Deduped repeated SerpApi 401/auth messages and stopped further SerpApi queries in the same run after an auth failure.
- Added Markdown link and plain public URL extraction to career-link extraction.
- Updated enumeration to read fetched content plus saved candidate raw text/snippets.
- Added idempotent candidate/lead dedupe for repeated Try enumerate jobs actions.
- Split `/discovery` into sources to process, verified job postings, legacy/noisy leads, and skipped/unsupported candidates.
- Added Hide old non-importable leads action that marks old noisy leads SKIPPED without deletion or touching imported jobs.
- Added tests for Markdown/plain URL extraction, NVIDIA Workday candidate text, idempotent candidate dedupe, provider status labels, legacy/noisy lead filtering, and hide safety.

## Completed In Phase 6.1D

- Added a top `/discovery` "What to do next" guide for provider tests, enumeration, review, import, and cleanup.
- Duplicated the safe cleanup action near provider tests as "Clean old noisy leads" with no deletion and no imported-job changes.
- Renamed discovery sections to "Verified job postings" and "Sources to process".
- Added verified posting state labels for ready-to-import, blocked, duplicate, and needs-review cases.
- Improved source candidate cards with domain, classification/status context, and extracted-link next-action copy.
- Improved Workday/plain-URL title cleanup so readable Markdown/nearby titles are preferred over raw ids.
- Added tests for title cleanup, source-candidate title preservation, verified posting action states, legacy/noisy separation, and safe hide behavior.

## Completed In Phase 6.1E

- Made discovery lead view helpers distinguish verified posting visibility from ready-to-import readiness.
- Kept low-confidence, duplicate, imported, and blocked verified postings in the Verified job postings section.
- Added explicit state labels for Ready to import, Blocked, Duplicate, Imported, and Needs review.
- Kept legacy/noisy leads reserved for non-job sources, search/listing/generic/noisy old leads.
- Tightened Workday extracted-link candidate classification so only exact public Workday job URLs become `ATS_JOB_POSTING`.
- Kept Workday search/listing URLs as ATS board/source candidates requiring enumeration.
- Added tests for low-confidence verified postings, duplicate/imported verified states, Workday search candidate classification, exact Workday verification, and cleanup safety.

## Completed In Phase 6.1F

- Converted `/discovery` user-facing workflow copy to Hebrew RTL while keeping provider names and enum badges technical where useful.
- Added Hebrew action/state labels for source candidates, verified postings, cleanup, provider tests, import, duplicate, skip, and enrichment actions.
- Added responsive overflow guards across `/discovery` cards so long URLs, Markdown snippets, provider text, and descriptions wrap or stay clipped.
- Changed source candidate cards to show short previews by default with full source text inside expandable details.
- Changed verified job cards to show large Hebrew state badges and put full descriptions behind expandable details.
- Kept Phase 6.1E discovery eligibility, duplicate, forbidden, import, and Workday exact-job behavior unchanged.

## Next Tasks

- Manually QA provider diagnostics, Markdown/URL candidate enumeration, discovery action clarity, and real Tavily/SerpApi runs.
- Add more public ATS adapters only after manual QA.
- Tune pasted Gmail alert parsing conservatively after real copied alerts.
- Improve packet quality review before exports.
- Refine manual source-to-profile linking after Adel adds more real sources.
- Add saved job-search views if still useful.
- Add persistence/server-action integration tests.
