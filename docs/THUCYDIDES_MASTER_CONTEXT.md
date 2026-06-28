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
- UX language: keep the UI mostly English, but use Hebrew Israeli job-market terms where they reduce confusion.
- First-open focus: guide Adel toward Today's Mission and Jobs Ready To Apply before secondary metrics.
- Source readiness: real Profile and Sources data must exist before serious AI, resume, or agent work.

## Product Direction

- Keep the dark command-center UI and sidebar.
- Job Inbox should move toward job cards and paste-job-description intake.
- Sources should support CV, LinkedIn, GitHub, project, certificate, and academic intake before upload parsing.
- Resume Lab, Agent Council, Gmail, and Settings should remain visible as planned roadmap pages with honest copy.
- The final agent system should be a specialist council with a Final Decision Chief, human confirmation, audit trail, and uncertainty labels.

## Planned Stack

- Next.js with App Router
- TypeScript
- Tailwind CSS
- Reusable React components
- Local SQLite database through Prisma
- Future OpenAI API integration for analysis and drafting
- Future Gmail and Calendar integrations only after explicit design, OAuth, and safety planning

## Phase 4.0 Status

Phase 4.0 adds a Daily Mission dashboard, deterministic Jobs Ready To Apply readiness, card-based Job Inbox review, quick review filters, paste-first job intake copy, source readiness indicators, and manual source detail/edit workflow. The app currently has local SQLite data for profile, jobs, sources, pipeline, deterministic validation, and audit events.

No OpenAI calls, Gmail OAuth, Google Calendar, scraping, resume export, PDF/DOCX generation, real agents, upload parsing, authentication, or deployment are implemented yet.
