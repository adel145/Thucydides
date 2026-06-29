# Current State

As of 2026-06-29, Thucydides is in Phase 6.1 - Internet Job Discovery Engine + Company Career Pages First state.

## What Exists

- Project root: `C:\Users\adelm\Documents\Thucydides`.
- Stitch reference folder preserved: `stitch_mission_matrix_web_design/`.
- Official memory/spec docs exist in `docs/`.
- A root-level Next.js App Router skeleton exists.
- Shared layout and navigation exist.
- Pages exist for planned modules:
  - Dashboard
  - Profile Intelligence
  - Job Inbox
  - Job Detail
  - Resume Lab
  - Agent Council
  - Pipeline
  - Gmail
  - Settings
- Dashboard has a Today's Mission first-open view backed by local SQLite data.
- Dashboard shows manual Gmail alert leads awaiting review. This count comes from pasted local alert leads, not inbox scanning.
- Dashboard shows internet discovery runs, review leads, enriched leads, and blocked leads. Copy says company career pages first, platforms second, Gmail alerts third.
- UI reflects the Stitch-inspired dark navy, neon aqua, glass command-center style.
- Dependencies have been installed into `node_modules/`.
- The dev server was started on `http://localhost:3000`.
- Production build and lint checks pass.
- Prisma 7 and SQLite are configured.
- Local database file exists at `prisma/dev.db`.
- Seed profile exists for Adel Mohsen.
- Ten seed jobs exist with deterministic validation statuses.
- `/profile` loads and saves the local candidate profile and highlights missing real profile data for technical skills, GitHub projects, portfolio links, field experience, and certificates.
- `/jobs` lists local jobs as clearer LinkedIn-style review cards with stronger contrast and can create manually entered jobs from pasted descriptions.
- `/jobs` supports text search, validation/status/facet filters, sorting, visible active-filter state, and clear filters.
- `/jobs` supports quick review filters for ready-to-apply, high-priority, due follow-up, risky review, and forbidden/archive review views.
- Job cards show metadata, validation status, pipeline status, priority, next action date, signal/flag counts, risk/blocker preview, and quick links for details, edit, and archive.
- `/jobs/[id]` shows stored job metadata, raw description, validation status, flags, signals, risk notes, manual lifecycle actions, and event history.
- `/jobs/[id]` shows priority, next action, next action note, and last contacted date.
- `/jobs/[id]/edit` edits local job records and reruns deterministic validation.
- `/jobs/[id]/delete` provides a type-to-confirm hard-delete flow.
- Jobs can be manually rerun through validation, archived, hard deleted, or moved between pipeline statuses.
- `/pipeline` groups real jobs by status and can manually change status.
- `/pipeline` can set priority, next action date, next action note, and last contacted date.
- `ApplicationEvent` records are created for new job creation, job updates, validation reruns, status changes, and archives.
- `/profile` validates required fields, salary consistency, and honest degree wording; it shows save feedback and preserves submitted values on validation errors.
- `/profile` shows source records and manual evidence links without upload parsing.
- `/sources` manages local source records through three manual paths: local file uploads, profile/link sources, and pasted text or notes.
- Uploaded source files are stored under `local_uploads/sources/` with local metadata and are gitignored.
- LinkedIn, GitHub, portfolio, certificate/course, and other career URLs can be added as URL-only source records without requiring a file upload.
- `/sources/[id]` can manually link one source to multiple allowed profile fields as evidence in one save.
- `/sources/[id]` shows URL-only sources with an explicit Open source link action and no scraping or metadata fetching.
- `/profile` shows profile source evidence grouped by target field.
- Dashboard source readiness includes manual profile evidence link counts.
- `ProfileSourceLink` stores manual evidence/audit links between `SourceFile` and `CandidateProfile`.
- Local agent contract types exist for future evidence-based agent output, with no execution.
- `ApplicationPacket` stores one manual job-specific application workspace per job.
- `AiDraftRun` stores controlled application-packet draft attempts, generated output, errors, model, prompt version, and input summary.
- `/jobs/[id]/application` shows a workflow-oriented application packet with job summary, recommendation, readiness blockers, evidence review, risks, and manual draft fields.
- `/jobs/[id]/application` prevents READY status for forbidden, archived, rejected, or critically incomplete packets.
- `/jobs/[id]/application` can request controlled OpenAI drafting only when `OPENAI_API_KEY` and `OPENAI_MODEL` are configured.
- Controlled OpenAI requests use `store: false`, `tools: []`, and `tool_choice: "none"`.
- Top-bar status separates local SQLite, AI drafting configuration, and Gmail connection state. If OpenAI env values are configured, it says "AI drafting configured"; Gmail remains "Gmail not connected."
- AI draft output is review-only and must be explicitly copied into packet fields by Adel; that copy action replaces current packet draft fields.
- AI draft output validation rejects non-string values in generated array fields.
- Application Packet save/mark-ready behavior has pure helper coverage for persistence safety, READY blocking, packet-missing handling, and checklist snapshots.
- Application Packet evidence review now shows manual source availability, missing source groups, and missing profile-evidence links before applying.
- Job detail and Job Inbox link to application packet preparation.
- `/resumes` is a clearer manual Resume Lab workspace showing profile text readiness, source record readiness, evidence link readiness, missing-data tasks, base CV data, and recent application packet status counts.
- Dashboard includes a Resume Lab button and application packet counts.
- Dashboard includes jobs ready to apply, due follow-ups, overdue follow-ups, high-priority jobs, recent jobs, and profile/source readiness warnings.
- Pure helpers exist for deterministic job readiness, dashboard mission grouping, and source readiness.
- Vitest tests exist for role validation with Israeli fixtures, job statuses, lifecycle validation helpers, dashboard metrics, profile validation, filters, priority, source types, application packet persistence safety, and controlled AI draft audit helpers.
- Completed-degree requirements are risk/manual-check notes rather than hard forbidden blockers.
- AI/ML and research-student roles are positive deterministic technical signals, including Deep Learning, Machine Learning, AI Research, Research Student, Student Researcher, Computer Vision, Data Science Student, Algorithm Student, AI/ML Intern, and Research Intern wording.
- Hard forbidden role logic still overrides positive technical signals for sales, regular customer service, non-technical service center, mandatory security clearance, and mandatory army experience.
- Top-bar and placeholder page copy reflects local SQLite status, controlled packet drafting, and planned later-phase Gmail/agent work.
- Dashboard shows honest planned/local cards for future job discovery, manual Gmail job-alert paste intake, and future CV/PDF packet export.
- Application Packet explains that READY means packet/checklist completeness, while NEEDS_MANUAL_REVIEW means Adel still reviews job fit before applying.
- Application Packet and Resume Lab mention DOCX/PDF export as planned only; current packet content remains manual text.
- Job Inbox, Application Packet, Resume Lab, Sources, Source Detail, and Profile now use clearer surfaces, stronger borders/actions, and short Arabic/Hebrew helper labels where useful.
- Source readiness can be 4/4 while profile text or evidence links remain incomplete; Resume Lab now separates those concepts.
- `/gmail` supports local/manual Gmail job-alert paste intake.
- `GmailJobAlert` stores pasted alert metadata and raw text locally.
- `JobDiscoveryLead` stores extracted local review candidates.
- `/gmail` extracts conservative candidate leads from pasted LinkedIn, Indeed, Drushim, AllJobs, Glassdoor, Google Jobs, or other alert text.
- `/gmail` shows validation status, allowed signals, forbidden flags, risk notes, duplicate warnings, source URL, and raw snippets for lead review.
- Safe non-forbidden leads can be manually imported into the normal Job Inbox.
- Imported leads become normal local `Job` records and get an `ApplicationEvent`.
- Forbidden leads remain blocked from normal import in Phase 6.1.
- `/discovery` supports env-gated internet job discovery through Tavily and SerpApi.
- `/discovery` keeps all results as `JobDiscoveryLead` review candidates before import.
- `JobDiscoveryRun` stores discovery run status, provider/query metadata, counts, and errors.
- Discovery helpers support company-career queries, platform queries, Greenhouse public board detection/mapping, public page fetch, JSON-LD JobPosting extraction, HTML fallback extraction, deterministic fit scoring, and duplicate checks.
- Safe non-forbidden discovery leads can be manually imported into the normal Job Inbox.
- Imported discovery leads create normal local `Job` records and `JOB_IMPORTED_FROM_DISCOVERY` events.
- Forbidden discovery leads remain blocked from normal import.

