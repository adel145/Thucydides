# Next Prompt Context

Thucydides is a local-first Next.js app in `C:\Users\adelm\Documents\Thucydides`. Phase 3 has added campaign intelligence preparation: job search/filter/sort, better job list rows, priority/reminder fields, manual source records, Israeli job fixtures, and safer hard delete.

The product mission is to help Adel reach 10 interviews in the Israeli job market. Adel lives in Beersheba, prefers the South, wants above 10,000 NIS gross if staying in Beersheba, can temporarily accept 8,000 NIS gross, and expects to complete remaining degree requirements around September.

Allowed roles include Help Desk, IT Support, Technical Support, PC Technician, NOC, QA Manual, QA Automation Junior, Junior Full-Stack, Frontend, Backend, Python, Java, junior software engineering/development, QA automation, software testing, data analyst, BI, junior data engineering, ML/AI/computer vision junior, application/product/API/technical support engineering, system administrator junior, junior DevOps, SOC Tier 1, Implementation Engineer, Technical Integration, Solutions Engineer Junior, real technical Support Engineer roles, and safe technical infrastructure/state-project roles.

Forbidden roles include sales, regular customer service, non-technical service center, regular מוקד שירות, security-clearance-mandatory roles, and army-experience-mandatory roles. Completed-degree requirements before September are risk/manual-check notes, not hard forbidden blockers.

The Stitch reference files are preserved in `stitch_mission_matrix_web_design/`. Use them only as visual reference. Do not paste generated Stitch HTML into the app.

Verification from Phase 0:

- `npm install` succeeded.
- `npm run build` succeeded.
- `npm run lint` succeeded.
- `npm run dev -- -p 3000` succeeded.
- Dashboard and dynamic job detail placeholder returned HTTP 200.

Phase 1 verification:

- `npm install` succeeded and runs `prisma generate`.
- `npx prisma migrate dev --name phase1_local_data` succeeded after an empty `prisma/dev.db` file existed.
- `npm run db:seed` succeeded.
- `npm run test` succeeded with 7 passing rule tests.
- `npm run build` succeeded.
- `npm run lint` succeeded with the known deprecation note.

Phase 2 verification:

- `npm install` succeeded and ran `prisma generate`.
- `npm run db:seed` succeeded.
- `npm run test` succeeded with 15 passing tests across 5 files.
- `npm run build` succeeded.
- `npm run lint` succeeded with the known deprecation note.
- `npm run dev -- -p 3000` succeeded.
- HTTP smoke checks returned 200 for `/`, `/profile`, `/jobs`, a real `/jobs/[id]`, `/jobs/[id]/edit`, and `/pipeline`.

Known toolchain notes:

- `npm audit` reports five moderate transitive dependency findings; do not use a forced fix without reviewing breaking changes.
- Migrate linting away from `next lint` before upgrading to Next 16.
- If migration fails with a blank schema-engine error on a missing SQLite file, create the empty file first, then rerun `npx prisma migrate dev --name phase1_local_data`.
- Phase 3 migration folder is `20260626190000_phase3_campaign_intelligence`; it must sort after the Phase 1 migration for Prisma shadow replay.

Phase 3 verification:

- `npm install` succeeded.
- `npx prisma migrate dev --name phase3_campaign_intelligence` succeeded and reported the schema in sync.
- `npm run db:seed` succeeded.
- `npm run test` succeeded with 27 passing tests across 8 files.
- `npm run build` succeeded.
- `npm run lint` succeeded with the known deprecation note.
- `npm run dev -- -p 3000` succeeded.
- HTTP smoke checks returned 200 for `/`, `/profile`, `/jobs`, `/sources`, a real `/jobs/[id]`, `/jobs/[id]/edit`, `/jobs/[id]/delete`, and `/pipeline`.

Recommended Phase 4:

1. Add daily review workflow for due/overdue follow-ups.
2. Add source editing and source-to-profile linking.
3. Add saved job views and improved filters.
4. Add server-action/persistence integration tests.
5. Design AI readiness contracts without calling OpenAI yet.
6. Consider OpenAI only after source data, audit trails, and user-review flows are strong.

Before changing code in the next session, inspect the root folder and read `docs/THUCYDIDES_MASTER_CONTEXT.md`, `docs/CURRENT_STATE.md`, `docs/DECISIONS.md`, `docs/ARCHITECTURE.md`, and this file.
