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

## Product Principles

- Local-first: private career data, imported job data, generated notes, and future agent outputs should be stored locally by default.
- Truthful UI: features that are not connected yet must be labeled as placeholders.
- Human review: automated recommendations should support Adel, not silently apply to jobs or send communication.
- Specification driven: every phase should update docs before and after implementation.
- Conservative engineering: build small, testable foundations before API calls, scraping, database work, or automation.

## Planned Stack

- Next.js with App Router
- TypeScript
- Tailwind CSS
- Reusable React components
- Future local SQLite database, likely through Prisma or another typed local persistence layer
- Future OpenAI API integration for analysis and drafting
- Future Gmail and Calendar integrations only after explicit design, OAuth, and safety planning

## Phase 0 Status

Phase 0 creates the foundation only. It includes documentation, a Next.js skeleton, placeholder module pages, navigation, and a Stitch-inspired UI foundation. It does not implement the full product.

No OpenAI calls, Gmail OAuth, Google Calendar, scraping, database, resume export, PDF/DOCX generation, authentication, or deployment were implemented in Phase 0.
