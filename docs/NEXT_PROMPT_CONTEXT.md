# Next Prompt Context

Thucydides is a local-first Next.js app in `C:\Users\adelm\Documents\Thucydides`. Phase 5.5 has added Product Direction Lock + Real Application Quality Patch. Earlier phases added local SQLite profile/jobs/sources/pipeline data, deterministic validation, job filters, priority/reminder fields, audit events, safer hard delete, Phase 3.6 product alignment, Phase 4.0 Daily Mission + Job Review UX Foundation, Phase 4.1 Manual Source-to-Profile Linking + AI Contracts Foundation, Phase 5.0 Application Packet + Resume Lab MVP, Phase 5.1 Controlled AI Drafting + Application Packet safety gate, Phase 5.2 Controlled Drafting Refinement + Persistence Safety Tests + Evidence Workflow Refinement, Phase 5.3 UX Clarity Refresh + Manual File/Link Source Intake, and Phase 5.4 Real Profile Data Workflow + Evidence Linking UX + Comfort Theme.

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

Current Phase 5.5 behavior:

- `ApplicationPacket` stores one manual local application workspace per job.
- `/jobs/[id]/application` shows deterministic application decision, recommended CV language, checklist, missing items, evidence summary, risks, and manual draft fields.
- READY status is safety-gated: forbidden, archived, rejected, closed, or critically incomplete packets stay DRAFT.
- `AiDraftRun` stores controlled OpenAI draft runs for application packets, including prompt version, model, input summary, output, and errors.
- OpenAI drafting is disabled unless both `OPENAI_API_KEY` and `OPENAI_MODEL` are configured. The app does not guess a model.
- AI drafting uses the Responses API with `store: false`, `tools: []`, `tool_choice: "none"`, no browsing, no Gmail, and no autonomous application behavior.
- Generated drafts are review-only and must be explicitly copied into packet fields by Adel; this replaces current packet draft fields.
- AI draft validation rejects non-string array items and empty/no-useful generated output.
- Mark ready requires a saved packet; direct attempts without one redirect to `packetMissing=1`.
- Application Packet save/mark-ready behavior is covered by pure helper tests for safe upsert data, READY blocking, packet-missing handling, and checklist/missing-item snapshots.
- AI draft audit behavior is covered by helper tests for disabled config, blocked jobs, success records, error records, and explicit packet draft replacement.
- Job Inbox cards have clearer LinkedIn-style hierarchy with company fallback initials, stronger metadata rows, and a clearer Prepare application action.
- Application Packet evidence review shows linked evidence by profile field, available source records, missing source groups, and missing evidence links in a clearer workflow layout.
- Job detail and Job Inbox link to packet preparation.
- `/resumes` is a less dense manual Resume Lab workspace with profile/source/evidence readiness, actionable missing-data tasks, source group status, base CV data, and recent packet status counts.
- `/sources` supports manual local file upload intake. Files are stored under `local_uploads/sources/`, metadata is stored on `SourceFile`, files are not parsed, and files are not sent to OpenAI.
- `/sources` also supports URL-only source intake for LinkedIn, GitHub, portfolio, certificate/course, and other career links. URL sources do not require file upload and are not scraped or fetched.
- `/sources` separates upload files, profile/link sources, and pasted text/notes so Adel can choose the right manual evidence path.
- `/sources/[id]` displays uploaded-file metadata for file sources and an Open source link action for URL sources.
- `/sources/[id]` can create multiple manual evidence links from one source in one save, using checkboxes for recommended and other profile fields.
- Duplicate evidence links for the same source and target field are skipped before database writes; the unique index remains the persistence backstop.
- `/resumes` separates profile text, source records, and evidence links. Source readiness 4/4 does not mean profile data or evidence readiness is complete.
- `/profile` highlights missing real profile fields and gives examples for technical skills, GitHub projects, portfolio links, field experience, and certificates.
- Job Inbox, Application Packet, Resume Lab, Sources, and Source Detail have stronger contrast, clearer cards/actions, and short Arabic/Hebrew helper labels where useful.
- Dashboard links to Resume Lab and shows packet counts.
- Top-bar status separates local SQLite, AI drafting configuration, and Gmail. When `OPENAI_API_KEY` and `OPENAI_MODEL` are present, the UI says "AI drafting active"; Gmail remains not connected.
- Application Packet copy explains that READY means packet/checklist completeness, while NEEDS_MANUAL_REVIEW means Adel still reviews job fit before applying.
- Dashboard shows planned-only cards for automatic job discovery, Gmail job-alert intake, and CV/PDF packet export.
- Resume Lab and Application Packet mention DOCX/PDF export as planned only; current packet content is manual text.

