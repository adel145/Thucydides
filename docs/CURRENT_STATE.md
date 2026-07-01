# Current State

As of 2026-07-01, Thucydides is in Phase 6.4 - Discovery Cleanup, Run History Hygiene, and Provider Failure Clarity state.

## What Exists

- Project root: `C:\Users\adelm\Documents\Thucydides`.
- Stitch reference folder preserved: `stitch_mission_matrix_web_design/`.
- Official memory/spec docs exist in `docs/`.
- A root-level Next.js App Router skeleton exists.
- Shared layout and navigation exist and now render as Hebrew-first RTL surfaces.
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
- Core visible UI is Hebrew-first and RTL, while technical product terms, enum/status badges, URLs, and env vars remain English where useful.
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
- Job Inbox, Application Packet, Resume Lab, Sources, Source Detail, and Profile now use clearer Hebrew RTL surfaces, stronger borders/actions, and short action-oriented helper labels.
- Source readiness can be 4/4 while profile text or evidence links remain incomplete; Resume Lab now separates those concepts.
- `/gmail` supports local/manual Gmail job-alert paste intake.
- `GmailJobAlert` stores pasted alert metadata and raw text locally.
- `JobDiscoveryLead` stores extracted local review candidates and verified internet job leads.
- `DiscoverySourceCandidate` stores Tavily/search/career-page candidates before they are allowed to become job leads.
- `/gmail` extracts conservative candidate leads from pasted LinkedIn, Indeed, Drushim, AllJobs, Glassdoor, Google Jobs, or other alert text.
- `/gmail` shows validation status, allowed signals, forbidden flags, risk notes, duplicate warnings, source URL, and raw snippets for lead review.
- Safe non-forbidden leads can be manually imported into the normal Job Inbox.
- Imported leads become normal local `Job` records and get an `ApplicationEvent`.
- Forbidden leads remain blocked from normal import in Phase 6.3.
- `/discovery` supports env-gated internet job discovery through Tavily and SerpApi.
- `/discovery` separates source candidates from job leads. Search/listing/generic/company pages stay as source candidates; only verified single job postings become importable leads.
- `/discovery` can test Tavily and SerpApi from the UI. Provider badges say key present/missing until a test verifies or fails them. SerpApi 401 is shown as "SerpApi authorization failed: check SERPAPI_API_KEY/account." without printing keys.
- `/discovery` source candidates now have retry classify, try enumerate jobs, and skip candidate actions.
- `/discovery` now separates verified job postings, sources to process, legacy/noisy leads, and skipped/unsupported candidates.
- `/discovery` now ranks source candidates with deterministic quality signals and keeps the primary sources-to-process section focused on records with a real next action.
- `/discovery` now separates already-processed source candidates into a secondary "processed sources" section so old enumerated sources do not crowd current action work.
- `/discovery` now collapses repeated source candidates by canonical display key, without deleting or mutating database records.
- Generic Workday search/listing boards without Israel/remote evidence are demoted and should no longer appear as `HIGH 100` just because they mention technical roles.
- `/discovery` counts now emphasize sources needing action, processed sources, verified postings, ready-to-import postings, blocked postings, and low-priority/skipped/unsupported records.
- `/discovery` has a top "What to do next" guide and a top "Clean old noisy leads" action near provider tests.
- `/discovery` is now a Hebrew RTL review page with right-aligned copy and action-oriented labels.
- `/discovery` uses min-width, max-width, overflow, and word-wrapping guards so long URLs, Markdown snippets, provider text, and descriptions do not create horizontal page scroll.
- `/discovery` candidate and lead cards show short previews by default and put full raw/source text behind expandable details.
- `/discovery` can hide old non-importable discovery leads by setting them to SKIPPED without deleting data or touching imported jobs.
- `/discovery` keeps verified postings visible for review when they are ready, blocked, duplicate, imported, or need review; duplicate/low-confidence verified postings do not fall into legacy/noisy.
- `/discovery` keeps verified forbidden postings visible for review, but marks them as blocked and disables import.
- Candidate enumeration supports Greenhouse boards, safe public Workday pages, and generic public career HTML link extraction.
- Candidate enumeration extracts HTML links, Markdown links, and plain job URLs from fetched content plus saved candidate text/snippets, deduping by URL.
- Career-link extraction now reduces obvious non-target location noise such as clear US-only/Santa Clara/Austin/New York/London/Germany/India signals while preserving Israel/remote links and strong unknown-location technical links for lower-priority review.
- Markdown link titles are preserved. Plain Workday or career URLs use readable surrounding text when possible and fall back to "Untitled job link from Workday" or "Untitled job link from career page" instead of raw hash-like ids.
- `JobDiscoveryRun` stores discovery run status, provider/query metadata, counts, and errors.
- Discovery helpers support company-career queries, platform queries, Greenhouse public board detection/mapping, safe public page fetch, source classification, JSON-LD JobPosting extraction, HTML fallback extraction, deterministic fit scoring, and duplicate checks.
- Greenhouse exact job URLs map only that job; Greenhouse boards are enumerated and filtered for Israel/remote target roles instead of blindly taking the first listing.
- Workday search/listing pages are ATS board candidates, exact public Workday job pages can become ATS job leads only after title and meaningful description are visible, and JS-only/blocked Workday pages remain candidates with errors.
- Workday extracted links no longer become candidates merely because they are on `myworkdayjobs.com`; exact/listing handling still follows the Phase 6.1E safety rule, with clear non-target links filtered out before candidate creation.
- Public job-page enrichment now uses a deterministic extraction order: JSON-LD JobPosting, safe static ATS patterns for Greenhouse/Workday/Lever-style pages, then cleaned visible HTML fallback.
- Extracted descriptions are cleaned to remove common navigation, menu, search, cookie, footer, "opens in new tab", and employer-site apply noise, including page chrome embedded inside longer lines.
- Broad meaningful-description extraction remains available, but import readiness now requires stricter import-quality body evidence.
- Ready-to-import discovery postings require verified single-job classification, not forbidden/duplicate/imported/skipped, medium/high confidence, `ALLOWED` validation, fit score at least 50, at least one deterministic allowed technical signal, and an import-quality description with strong job-body signals and without excessive page chrome.
- Enriched leads that are real but still weak, noisy, `RISKY`, low-score, or missing allowed technical signals stay visible as needs-review and have import disabled.
- `/discovery` is organized as a daily review board: recommended actions, verified postings, actionable sources, processed sources, provider/run issues, old/noisy leads, and low-priority/skipped records.
- Repeated SerpApi 401/auth failures are grouped into one provider issue card with details behind an expander. Normal run history is compact and no longer repeats failed SerpApi cards.
- SerpApi support remains present, but after an auth failure in the current run the engine stops trying more SerpApi queries. The UI tells Adel to continue mainly with Tavily until SerpApi is fixed externally.
- Low-priority stale source candidates can be safely hidden by marking eligible non-posting, non-processed, low-quality candidates `SKIPPED`.
- Old noisy discovery leads can still be safely hidden without touching imported jobs, imported leads, or verified postings.
- Requirements/qualifications can be extracted separately when clear headings exist, including English and Hebrew requirement headings.
- Enrichment attempts that cannot find meaningful public static job text keep the existing lead data and show a Hebrew needs-review notice instead of inventing a description.
- Generic career listing pages can create specific job-link source candidates, not direct job leads, unless a fetched page verifies as a single posting.
- Pressing try enumerate repeatedly avoids duplicate source candidates and duplicate leads.
- Unsafe URLs, generic company pages, search result pages, ATS boards, career listings, and noisy pages are not directly importable.
- Only strict ready-to-import discovery leads can be manually imported into the normal Job Inbox.
- Imported discovery leads create normal local `Job` records and `JOB_IMPORTED_FROM_DISCOVERY` events.
- Forbidden discovery leads remain blocked from normal import.
- The run action can skip non-imported leads from a run without touching already imported leads.
- Phase 6.1G extends RTL/readability cleanup beyond `/discovery` into the global shell, Dashboard, Profile, Job Inbox, Job detail/edit/delete, Application Packet, Resume Lab, Agent Council, Pipeline, Sources, Source Detail, Gmail, and Settings.
- Shared layout and core cards use `min-w-0`, overflow containment, wrapping, and `break-words`/`break-all` where needed so long URLs, pasted job descriptions, source text, and notes do not force horizontal scroll with the sidebar open.
- Phase 6.1G QA polish fixed the `/sources` React dev warning caused by explicitly setting `encType` on a Server Action form; React now manages the upload form encoding.
- Dynamic job titles, company names, URLs, snippets, raw descriptions, source text, notes, provider messages, and AI draft text now use `dir="auto"` or `dir="ltr"` where useful for mixed Hebrew/English readability.

## Latest UX Review Summary

- The dark command-center direction and sidebar should stay.
- The app felt too fully English in places; Phase 6.1G makes the visible app Hebrew-first/RTL while keeping technical terms and enum/status badges readable in English.
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

Dashboard, jobs, sources, packets, pasted Gmail alerts, discovery runs, discovery candidates/leads, and AI draft runs are local SQLite data. Gmail OAuth, automatic inbox reading, authenticated scraping, browser automation, automatic applications, resume exports, notifications, and file parsing remain placeholders.

Profile, Sources, and manual evidence links are the required groundwork for useful AI/resume features. Controlled AI drafting may use only reviewed local packet/profile/source data, and generated text must stay behind Adel review and confirmation.

## Known Limitations

- `npm audit` currently reports five moderate findings in transitive dependencies. The forced audit fix was not applied.
- The `lint` script uses `next lint`, which is currently working but deprecated by Next.js.
- On this Windows/Node 24 machine, Prisma migration creation failed when `prisma/dev.db` did not exist. Creating an empty SQLite file first allowed `npx prisma migrate dev --name phase1_local_data` to apply the migration normally.
