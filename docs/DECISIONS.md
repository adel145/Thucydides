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
