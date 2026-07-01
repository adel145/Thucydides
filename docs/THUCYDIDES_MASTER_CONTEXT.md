# Thucydides Master Context

Thucydides is a local-first strategic job-search command center for Adel. Its mission is to help Adel reach 10 interviews in the Israeli job market through disciplined profile management, job intake, role filtering, fit analysis, resume preparation, application tracking, and follow-up support.

## Adel's Goal

- Primary success metric: 10 interviews.
- Location: Beersheba.
- Preference: stay in Beersheba if income can exceed 10,000 NIS gross.
- Temporary acceptable salary: 8,000 NIS gross.
- Geography priority: South of Israel first; open to anywhere in Israel if the opportunity is strong.
- Degree status: remaining degree requirements are expected to be completed around September.
- Materials available: English CV, LinkedIn profile text, GitHub projects, portfolio link, certificates/courses, and academic documents.
- CV language strategy: use English or Hebrew depending on the job language.

## Allowed Role Families

Thucydides should prioritize technical early-career and adjacent technical roles:

- Help Desk
- IT Support
- Technical Support
- PC Technician
- NOC
- QA Manual
- QA Automation Junior
- Junior Full-Stack
- Junior Frontend
- Junior Backend
- Junior Software Engineer
- Junior Software Developer
- Software Developer Junior
- Full Stack Developer Junior
- Frontend Developer Junior
- Backend Developer Junior
- React Developer Junior
- Node.js Developer Junior
- Junior Python Developer
- Java Developer Junior
- Data / ML Junior
- Data Analyst Junior
- BI Developer Junior
- Junior Data Engineer
- Machine Learning Junior
- AI Junior
- Computer Vision Junior
- Implementation Engineer
- Technical Integration
- Application Support Engineer
- Technical Support Engineer
- Product Support Engineer
- API Support Engineer
- Technical Customer Engineer
- System Administrator Junior
- Junior DevOps
- SOC Tier 1
- NOC Engineer
- Solutions Engineer Junior
- Technical Integration Engineer
- Real technical Support Engineer roles
- Field, infrastructure, railway, or state-project technical roles when relevant and safe

## Forbidden Roles

Thucydides must filter out:

- Sales
- Regular customer service
- Non-technical service center roles
- Regular מוקד שירות roles
- Security clearance mandatory roles
- Army experience mandatory roles

## Risk / Manual-Check Conditions

These conditions should not automatically reject a job, but they must be flagged for review:

- Roles requiring a completed degree before September or before start
- Hebrew degree wording such as תואר חובה or זכאות לתואר חובה
- Salary below Adel's temporary minimum
- Locations outside the South/Beersheba preference

Future degree logic should treat "student welcome", "final-year student", and "near graduate" as favorable signals.

## Product Principles

- Local-first: private career data, imported job data, generated notes, and future agent outputs should be stored locally by default.
- Truthful UI: features that are not connected yet must be labeled as planned or placeholders.
- Human review: automated recommendations should support Adel, not silently apply to jobs or send communication.
- Specification driven: every phase should update docs before and after implementation.
- Conservative engineering: build small, testable foundations before API calls, scraping, database work, or automation.
- UX language: make the visible workflow Hebrew-first and RTL for Adel, while keeping technical terms, provider names, env vars, URLs, and enum/status badges in English where useful.
- First-open focus: guide Adel toward Today's Mission and Jobs Ready To Apply before secondary metrics.
- Source readiness: real Profile and Sources data must exist before serious AI, resume, or agent work.

## Product Direction

- Keep the dark command-center UI and sidebar.
- Job Inbox should move toward job cards and paste-job-description intake.
- Sources should support CV, LinkedIn, GitHub, project, certificate, and academic intake before upload parsing.
- Resume Lab, Agent Council, Gmail, and Settings should remain visible as planned roadmap pages with honest copy.
- The final agent system should be a specialist council with a Final Decision Chief, human confirmation, audit trail, and uncertainty labels.
- Future safe workflow: Find jobs -> Review jobs -> Select jobs -> Generate packets -> Review -> Export -> Manual apply.
- Discovery sources: company career pages first, then LinkedIn, Indeed, Drushim, AllJobs, Glassdoor/Google Jobs, and Gmail job alerts as fallback/intake.
- Future export goals: DOCX/PDF for CV and cover letters, TXT for recruiter messages/notes, local per-job folders, and RTL/LTR support.

## Planned Stack

- Next.js with App Router
- TypeScript
- Tailwind CSS
- Reusable React components
- Local SQLite database through Prisma
- Future OpenAI API integration for analysis and drafting
- Future Gmail and Calendar integrations only after explicit design, OAuth, and safety planning

## Phase 6.4B Status

