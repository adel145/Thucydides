# Roadmap

## Phase 0: Foundation

- Inspect Stitch files.
- Preserve reference files.
- Create project memory documentation.
- Create root-level Next.js, TypeScript, Tailwind skeleton.
- Add placeholder pages.
- Add shared UI foundation.
- Document decisions and next steps.

## Phase 1: Data Model And Profile Source Of Truth

- Define local database schema.
- Add profile intake and editing.
- Store Adel's constraints and source materials locally.
- Add seed data/import format.
- Add tests for role filters and profile validation.

## Phase 2: Job Intake And Filtering

- Add manual job entry/import.
- Implement forbidden-role detection.
- Add location, salary, language, degree, and requirement parsing.
- Track job source and audit notes.
- Add job edit/archive/delete.
- Add pipeline status transitions and event history.
- Add real dashboard metrics.
- Improve profile validation and feedback.

## Phase 3: Campaign Intelligence Preparation

- Add stronger local job search/filter/sort and campaign operations.
- Add richer pipeline notes and follow-up reminders.
- Add local source-file records and manual text intake.
- Expand deterministic rules with real job examples.
- Add integration tests before any AI-backed analysis.

## Phase 4: Daily Review And Source Intelligence

- Add daily review workflow for due and overdue follow-ups.
- Add source editing and linking source records to profile fields.
- Add saved filters/views for repeated job-search sessions.
- Add deeper persistence tests around server actions.
- Prepare AI contracts without making OpenAI calls.

## Phase 5: Resume Lab

- Generate targeted English/Hebrew resume drafts after source data is reliable.
- Add DOCX/PDF export only after templates and checks are stable.
- Preserve the safe workflow: Find jobs -> Review jobs -> Select jobs -> Generate packets -> Review -> Export -> Manual apply.
- Plan discovery around company career pages first, then LinkedIn, Indeed, Drushim, AllJobs, Glassdoor/Google Jobs, and Gmail job-alert intake after safety design.
- Plan exports as DOCX/PDF for CV and cover letters, TXT recruiter messages/notes, local per-job folders, and RTL/LTR support.

## Phase 6: Manual Discovery Intake

- Start with local/manual Gmail job-alert paste intake.
- Extract conservative `JobDiscoveryLead` records for review before import.
- Import safe non-forbidden leads into the normal Job Inbox only after Adel action.
- Keep Gmail OAuth, inbox reading, scraping, browser automation, and automatic applications out until explicitly designed.
- Consider read-only Gmail OAuth in a later phase after privacy, safety, and audit rules are written.
- Add env-gated internet discovery with company career pages first, platforms second, Gmail alerts third.
- Use public ATS APIs such as Greenhouse when detected.
- Keep Tavily and SerpApi optional and review-only.
- Treat search/career results as source candidates first; only verified single job postings should become importable leads.
- Add provider diagnostics and safe public candidate enumeration before broadening ATS support.
- Keep Workday support limited to public visible content; JS-only pages should not trigger browser automation.
- Add Lever/Ashby adapters only after public, non-authenticated behavior is understood.
