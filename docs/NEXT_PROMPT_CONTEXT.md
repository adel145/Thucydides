# Next Prompt Context

Thucydides is a local-first Next.js app in `C:\Users\adelm\Documents\Thucydides`. The repo and docs are the official project memory.

As of Phase 6.0, the app supports local SQLite profile/jobs/sources/pipeline data, deterministic validation, job filters, priority/reminder fields, audit events, manual evidence links, application packets, controlled Application Packet AI drafting, and local/manual Gmail job-alert paste intake.

## Product Mission

The mission is to help Adel reach 10 interviews in the Israeli job market. Adel lives in Beersheba, prefers the South, is open to strong roles across Israel, can consider remote roles if he can work from Israel, and expects to complete remaining degree requirements around September.

Target roles include Help Desk, IT Support, Technical Support, PC Technician, NOC, QA Manual, QA Automation Junior, junior software engineering/development, data/BI, junior data engineering, AI/ML/computer vision junior, AI/ML research student roles, application/product/API support engineering, system administrator junior, junior DevOps, SOC Tier 1, Implementation Engineer, Technical Integration, Solutions Engineer Junior, and safe technical infrastructure/state-project roles.

Hard forbidden roles remain sales, regular customer service, non-technical service center, regular מוקד שירות, mandatory security clearance, and mandatory army experience. Degree-completion requirements before September are risk/manual-check notes, not hard forbidden blockers.

## Current Behavior

- Dashboard first view is Today's Mission.
- Job Inbox uses local job cards, filters, sorting, lifecycle actions, and manual pasted-job intake.
- Jobs Ready To Apply is deterministic readiness only, not a real fit score.
- Sources supports manual file upload records, URL-only source records, pasted text/notes, and manual source-to-profile evidence links.
- Uploaded source files stay under `local_uploads/sources/`; files are not parsed and are not sent to OpenAI.
- Application Packet stores one manual job-specific workspace per job.
- READY status is safety-gated: forbidden, archived, rejected, closed, or critically incomplete packets stay DRAFT.
- Controlled OpenAI drafting exists only inside Application Packet when `OPENAI_API_KEY` and `OPENAI_MODEL` are configured.
- OpenAI drafting uses the Responses API with `store: false`, `tools: []`, `tool_choice: "none"`, no browsing, no Gmail, and no autonomous application behavior.
- Generated drafts are review-only and must be explicitly copied into packet fields by Adel.
- Top-bar status separates SQLite, AI drafting configuration, and Gmail. It says "AI drafting configured" when env values exist; Gmail remains "Gmail not connected."

## Phase 6.0 Gmail Alert Intake

Phase 6.0 adds local/manual Gmail job-alert paste intake:

- `/gmail` lets Adel paste job alert email text from LinkedIn, Indeed, Drushim, AllJobs, Glassdoor, Google Jobs, or another provider.
- `GmailJobAlert` stores pasted alert metadata and raw text locally.
- `JobDiscoveryLead` stores extracted local review candidates.
- `lib/gmail/gmailAlertProviders.ts` classifies providers.
- `lib/gmail/gmailJobAlertParser.ts` extracts conservative candidate leads and source URLs when obvious.
- `lib/gmail/jobLeadImport.ts` builds safe Job create data, blocks forbidden imports, and detects duplicates.
- `lib/gmail/gmailLeadCounts.ts` counts local leads awaiting review for the dashboard.
- `/gmail` shows lead review cards with validation status, allowed signals, forbidden flags, risk notes, duplicate warnings, source URL, and raw snippet.
- Safe non-forbidden leads can be manually imported into the normal Job Inbox.
- Imported leads become normal local `Job` records and get an `ApplicationEvent`.
- Forbidden leads remain blocked from normal import in this phase.
- Dashboard shows "Manual Gmail alert leads awaiting review"; this is pasted alert text only, not inbox scanning.

## Hard Boundaries

- Gmail OAuth is not implemented.
- The app does not read Gmail automatically.
- No email is sent.
- No automatic application is submitted.
- No scraping exists.
- No browser automation exists.
- No OpenAI call is used for Gmail alert parsing.
- No DOCX/PDF export exists.
- No real autonomous agents exist.
- No auth or deployment exists.

## Product Direction

Locked future workflow: Find jobs -> Review jobs -> Select jobs -> Generate packets -> Review -> Export -> Manual apply.

Future discovery should prioritize company career pages first, then LinkedIn, Indeed, Drushim, AllJobs, Glassdoor/Google Jobs, and Gmail job-alert fallback/intake. Phase 6.0 only implements manual pasted alert intake.

Future exports should support DOCX/PDF for CV and cover letters, TXT for recruiter messages/notes, local per-job folders, and RTL/LTR support. Export is not implemented yet.

Agent vision to preserve: Adel wants a council-based system with Career Strategy Agent, Israeli Job Market Agent, ATS Optimization Agent, CV Tailoring Agent, Hebrew Language Agent, English Language Agent, Job Fit Scoring Agent, Hidden Market / Sourcing Agent, Risk & Compliance Agent, and Final Decision Chief Agent. Agents must not silently apply or send emails; Adel must review and confirm, with audit trail and uncertainty labels.

## Known Toolchain Notes

- `npm audit` reports moderate transitive dependency findings; do not use a forced fix without reviewing breaking changes.
- `next lint` is deprecated and should be migrated before upgrading to Next 16.
- If migration fails with a blank schema-engine error on a missing SQLite file, create the empty file first, then rerun migrations.
- Phase 3 migration folder is `20260626190000_phase3_campaign_intelligence`; it must sort after the Phase 1 migration for Prisma shadow replay.

## Recommended Next Work

1. Manually QA `/gmail` with real copied LinkedIn/Indeed/Drushim/AllJobs alerts and tune parser patterns conservatively.
2. Add a dedicated lead detail page only if review cards become too dense.
3. Consider read-only Gmail OAuth in Phase 6.1 or later only after explicit OAuth, privacy, and safety design.
4. Keep imports manual and keep forbidden leads blocked unless a future override flow is designed.