Phase 6.4B has a mandatory Application Packet safety gate, controlled OpenAI drafting for packet text only, manual source/profile evidence workflows, local/manual Gmail job-alert paste intake, env-gated internet discovery with provider diagnostics, Hebrew RTL global UI foundation, Markdown/plain URL extraction, Workday/plain-URL title cleanup, explicit verified-posting states, deterministic source-candidate quality ranking, display-only candidate deduping, processed-source separation, stronger real public job-page enrichment, strict enrichment import-readiness, Discovery cleanup/run-history hygiene, and persisted provider status freshness. The app currently has local SQLite data for profile, jobs, sources, source evidence links, pasted Gmail alerts, discovery runs, discovery source candidates, verified discovery leads, application packets, AI draft runs, pipeline, deterministic validation, and audit events.

OpenAI is available only from the Application Packet page when `OPENAI_API_KEY` and `OPENAI_MODEL` are configured. It uses review-only drafting, stores local draft-run audit records, and never applies to jobs or sends email. Discovery uses company career pages first, job platforms second, and Gmail alerts third. Tavily/search results become `DiscoverySourceCandidate` records first; only verified single job postings, exact ATS job postings, or structured Google Jobs results become `JobDiscoveryLead` records, and only strict ready-to-import leads can enter Job Inbox. Ready-to-import requires verified single-job classification, active non-duplicate/non-imported state, medium/high confidence, `ALLOWED` validation, fit score at least 50, at least one deterministic allowed technical signal, and an import-quality description with strong job-body signals and without excessive page chrome. Provider badges distinguish key present, verified, auth failed, disabled for run, and missing-key states. SerpApi has been fixed externally with a real SerpApi.com key; Serper was not added. Provider test status is persisted locally in an HTTP-only cookie, so successful SerpApi diagnostics move old SerpApi 401 failures to stale collapsed history even after navigation, Tavily tests, or refresh, until a newer SerpApi test fails authorization. Candidate enumeration extracts HTML, Markdown, and plain public job URLs from fetched content and saved candidate text, dedupes repeat enumeration, and keeps links as candidates until verified. Markdown titles are preserved; Workday/plain career URLs prefer readable nearby text and fall back to neutral untitled labels instead of raw ids where possible. Source candidates are ranked deterministically by classification, source/provider, target role wording, Israel/remote signals, confidence, errors, and processed counts; this is not AI scoring and does not change import eligibility. Career-link extraction filters clear non-target Workday/career locations before candidate creation while keeping Israel/remote and strong unknown-location technical roles for manual review. Greenhouse exact job URLs map only one job, and boards are filtered for Israel/remote target roles. Job-page enrichment now uses real public content only: JSON-LD JobPosting first, safe static Greenhouse/Workday/Lever-style extraction second, and cleaned visible HTML fallback last. Requirements are extracted only from clear sections. Weak, noisy, page-chrome-heavy, low-score, `RISKY`, no-signal, JS-only, or blocked pages stay needs-review and no description is invented. Workday support is safe/public and limited: search/listing pages are ATS board candidates, visible exact job links become candidates, exact public job pages can become leads only with a visible title and meaningful description, and JS-only/blocked pages stay candidates with errors. Gmail OAuth, automatic Gmail reading, Google Calendar, authenticated scraping, browser automation, resume export, PDF/DOCX generation, real agents, upload parsing, authentication, deployment, automatic applications, and automatic emails are not implemented.

AI/ML research student roles are target role signals, including Deep Learning, Machine Learning, AI Research, Research Student, Student Researcher, Computer Vision, Data Science Student, Algorithm Student, AI/ML Intern, and Research Intern. Sales, regular customer service, non-technical service center, mandatory security clearance, and mandatory army experience remain hard forbidden blockers.

Discovery source candidates are not jobs. Broad Glassdoor/listing/search pages remain non-importable. `/discovery` guides Adel in Hebrew RTL through provider testing, enumeration, verified posting review, safe manual import, and cleanup. Phase 6.4B keeps the Hebrew-first RTL foundation and daily review board: recommended actions, verified postings, actionable sources, processed sources, provider/run issues, old/noisy leads, and low-priority/skipped records are visually separated. Current sources with real next actions appear first, generic Workday boards without Israel/remote evidence are demoted, repeated source candidates collapse by canonical display key, already-processed sources are collapsed by default, and low-quality/skipped/unsupported records stay lower and collapsed. Verified postings can be ready, needs review, duplicate, imported, or blocked; duplicate, low-confidence, RISKY, low-score, no-allowed-signal, and page-chrome-heavy verified postings stay in the verified section instead of legacy/noisy, and ready postings sort first while blocked postings sort last. Cards and core pages clip or wrap noisy provider text, URLs, pasted descriptions, source text, and notes so long content does not create horizontal overflow. Old noisy leads and low-priority stale source candidates can be hidden by marking eligible records `SKIPPED`, without deletion or touching imported jobs, imported leads, exact postings, or verified postings. Failed SerpApi run compaction is display-only for auditability, and old SerpApi auth failures remain stale history after persisted SerpApi success across navigation and refresh. A verified posting can still be blocked by role rules. A `JobDiscoveryLead` becomes a normal `Job` only after Adel explicitly imports it, and forbidden or non-importable leads are blocked from normal import.