## Latest UX Review Summary

- The dark command-center direction and sidebar should stay.
- The app feels too fully English in places; future UI should stay English but include helpful Hebrew job-market terms and simpler explanations.
- The dashboard has too many cards for first-open use. Future priority should be Today's Mission and Jobs Ready To Apply.
- Job Inbox should move toward job cards and a paste-job-description workflow. The current Add Manual Job form is useful but should not dominate the experience.
- Profile and Sources must be filled with real Adel data before serious AI, CV tailoring, or resume work.
- Adding a source is not enough for CV readiness; Adel must manually fill profile text and manually link source evidence.
- Resume Lab, Agent Council, Gmail, and Settings should remain visible as roadmap pages with honest copy.
- The locked future workflow is: Find jobs -> Review jobs -> Select jobs -> Generate packets -> Review -> Export -> Manual apply.
- Planned discovery sources are company career pages first, then LinkedIn, Indeed, Drushim, AllJobs, Glassdoor/Google Jobs, and Gmail job alerts as fallback/intake.
- Planned exports are DOCX/PDF for CV and cover letters, TXT for recruiter messages/notes, local per-job folders, and RTL/LTR support.

## What Does Not Exist Yet

- No Gmail OAuth.
- No automatic Gmail inbox reading.
- No applying through provider APIs.
- No login/captcha bypass.
- No scraping behind authentication.
- No Google Calendar.
- No scraping or browser automation.
- No real resume generation.
- No DOCX/PDF export.
- No real job scoring.
- No real agent execution.
- No authentication.
- No deployment setup.
- No automatic parsing for uploaded source files.
- No notification system for due follow-ups.
- No automatic source-to-profile linking.
- No AI/agent execution from the contract types.
- No autonomous AI/agent execution from the contract types.
- No AI-generated content outside controlled Application Packet drafting.
- No automatic applications or automatic emails.

## Important Warning

Dashboard, jobs, sources, packets, pasted Gmail alerts, discovery runs, discovery leads, and AI draft runs are local SQLite data. Gmail OAuth, automatic inbox reading, authenticated scraping, automatic applications, resume exports, notifications, and file parsing remain placeholders.

Profile, Sources, and manual evidence links are the required groundwork for useful AI/resume features. Controlled AI drafting may use only reviewed local packet/profile/source data, and generated text must stay behind Adel review and confirmation.

## Known Limitations

- `npm audit` currently reports five moderate findings in transitive dependencies. The forced audit fix was not applied.
- The `lint` script uses `next lint`, which is currently working but deprecated by Next.js.
- On this Windows/Node 24 machine, Prisma migration creation failed when `prisma/dev.db` did not exist. Creating an empty SQLite file first allowed `npx prisma migrate dev --name phase1_local_data` to apply the migration normally.
