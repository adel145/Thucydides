# Codex Log

## 2026-06-26 Phase 0

Inspected:

- Root directory: contained the Stitch extracted folder and original zip.
- Git state: no Git repository was initialized.
- Stitch design files: design tokens, landing page HTML, logo SVG, shader snippet, and Three.js snippet.
- Runtime tools: Node and npm are available.

Created:

- Documentation memory files in `docs/`.
- Root-level Next.js App Router skeleton.
- TypeScript, Tailwind, PostCSS, Next config, ESLint config, and gitignore.
- App shell with sidebar and top bar.
- Placeholder pages for Dashboard, Profile Intelligence, Job Inbox, Job Detail, Resume Lab, Agent Council, Pipeline, Gmail, and Settings.
- UI primitives and lightweight visual effects.

Verified:

- `npm install` completed successfully.
- `npm run build` completed successfully with Next.js 15.5.19.
- `npm run lint` completed successfully with no warnings or errors.
- `npm run dev -- -p 3000` started successfully.
- `http://localhost:3000` returned HTTP 200.
- `http://localhost:3000/jobs/example-placeholder` returned HTTP 200.
- No nested `thucydides` folder exists.

Known notes:

- `npm audit` reports two moderate vulnerabilities through Next's bundled PostCSS dependency. The suggested `npm audit fix --force` would downgrade Next to 9.3.3, so it was not applied.
- `next lint` works but is deprecated and should be migrated before Next 16 adoption.

Phase boundary:

- No real product integrations were implemented.
- No database was added.
- No OpenAI or Gmail calls were added.
- Stitch files were preserved.

## 2026-06-26 Phase 1

Inspected:

- Required Phase 0 memory docs.
- Existing app shell, placeholder pages, package scripts, and project root.

Created:

- Prisma schema for `CandidateProfile`, `Job`, `ApplicationEvent`, and `SourceFile`.
- Prisma 7 config and local SQLite setup.
- Seed script with Adel profile and 10 representative jobs.
- Deterministic role rule modules and validation result type.
- Vitest test suite for allowed, forbidden, and risky role behavior.
- Real `/profile`, `/jobs`, and `/jobs/[id]` pages backed by SQLite.

Verified:

- `npm install` succeeded and ran `prisma generate`.
- `npx prisma migrate dev --name phase1_local_data` succeeded after pre-creating the empty SQLite file.
- `npm run db:seed` succeeded.
- `npm run test` succeeded: 1 test file, 7 tests.
- `npm run build` succeeded.
- `npm run lint` succeeded with the known `next lint` deprecation warning.
- HTTP checks returned 200 for `/profile`, `/jobs`, and a real seeded `/jobs/[id]`.

Not implemented:

- OpenAI, Gmail, Calendar, scraping, resume generation, exports, real agents, authentication, and deployment.

## 2026-06-26 Phase 2

Inspected:

- Required memory docs, current app routes, Phase 1 Prisma setup, role rules, profile page, job pages, and pipeline placeholder.

Created:

- `lib/jobs/jobStatus.ts` with the canonical job status model.
- `lib/jobs/jobLifecycle.ts` for tested validation update shapes.
- `lib/dashboard/dashboardMetrics.ts` for real dashboard metric calculation.
- `lib/profile/validateProfile.ts` for profile validation.
- `app/jobs/actions.ts` for create, update, validation rerun, archive, delete, and status-change server actions.
- `/jobs/[id]/edit` route.
- Status badge, event timeline, danger button, and profile form components.
- Tests for job status, dashboard metrics, job lifecycle validation helpers, and profile validation.

Updated:

- Dashboard now reads local SQLite metrics.
- Jobs page uses shared create action and shows job status.
- Job detail page shows lifecycle controls and `ApplicationEvent` history.
- Pipeline page groups real jobs by status and offers manual status transitions.
- Profile page validates and shows success/error feedback.

Verified:

- `npm install` succeeded and regenerated Prisma Client.
- `npm run db:seed` succeeded.
- `npm run test` succeeded: 5 files, 15 tests.
- `npm run build` succeeded.
- `npm run lint` succeeded with the known `next lint` deprecation warning.
- `npm run dev -- -p 3000` started successfully.
- HTTP smoke checks returned 200 for `/`, `/profile`, `/jobs`, a real `/jobs/[id]`, `/jobs/[id]/edit`, and `/pipeline`.

Not implemented:

- OpenAI, Gmail, Calendar, scraping, browser automation, resume generation, DOCX/PDF export, real agents, authentication, deployment, and source-file parsing.

## 2026-06-26 Phase 3

Created:

- Job search/filter/sort helpers and UI.
- Priority model in `lib/jobs/jobPriority.ts`.
- Source type model in `lib/sources/sourceTypes.ts`.
- `/sources` manual source-record and pasted-text intake route.
- Pipeline reminder controls for priority, next action date/note, and last contacted date.
- Type-to-confirm hard delete route.
- Israeli job-post fixtures in `tests/fixtures/israeliJobs.ts`.
- Additional tests for filters, priority, source types, dashboard follow-up metrics, and Israeli fixtures.

