# Current State

As of 2026-06-26, Thucydides is in Phase 3 campaign intelligence preparation state.

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
- Dashboard metrics are connected to local SQLite data.
- UI reflects the Stitch-inspired dark navy, neon aqua, glass command-center style.
- Dependencies have been installed into `node_modules/`.
- The dev server was started on `http://localhost:3000`.
- Production build and lint checks pass.
- Prisma 7 and SQLite are configured.
- Local database file exists at `prisma/dev.db`.
- Seed profile exists for Adel Mohsen.
- Ten seed jobs exist with deterministic validation statuses.
- `/profile` loads and saves the local candidate profile.
- `/jobs` lists local jobs and can create manually entered jobs.
- `/jobs` supports text search, validation/status/facet filters, sorting, visible active-filter state, and clear filters.
- Job list rows show created/updated dates, signal/flag counts, and quick links for details, edit, and archive.
- `/jobs/[id]` shows stored job metadata, raw description, validation status, flags, signals, risk notes, manual lifecycle actions, and event history.
- `/jobs/[id]` shows priority, next action, next action note, and last contacted date.
- `/jobs/[id]/edit` edits local job records and reruns deterministic validation.
- `/jobs/[id]/delete` provides a type-to-confirm hard-delete flow.
- Jobs can be manually rerun through validation, archived, hard deleted, or moved between pipeline statuses.
- `/pipeline` groups real jobs by status and can manually change status.
- `/pipeline` can set priority, next action date, next action note, and last contacted date.
- `ApplicationEvent` records are created for new job creation, job updates, validation reruns, status changes, and archives.
- `/profile` validates required fields, salary consistency, and honest degree wording; it shows save feedback and preserves submitted values on validation errors.
- `/profile` includes a source-file intake design placeholder without upload parsing.
- `/sources` manages local manual source records and pasted text intake.
- Dashboard includes due follow-ups, overdue follow-ups, and high-priority job counts.
- Vitest tests exist for role validation with Israeli fixtures, job statuses, lifecycle validation helpers, dashboard metrics, profile validation, filters, priority, and source types.
- Completed-degree requirements are risk/manual-check notes rather than hard forbidden blockers.

## What Does Not Exist Yet

- No OpenAI API calls.
- No Gmail OAuth.
- No Google Calendar.
- No scraping or browser automation.
- No real resume generation.
- No DOCX/PDF export.
- No real job scoring.
- No real agent execution.
- No authentication.
- No deployment setup.
- No real upload parsing for source files.
- No notification system for due follow-ups.

## Important Warning

Dashboard, jobs, sources, and pipeline data are now local SQLite data. Future AI, Gmail, scraping, resume features, notifications, and file parsing remain placeholders.

## Known Limitations

- `npm audit` currently reports five moderate findings in transitive dependencies. The forced audit fix was not applied.
- The `lint` script uses `next lint`, which is currently working but deprecated by Next.js.
- On this Windows/Node 24 machine, Prisma migration creation failed when `prisma/dev.db` did not exist. Creating an empty SQLite file first allowed `npx prisma migrate dev --name phase1_local_data` to apply the migration normally.
