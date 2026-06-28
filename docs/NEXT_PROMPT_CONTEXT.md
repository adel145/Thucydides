# Next Prompt Context

Thucydides is a local-first Next.js app in `C:\Users\adelm\Documents\Thucydides`. Phase 3.6 has added product alignment notes and copy cleanup after Adel's UX review. Phase 3 added campaign intelligence preparation: job search/filter/sort, better job list rows, priority/reminder fields, manual source records, Israeli job fixtures, and safer hard delete.

The product mission is to help Adel reach 10 interviews in the Israeli job market. Adel lives in Beersheba, prefers the South, wants above 10,000 NIS gross if staying in Beersheba, can temporarily accept 8,000 NIS gross, and expects to complete remaining degree requirements around September.

Phase 3.6 product alignment recorded Adel's latest UX review:

- Keep the dark command-center UI and sidebar.
- Keep the UI mainly English, but add helpful Hebrew job-market terminology and simpler explanations.
- The first-open experience should lead Adel toward jobs ready to apply.
- Dashboard should prioritize Today's Mission and Jobs Ready To Apply instead of many metric cards.
- Job Inbox should move toward cards and paste-job-description intake; the current manual form should be less dominant.
- Profile and Sources need real Adel data before serious AI, CV tailoring, or resume work.
- Sources should support CV, LinkedIn, GitHub, project, certificate, and academic intake. Upload workflows can come later, but no parsing yet.

Allowed roles include Help Desk, IT Support, Technical Support, PC Technician, NOC, QA Manual, QA Automation Junior, Junior Full-Stack, Frontend, Backend, Python, Java, junior software engineering/development, QA automation, software testing, data analyst, BI, junior data engineering, ML/AI/computer vision junior, application/product/API/technical support engineering, system administrator junior, junior DevOps, SOC Tier 1, Implementation Engineer, Technical Integration, Solutions Engineer Junior, real technical Support Engineer roles, and safe technical infrastructure/state-project roles.

Future degree logic should treat "student welcome", "final-year student", and "near graduate" as favorable signals. Hebrew wording such as "תואר חובה" or "זכאות לתואר חובה", and completed-degree requirements before September, are risk/manual-check notes, not hard forbidden blockers.

Forbidden roles include sales, regular customer service, non-technical service center, regular מוקד שירות, security-clearance-mandatory roles, and army-experience-mandatory roles.

Agent vision to preserve: Adel wants a council-based system with Career Strategy Agent, Israeli Job Market Agent, ATS Optimization Agent, CV Tailoring Agent, Hebrew Language Agent, English Language Agent, Job Fit Scoring Agent, Hidden Market / Sourcing Agent, Risk & Compliance Agent, and Final Decision Chief Agent. These agents should eventually work together or individually to find suitable jobs, evaluate fit, respect constraints, prepare CV/application material, track applications, suggest next actions, and support reaching 10 interviews. Agents must not silently apply or send emails; Adel must review and confirm, with audit trail and uncertainty labels.

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

1. Add Daily Review / Today's Mission for due follow-ups and jobs ready to apply.
2. Add Source Intelligence: source editing, source-to-profile linking, and better CV/LinkedIn/GitHub/project/certificate intake without upload parsing.
3. Move Job Inbox toward card-based review and a faster paste-job-description workflow.
4. Design AI readiness contracts and agent output schemas without API calls yet.
5. Add server-action/persistence integration tests.
6. Consider OpenAI only after source data, audit trails, and user-review flows are strong.

Before changing code in the next session, inspect the root folder and read `docs/THUCYDIDES_MASTER_CONTEXT.md`, `docs/CURRENT_STATE.md`, `docs/DECISIONS.md`, `docs/ARCHITECTURE.md`, and this file.