Allowed roles include Help Desk, IT Support, Technical Support, PC Technician, NOC, QA Manual, QA Automation Junior, Junior Full-Stack, Frontend, Backend, Python, Java, junior software engineering/development, QA automation, software testing, data analyst, BI, junior data engineering, ML/AI/computer vision junior, AI/ML research student roles, Deep Learning, Machine Learning, AI Research, Research Student, Student Researcher, Computer Vision, Data Science Student, Algorithm Student, AI/ML Intern, Research Intern, application/product/API/technical support engineering, system administrator junior, junior DevOps, SOC Tier 1, Implementation Engineer, Technical Integration, Solutions Engineer Junior, real technical Support Engineer roles, and safe technical infrastructure/state-project roles.

Student/final-year/near-graduate wording should remain favorable when paired with technical roles. Hebrew wording such as "תואר חובה" or "זכאות לתואר חובה", and completed-degree requirements before September, are risk/manual-check notes, not hard forbidden blockers.

Forbidden roles include sales, regular customer service, non-technical service center, regular מוקד שירות, security-clearance-mandatory roles, and army-experience-mandatory roles.

Locked future workflow: Find jobs -> Review jobs -> Select jobs -> Generate packets -> Review -> Export -> Manual apply. Discovery should eventually prioritize company career pages first, then LinkedIn, Indeed, Drushim, AllJobs, Glassdoor/Google Jobs, and Gmail job-alert fallback/intake. Export goals are DOCX/PDF for CV/cover letter, TXT for recruiter messages/notes, local per-job folders, and RTL/LTR support. These are future goals only; no scraping, Gmail reading, exports, or automatic applications exist now.

Agent vision to preserve: Adel wants a council-based system with Career Strategy Agent, Israeli Job Market Agent, ATS Optimization Agent, CV Tailoring Agent, Hebrew Language Agent, English Language Agent, Job Fit Scoring Agent, Hidden Market / Sourcing Agent, Risk & Compliance Agent, and Final Decision Chief Agent. These agents should eventually work together or individually to find suitable jobs, evaluate fit, respect constraints, prepare CV/application material, track applications, suggest next actions, and support reaching 10 interviews. Agents must not silently apply or send emails; Adel must review and confirm, with audit trail and uncertainty labels.

The Stitch reference files are preserved in `stitch_mission_matrix_web_design/`. Use them only as visual reference. Do not paste generated Stitch HTML into the app.

Known toolchain notes:

- `npm audit` reports moderate transitive dependency findings; do not use a forced fix without reviewing breaking changes.
- Migrate linting away from `next lint` before upgrading to Next 16.
- If migration fails with a blank schema-engine error on a missing SQLite file, create the empty file first, then rerun migrations.
- Phase 3 migration folder is `20260626190000_phase3_campaign_intelligence`; it must sort after the Phase 1 migration for Prisma shadow replay.

Recommended next work:

1. Add more persistence/server-action integration tests only if a clean Next action test harness is introduced.
2. After Adel fills profile text and links evidence, review whether Resume Lab has enough real data for safer controlled draft work.
3. Improve Resume Lab and source evidence review before export/generation.
4. Keep OpenAI limited to controlled Application Packet drafting until broader confirmation/audit flows are stronger.
5. Do not parse uploaded files or URL sources automatically, and do not auto-fill profile fields from sources; parsing/scraping remains a later explicit phase.

Do not add Gmail, Calendar, scraping, browser automation, automatic upload parsing, real agents, autonomous applications, automatic emails, resume generation, exports, auth, or deployment unless a later phase explicitly asks for them.

## Conversation Handoff — 2026-06-29

We are continuing the Thucydides project.

Official source of truth:

- Repo: https://github.com/adel145/Thucydides.git
- Local path: C:\Users\adelm\Documents\Thucydides
- The repo/docs are the official project memory, not old uploaded project files.

Latest confirmed commit:

- 4f5ca6d
- Message: Phase 5.4: Real Profile Data Workflow + Evidence Linking UX + Comfort Theme.

Current confirmed product state:

- Phase 5.4 is completed, committed, pushed, tested, built, linted, and git status is clean.
- Verification after Phase 5.4:
  - 16 test files passed
  - 74 tests passed
  - npm run build passed
  - npm run lint passed with only known next lint deprecation notice
  - dev server runs on localhost:3000

What exists now:

- Local-first Next.js / TypeScript / Tailwind / Prisma / SQLite job-search command center.
- Dashboard with Today’s Mission.
- Job Inbox with job cards and filters.
- Manual job intake by pasted job descriptions.
- Deterministic job validation and role safety rules.
- Job detail, edit, archive, delete.
- Pipeline and follow-up tracking.
- Sources page with:
  - local file upload
  - URL/link source intake
  - pasted text/notes

- Source files are stored locally under local_uploads/sources and are gitignored.
- Sources are not parsed automatically.
- Source URLs are not scraped.
- No source data is sent to OpenAI.
- Source detail supports manual bulk evidence linking from one source to multiple profile fields.
- Duplicate evidence links are skipped.
- Resume Lab separates:
  - profile text
  - source records
  - evidence links

- Profile page now highlights missing real profile data and provides examples.
- Application Packet exists per job.
- Controlled AI drafting works inside Application Packet only when OPENAI_API_KEY and OPENAI_MODEL are configured.
- OpenAI drafting uses Responses API with:
  - store:false
  - tools:[]
  - tool_choice:"none"
  - review-only output

- AI draft output is not sent anywhere.
- AI drafts must be explicitly copied into packet fields by Adel.
- No automatic applications.
- No automatic emails.
- No Gmail integration yet.
- No DOCX/PDF export yet.
- No real autonomous agents yet.

Real data added by Adel:

- CV file.
- LinkedIn URL.
- GitHub URL.
- Portfolio URL.
- Certificate/course URL.
- Certificate image/file.
- Academic document.
- Profile fields were filled from Adel’s CV:
  - technical skills
  - soft skills
  - field experience
  - education
  - certificates
  - GitHub projects
  - portfolio links

- Evidence links were improved; dashboard/resume readiness showed strong progress.
- A real job was tested:
  - Deep Learning Research Student at Applied Materials.
  - Application Packet reached READY.
  - Checklist reached 11/11.
  - AI draft was generated for review.
  - Decision remained NEEDS_MANUAL_REVIEW, which is valid but needs clearer UI explanation.

Important current UX finding:

- READY + NEEDS_MANUAL_REVIEW is valid but confusing.
- READY means packet fields/checklist are complete.
- NEEDS_MANUAL_REVIEW means Adel should manually review job fit before applying.
- UI should explain this clearly.
- Current top status can still confuse AI and Gmail status; if AI works but Gmail is not connected, UI should show these separately.

Final product goal clarified by Adel:
Adel wants Thucydides to become a safe job-search operating system:

1. Open Dashboard.
2. Click a button to find suitable jobs.
3. The app searches suitable roles from:
   - company career pages first where possible
   - LinkedIn
   - Indeed
   - Drushim
   - AllJobs
   - Glassdoor / Google Jobs where useful
   - Gmail job-alert emails as fallback/intake when direct sites are hard

4. The app ranks/imports suitable jobs based on Adel’s profile, sources, evidence, location, salary, degree status, and role fit.
5. Adel reviews and selects jobs.
6. The app generates one application packet per selected job:
   - tailored CV
   - cover letter / cover note
   - recruiter message
   - follow-up plan
   - application notes

7. The app exports files locally:
   - DOCX and PDF for CV / cover letter
   - TXT for recruiter messages and notes
   - preserve RTL/LTR formatting correctly

8. Adel manually opens the job site and applies.
9. No automatic applications and no automatic emails.

Adel’s target scope:

- All Israel jobs are acceptable.
- Remote jobs outside Israel are acceptable if Adel can work from Israel.
- Role priority is flexible; all strong technical opportunities are valid:
  - Junior Software Developer
  - Full-stack
  - QA Automation
  - Technical Support Engineer
  - NOC / IT
  - AI / ML / Computer Vision
  - Data / BI
  - Implementation / Integration Engineer
  - AI/ML Research Student roles

- AI/ML Research Student roles are strong targets.
- CV language should be detected from job language automatically, default English.
- Export should support DOCX + PDF and TXT for messages.
- Use base CV template + tailored sections, not generating from nothing.
- Workflow must stay safe:
  Find jobs → Review jobs → Select jobs → Generate packets → Review → Export → Manual apply.

Current in-progress instruction:
A Phase 5.5 prompt was prepared for Codex:
Phase 5.5 — Product Direction Lock + Real Application Quality Patch

Phase 5.5 goals:

- Lock clarified final product direction in docs.
- Fix AI/Gmail status confusion.
- Improve AI/ML/Research Student role rules.
- Clarify READY + NEEDS_MANUAL_REVIEW UX.
- Add honest future placeholders for job discovery and export.
- No Gmail integration yet.
- No scraping.
- No export implementation yet.
- No automatic sending/applying.
