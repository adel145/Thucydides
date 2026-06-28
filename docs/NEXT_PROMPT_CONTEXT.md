# Next Prompt Context

Thucydides is a local-first Next.js app in `C:\Users\adelm\Documents\Thucydides`. Phase 5.1 has added Controlled AI Drafting and a mandatory Application Packet safety gate. Earlier phases added local SQLite profile/jobs/sources/pipeline data, deterministic validation, job filters, priority/reminder fields, audit events, safer hard delete, Phase 3.6 product alignment, Phase 4.0 Daily Mission + Job Review UX Foundation, Phase 4.1 Manual Source-to-Profile Linking + AI Contracts Foundation, and Phase 5.0 Application Packet + Resume Lab MVP.

The product mission is to help Adel reach 10 interviews in the Israeli job market. Adel lives in Beersheba, prefers the South, wants above 10,000 NIS gross if staying in Beersheba, can temporarily accept 8,000 NIS gross, and expects to complete remaining degree requirements around September.

Current Phase 4.0 behavior:

- Dashboard first view is Today's Mission.
- Dashboard shows Jobs Ready To Apply, follow-ups due today, overdue follow-ups, high-priority jobs, recent jobs, and Profile/Sources readiness.
- Jobs Ready To Apply is deterministic readiness only, not a real fit score.
- Phase 4.0 QA tightened actionable views so archived, rejected, and forbidden jobs do not leak into ready/high-priority/follow-up mission surfaces.
- Job Inbox uses card-based review.
- Job Inbox has quick filters for ready-to-apply, high-priority, due follow-up, risky review, and forbidden/archive review. Forbidden/archive review shows active forbidden jobs that may still need archiving, not already archived forbidden jobs.
- Paste job description is the main intake path, with title and source required.
- Sources has manual source readiness and source detail/edit workflow.
- Source deletion requires typing DELETE.

Current Phase 4.1 behavior:

- `ProfileSourceLink` additively links `SourceFile` records to `CandidateProfile` fields.
- Source detail pages can create/delete manual evidence links.
- Profile shows linked source evidence grouped by target profile field.
- Dashboard shows profile evidence readiness count.
- `lib/profile/profileSourceLinks.ts` defines allowed target fields, source-type recommendations, grouping, and readiness summary.
- `lib/agents/agentContracts.ts` defines future agent output contracts only. No agent runs, model call, fake score, automatic application, or email exists.

Current Phase 5.1 behavior:

- `ApplicationPacket` stores one manual local application workspace per job.
- `/jobs/[id]/application` shows deterministic application decision, recommended CV language, checklist, missing items, evidence summary, risks, and manual draft fields.
- READY status is safety-gated: forbidden, archived, rejected, closed, or critically incomplete packets stay DRAFT.
- `AiDraftRun` stores controlled OpenAI draft runs for application packets, including prompt version, model, input summary, output, and errors.
- OpenAI drafting is disabled unless both `OPENAI_API_KEY` and `OPENAI_MODEL` are configured. The app does not guess a model.
- AI drafting uses the Responses API with `store: false`, `tools: []`, `tool_choice: "none"`, no browsing, no Gmail, and no autonomous application behavior.
- Generated drafts are review-only and must be explicitly copied into packet fields by Adel; this replaces current packet draft fields.
- AI draft validation rejects non-string array items and empty/no-useful generated output.
- Mark ready requires a saved packet; direct attempts without one redirect to `packetMissing=1`.
- Job detail and Job Inbox link to packet preparation.
- `/resumes` is a manual Resume Lab MVP with profile/source/evidence readiness, base CV data, missing inputs, and recent packets.
- Dashboard links to Resume Lab and shows packet counts.

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

1. Phase 5.2 refine controlled drafting and evidence workflows.
2. Add stronger persistence/server-action tests around packet save, READY gating, and AI draft runs.
3. Improve Resume Lab and source evidence review before export/generation.
4. Refine source-to-profile evidence workflows after Adel adds real sources.
5. Keep OpenAI limited to controlled Application Packet drafting until broader confirmation/audit flows are stronger.

Do not add Gmail, Calendar, scraping, browser automation, upload parsing, real agents, autonomous applications, automatic emails, resume generation, exports, auth, or deployment unless a later phase explicitly asks for them.