Updated:

- Prisma schema with additive `Job` reminder/priority fields.
- Prisma schema with optional source path/url/notes and `updatedAt`.
- Dashboard with due, overdue, and high-priority metrics.
- Job detail with reminder fields and delete confirmation link.
- Sidebar with Sources navigation.
- Role rules with real Hebrew patterns for Israeli-market forbidden and allowed signals.

Verified:

- `npm install` succeeded.
- `npx prisma migrate dev --name phase3_campaign_intelligence` succeeded after correcting migration folder order.
- `npm run db:seed` succeeded.
- `npm run test` succeeded: 8 files, 27 tests.
- `npm run build` succeeded.
- `npm run lint` succeeded with the known `next lint` deprecation warning.
- `npm run dev -- -p 3000` succeeded.
- HTTP smoke checks returned 200 for `/`, `/profile`, `/jobs`, `/sources`, a real `/jobs/[id]`, `/jobs/[id]/edit`, `/jobs/[id]/delete`, and `/pipeline`.

Note:

- The initially generated Phase 3 migration timestamp sorted before the Phase 1 migration. The folder was renamed to `20260626190000_phase3_campaign_intelligence` and the local `_prisma_migrations` record was updated so shadow replay applies Phase 1 before Phase 3.

## 2026-06-28 Phase 4.0

Created:

- `lib/jobs/jobReadiness.ts` for deterministic Jobs Ready To Apply readiness.
- `lib/dashboard/dashboardMission.ts` for Today's Mission grouping.
- `lib/sources/sourceReadiness.ts` for manual source readiness.
- `/sources/[id]` source detail/edit route.
- Tests for job readiness, dashboard mission grouping, source readiness, and quick filters.

Updated:

- Dashboard first-open experience now starts with Today's Mission.
- Job Inbox now uses review cards, quick review filters, and a paste-first intake layout.
- Sources now shows readiness and links to editable source records.
- Source deletion now requires typing DELETE.
- Docs now describe Phase 4.0 as implemented.

Not implemented:

- OpenAI, Gmail, Google Calendar, scraping, browser automation, upload parsing, real agents, resume generation, DOCX/PDF export, authentication, deployment, automatic applications, and automatic emails.

## 2026-06-28 Phase 4.0 QA Patch

Updated:

- Centralized active/actionable/ready job logic in `lib/jobs/jobReadiness.ts`.
- Tightened quick filters so ready, high-priority, and follow-up due views exclude archived, rejected, and forbidden jobs as appropriate.
- Kept forbidden/archive review focused on active forbidden jobs that may still need archiving.
- Tightened dashboard mission grouping so forbidden jobs do not appear in due/overdue follow-ups or high-priority mission sections.

Verified:

- Added tests for ready-to-apply exclusions, quick filter exclusions, forbidden/archive behavior, and dashboard mission exclusions.

Not implemented:

- No integrations, schema changes, AI, Gmail, scraping, upload parsing, real agents, auth, deployment, automatic applications, or automatic emails.

## 2026-06-28 Phase 4.1

Created:

- `ProfileSourceLink` additive Prisma model and migration.
- `lib/profile/profileSourceLinks.ts` for target field whitelist, source-type recommendations, grouping, and readiness summary.
- `lib/agents/agentContracts.ts` for future agent output contracts only.
- Tests for profile source links and agent contract id validation.

Updated:

- Source detail page can create/delete manual evidence links to profile fields.
- Profile page shows linked evidence grouped by target profile field.
- Dashboard shows profile evidence readiness counts.
- Agent Council page states that only contracts and safety rules exist.
- Seed reset order handles `ProfileSourceLink`.

Verified:

- `npx prisma migrate dev --name phase4_1_profile_source_links` succeeded.
- `npx prisma generate` succeeded.
- `npm run db:seed` succeeded.

Not implemented:

- No real AI, OpenAI calls, Gmail, Calendar, scraping, upload parsing, source parsing, generated resume text, real agents, authentication, deployment, automatic applications, or automatic emails.

## 2026-06-28 Phase 5.0

Created:

- `ApplicationPacket` additive Prisma model and migration.
- `lib/applications/applicationPacket.ts` for deterministic CV language, application decision, checklist, missing-item, and readiness summaries.
- `/jobs/[id]/application` manual job-specific application workspace.
- Application packet save and mark-ready server actions.
- Tests for application packet helper behavior.

Updated:

- Job Detail and Job Inbox cards link to packet preparation.
- Dashboard links to Resume Lab and shows application packet counts.
- Resume Lab now shows profile readiness, source readiness, evidence readiness, base CV data, missing inputs, and recent packets.
- Seed reset order handles `ApplicationPacket`.

Verified:

- `npx prisma migrate dev --name phase5_application_packet` succeeded.
- `npx prisma generate` succeeded.
- `npm run db:seed` succeeded.

Not implemented:

- No AI generation, OpenAI calls, Gmail, Calendar, scraping, upload parsing, resume export, DOCX/PDF generation, real agents, authentication, deployment, automatic applications, or automatic emails.

## 2026-06-28 Phase 5.1

Created:

- `AiDraftRun` additive Prisma model and migration.
- `lib/ai/openaiClient.ts` for the env-gated Responses API boundary.
- `lib/ai/applicationDrafting.ts` for packet-scoped prompt building, safety checks, JSON schema, and output validation.
- Controlled AI drafting panel on `/jobs/[id]/application`.
- Tests for AI drafting config, blocked jobs, review-only prompt wording, output validation, and Responses API text extraction.

Updated:

- Application Packet READY status is now safety-gated by deterministic job status, validation status, critical checklist items, and decision safety.
- Forbidden, archived, and rejected jobs cannot be marked READY through form saves or the Mark ready action.
- Risky jobs can be READY only as `NEEDS_MANUAL_REVIEW` with required manual preparation fields present.
- `.env.example` now includes `OPENAI_MODEL`.
- Docs now describe Phase 5.1 controlled drafting and remaining exclusions.

Verified:

- Gate A passed before AI work: `npm run test`, `npm run build`, and `npm run lint`.

Not implemented:

- No Gmail, Calendar, scraping, browser automation, upload parsing, real agents, autonomous applications, automatic emails, DOCX/PDF export, auth, deployment, or resume export.

## 2026-06-28 Phase 5.1 QA Patch

Updated:

- Responses API request body now explicitly sets `tools: []`, `tool_choice: "none"`, and keeps `store: false`.
- AI draft validation now rejects non-string items in generated array fields instead of accepting mixed arrays.
- Application Packet UI copy now states that applying an AI draft replaces current packet draft fields and sends nothing.
- `markApplicationPacketReady` now redirects with `packetMissing=1` if no saved packet exists.

Verified:

- Added tests for OpenAI request body hardening and stricter AI draft output validation.

Not implemented:

- No Gmail, Calendar, scraping, browser automation, upload parsing, DOCX/PDF export, automatic applications, automatic emails, real autonomous agents, auth, deployment, or new AI features outside controlled Application Packet drafting.

## 2026-06-29 Phase 5.2

Created:

- Helper-level tests for Application Packet save preparation, READY blocking, packet-missing handling, checklist snapshots, and missing items.
- Helper-level tests for AI draft disabled/blocked reasons, success audit records, error audit records, and explicit packet draft replacement fields.

Updated:

- Application Packet actions now use shared preparation helpers for save and mark-ready persistence data.
- AI draft actions now use shared helpers for audit records and explicit packet draft field replacement.
- Application Packet page now shows source availability, missing source groups, and missing evidence links before applying.
- Resume Lab now shows source group readiness, missing evidence links, and recent packet status counts.
- Source detail copy clarifies that recommended profile fields are suggestions only.

Not implemented:

- No Gmail, Calendar, scraping, browser automation, upload parsing, DOCX/PDF export, automatic applications, automatic emails, real autonomous agents, auth, deployment, resume export, fake AI output, or new AI scope outside controlled Application Packet drafting.

## 2026-06-29 Phase 5.3

Created:

- Additive `SourceFile` upload metadata migration.
- `lib/sources/sourceUploads.ts` for safe local upload filename/path/size helpers.
- Manual local upload form on `/sources`.
- Upload metadata display on `/sources/[id]`.
- Tests for source upload helper behavior.

Updated:

- Job Inbox cards now use clearer hierarchy, company fallback initials, metadata rows, lighter surfaces, and a stronger Prepare application action.
- Application Packet page now leads with a workflow summary, recommendation/status cards, and a focused READY blocker section.
- Resume Lab now has clearer missing-data tasks and less dense base CV summaries.
- `local_uploads/` is gitignored so private uploaded files stay out of git.

Not implemented:

- No Gmail, Calendar, scraping, browser automation, automatic parsing, OpenAI file processing, DOCX/PDF export, automatic applications, automatic emails, real autonomous agents, auth, deployment, resume export, or fake AI output.

## 2026-06-29 Phase 5.3 Correction Patch - Source Link Intake + Readability Theme Refresh

Created:

- Separate URL-only source intake for LinkedIn, GitHub, portfolio, certificate/course, and other career links.
- Source Detail URL card with a manual Open source link action.

Updated:

- Sources now separates upload files, profile/link sources, and pasted text/notes.
- Source readiness wording now describes files, URLs, pasted text, and notes where appropriate.
- Job Inbox, Application Packet, Resume Lab, Sources, and Source Detail now use clearer surfaces, stronger actions, and short Arabic/Hebrew helper labels where useful.
- Docs now record the correction patch and the rule that URL sources are not scraped, fetched, parsed, or sent to OpenAI.

Not implemented:

- No Gmail, Calendar, scraping, browser automation, automatic parsing, OpenAI file processing, DOCX/PDF export, automatic applications, automatic emails, real autonomous agents, auth, deployment, resume export, remote logo fetching, or fake AI output.
