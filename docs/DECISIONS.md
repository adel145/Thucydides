# Decisions

## 2026-06-26: Root-Level App

Decision: create the Next.js app directly in `C:\Users\adelm\Documents\Thucydides`.

Reason: the requirement explicitly forbids a nested `thucydides` project folder.

## 2026-06-26: Preserve Stitch References In Place

Decision: keep `stitch_mission_matrix_web_design/` where it is instead of moving it.

Reason: the folder is already clean, expected by the request, and safe to preserve in place.

## 2026-06-26: Do Not Paste Stitch HTML

Decision: convert the Stitch visual identity into typed React components and Tailwind styles.

Reason: the generated HTML includes CDN scripts, huge base64 content, inline scripts, and prototype-quality WebGL/Three.js snippets.

## 2026-06-26: CSS-First Animated Background

Decision: use a lightweight CSS grid/glow background in Phase 0.

Reason: WebGL and Three.js should wait until there is a product reason, cleanup, fallback behavior, and QA.

## 2026-06-26: Placeholder Honesty

Decision: label all metrics and pages as placeholders.

Reason: Phase 0 must not imply that database, agent, Gmail, or scoring features are working.

## 2026-06-26: Prisma 7 With SQLite Adapter

Decision: use Prisma 7 with `@prisma/adapter-better-sqlite3`, `prisma.config.ts`, and generated client output in `generated/prisma`.

Reason: Prisma 7 is the current installed path and requires datasource configuration outside the schema plus a runtime adapter for SQLite.

## 2026-06-26: Local Database File Under Prisma Folder

Decision: store the local SQLite database at `prisma/dev.db`.

Reason: this matches the project requirement that the development database live inside `prisma/`.

## 2026-06-26: Deterministic Validation Before AI

Decision: implement job validation as plain keyword rules and risk notes.

Reason: Phase 1 must enforce allowed/forbidden role constraints before introducing OpenAI or agents.

## 2026-06-26: Reproducible Seed Data

Decision: seed resets the Phase 1 data tables and recreates Adel's profile plus ten representative jobs.

Reason: local development needs a predictable baseline for UI and tests.

## 2026-06-26: String Job Status Model

Decision: keep job status as the existing `Job.status` string field and centralize allowed statuses in `lib/jobs/jobStatus.ts`.

Reason: Phase 2 needs consistent status behavior without a schema migration.

## 2026-06-26: ApplicationEvent As Local Audit Trail

Decision: create `ApplicationEvent` rows for job creation, edits, validation reruns, status changes, and archives.

Reason: Thucydides should preserve a local campaign history before adding agents or external integrations.

## 2026-06-26: Buttons Instead Of Drag And Drop

Decision: implement pipeline transitions with explicit buttons.

Reason: buttons are simpler, testable, accessible, and safer for Phase 2 than drag-and-drop.

## 2026-06-26: Profile Feedback With Client Form State

Decision: use a small client profile form with server-action state for validation feedback.

Reason: Phase 2 requires validation errors and preserving submitted values without adding a broader form framework.

## 2026-06-26: Server-Side Job Filters

Decision: implement job search, filters, and sorting through query params on `/jobs`.

Reason: server-side query params keep the local tracker reliable, shareable, and simple without heavy client state.

## 2026-06-26: Additive Reminder Fields On Job

Decision: add `priority`, `nextActionAt`, `nextActionNote`, and `lastContactedAt` to `Job`.

Reason: Phase 3 needs campaign discipline and follow-up reminders without adding notifications or a new table.

## 2026-06-26: Manual Source Records Before Parsing

Decision: extend `SourceFile` for path, URL, pasted text, notes, and updated timestamp, and expose `/sources`.

Reason: Adel needs a local source inventory before any future parsing, upload, or AI processing.

## 2026-06-26: Type-To-Confirm Delete

Decision: replace direct hard delete from job detail with a dedicated `/jobs/[id]/delete` confirmation page.

Reason: archive should remain preferred, and hard delete should be hard to trigger accidentally.

## 2026-06-26: Completed Degree Requirements Are Risk Notes

Decision: remove completed-degree requirements from hard forbidden role rules and keep them as deterministic risk/manual-check notes.

Reason: Adel is close to completing remaining degree requirements, so roles requiring a completed degree before September may still be worth manual review unless another hard blocker exists.

## 2026-06-28: English UI With Hebrew Job-Market Terms

Decision: keep the UI primarily English, but use Hebrew Israeli job-market terminology where it reduces confusion, and keep explanatory text short and simple.

Reason: Adel likes the current visual direction but feels lost when the product is too fully English or too technically worded.

## 2026-06-28: Job Inbox Moves Toward Paste And Cards

Decision: evolve Job Inbox toward a paste-job-description workflow and card-based review, while keeping current manual local intake functional.

Reason: pasted job descriptions are the natural next intake path, and job cards should make ready-to-apply work easier to scan.

## 2026-06-28: Dashboard Priority Is Daily Mission

Decision: future dashboard work should prioritize Today's Mission and Jobs Ready To Apply over many small metric cards.

Reason: the dashboard is visually close, but the first-open view should guide Adel toward the next useful application action.

## 2026-06-28: Final Agent System Is Council-Based

Decision: the final agent system should support specialist agents that can work together as a council or individually, with a Final Decision Chief summarizing recommendations.

Reason: Adel wants a coordinated assistant system that can find jobs, evaluate fit, prepare material, track applications, and support reaching 10 interviews while keeping human confirmation.

## 2026-06-28: Phase 4.0 Uses Deterministic Readiness

Decision: implement Jobs Ready To Apply as deterministic readiness, not a fit score.

Reason: Phase 4.0 should make the first-open workflow useful with existing local data while avoiding fake AI or unsupported scoring.

## 2026-06-28: Source Editing Without Parsing

Decision: add manual source detail/edit and readiness indicators using existing `SourceFile` fields only.

Reason: Adel needs reliable source inventory before serious AI/CV work, but upload parsing and automatic profile linking remain later-phase work.

## 2026-06-28: Manual Evidence Links Before AI

Decision: add `ProfileSourceLink` as an additive table that manually links a source to a profile field.

Reason: future AI and CV work needs auditable evidence, but Phase 4.1 must not parse files or automatically update profile fields.

## 2026-06-28: Agent Contracts Only

Decision: define local TypeScript contracts for future agent outputs without running agents or calling models.

Reason: future agents must carry evidence references, uncertainty, safety status, and human-review state before any real AI integration is considered.

## 2026-06-28: Application Packet As Manual Workspace

Decision: add one `ApplicationPacket` per job as the manual job-specific application preparation workspace.

Reason: Adel needs a practical place to prepare CV notes, messages, follow-up plans, and missing-item checks before AI or exports exist.

## 2026-06-28: Resume Lab Manual Before Generation

Decision: make Resume Lab show profile/source/evidence readiness, base CV data, and application packets without generating documents.

Reason: Phase 5.0 should support real application preparation while avoiding fake AI output, DOCX/PDF export, or automatic communication.

## 2026-06-28: Controlled AI Drafting Behind Packet Safety Gate

Decision: allow OpenAI only for review-only Application Packet drafting, gated by `OPENAI_API_KEY`, `OPENAI_MODEL`, deterministic job safety, local audit storage, and explicit user copy into packet fields.

Reason: Adel can benefit from draft support after packet/profile/source groundwork exists, but the product must not fake output, silently apply, send emails, browse, scrape, or behave like an autonomous agent.
