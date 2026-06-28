# Next Prompt Context

Thucydides is a local-first Next.js app in `C:\Users\adelm\Documents\Thucydides`. Phase 4.0 has added Daily Mission + Job Review UX Foundation. Earlier phases added local SQLite profile/jobs/sources/pipeline data, deterministic validation, job filters, priority/reminder fields, audit events, safer hard delete, and Phase 3.6 product alignment.

The product mission is to help Adel reach 10 interviews in the Israeli job market. Adel lives in Beersheba, prefers the South, wants above 10,000 NIS gross if staying in Beersheba, can temporarily accept 8,000 NIS gross, and expects to complete remaining degree requirements around September.

Current Phase 4.0 behavior:

- Dashboard first view is Today's Mission.
- Dashboard shows Jobs Ready To Apply, follow-ups due today, overdue follow-ups, high-priority jobs, recent jobs, and Profile/Sources readiness.
- Jobs Ready To Apply is deterministic readiness only, not a real fit score.
- Job Inbox uses card-based review.
- Job Inbox has quick filters for ready-to-apply, high-priority, due follow-up, risky review, and forbidden/archive review.
- Paste job description is the main intake path, with title and source required.
- Sources has manual source readiness and source detail/edit workflow.
- Source deletion requires typing DELETE.

Allowed roles include Help Desk, IT Support, Technical Support, PC Technician, NOC, QA Manual, QA Automation Junior, Junior Full-Stack, Frontend, Backend, Python, Java, junior software engineering/development, QA automation, software testing, data analyst, BI, junior data engineering, ML/AI/computer vision junior, application/product/API/technical support engineering, system administrator junior, junior DevOps, SOC Tier 1, Implementation Engineer, Technical Integration, Solutions Engineer Junior, real technical Support Engineer roles, and safe technical infrastructure/state-project roles.

Future degree logic should treat "student welcome", "final-year student", and "near graduate" as favorable signals. Hebrew wording such as "תואר חובה" or "זכאות לתואר חובה", and completed-degree requirements before September, are risk/manual-check notes, not hard forbidden blockers.

Forbidden roles include sales, regular customer service, non-technical service center, regular מוקד שירות, security-clearance-mandatory roles, and army-experience-mandatory roles.

Agent vision to preserve: Adel wants a council-based system with Career Strategy Agent, Israeli Job Market Agent, ATS Optimization Agent, CV Tailoring Agent, Hebrew Language Agent, English Language Agent, Job Fit Scoring Agent, Hidden Market / Sourcing Agent, Risk & Compliance Agent, and Final Decision Chief Agent. These agents should eventually work together or individually to find suitable jobs, evaluate fit, respect constraints, prepare CV/application material, track applications, suggest next actions, and support reaching 10 interviews. Agents must not silently apply or send emails; Adel must review and confirm, with audit trail and uncertainty labels.

The Stitch reference files are preserved in `stitch_mission_matrix_web_design/`. Use them only as visual reference. Do not paste generated Stitch HTML into the app.

Known toolchain notes:

- `npm audit` reports moderate transitive dependency findings; do not use a forced fix without reviewing breaking changes.
- Migrate linting away from `next lint` before upgrading to Next 16.
- If migration fails with a blank schema-engine error on a missing SQLite file, create the empty file first, then rerun migrations.
- Phase 3 migration folder is `20260626190000_phase3_campaign_intelligence`; it must sort after the Phase 1 migration for Prisma shadow replay.

Recommended next work:

1. Refine Daily Mission into an explicit daily review action flow.
2. Add manual source-to-profile linking without automatic parsing.
3. Add saved job-search views if they still feel useful after quick filters.
4. Design AI readiness contracts and agent output schemas without API calls.
5. Add persistence/server-action tests for source update/delete and reminder actions.
6. Consider OpenAI only after real Profile/Sources data, audit trails, and user-review flows are strong.

Do not add OpenAI, Gmail, Calendar, scraping, browser automation, upload parsing, real agents, resume generation, exports, auth, deployment, automatic applications, or automatic emails unless a later phase explicitly asks for them.
