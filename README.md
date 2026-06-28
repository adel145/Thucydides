# Thucydides

Thucydides is Adel's local-first strategic job-search command center for reaching 10 interviews in the Israeli job market.

It is built as a disciplined, specification-driven project rather than a one-shot vibe-coding app.

## Current Phase

Current state: Phase 5.0 - Application Packet + Resume Lab MVP.

## What Works Now

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma 7
- SQLite local database
- Local candidate profile
- Manual job intake
- Today's Mission dashboard
- Jobs Ready To Apply deterministic readiness
- Card-based Job Inbox review
- Deterministic allowed/risky/forbidden job validation
- Job search, filters, and sorting
- Quick review filters
- Job detail, edit, archive, and type-to-confirm delete
- Pipeline status tracking
- Priority and follow-up tracking
- Application event history
- Manual source records and pasted text intake
- Manual source detail/edit workflow
- Source readiness indicators
- Manual source-to-profile evidence links
- Local agent output contracts without API calls
- Job-specific Application Packet workspace
- Manual Resume Lab MVP
- Vitest coverage for rules, filters, dashboard metrics, priorities, source types, and Israeli job fixtures

## Mission

The main goal is to help Adel reach 10 interviews.

Target role families include Help Desk, IT Support, Technical Support, PC Technician, NOC, QA Manual, QA Automation Junior, Junior Software Engineer/Developer roles, QA Automation, Data Analyst, BI, Junior Data Engineer, ML/AI junior roles, Application/Product/API Support Engineer, Junior DevOps, SOC Tier 1, Implementation Engineer, Technical Integration, and safe technical infrastructure roles.

Forbidden roles include Sales, regular customer service, non-technical service center, regular מוקד שירות, security-clearance-mandatory roles, and army-experience-mandatory roles. Completed-degree requirements before September are risk/manual-check notes, not hard forbidden blockers.

## Not Implemented Yet

The following are intentionally not implemented yet:

- OpenAI API calls
- Gmail OAuth
- Google Calendar
- Scraping
- Browser automation
- Resume generation
- DOCX/PDF export
- Real AI agents
- Authentication
- Deployment
- File upload parsing
- Notifications

## Product Direction

The desired product is an agent-assisted job-search command center that helps Adel find suitable Israeli jobs, evaluate fit, prepare CV/application material, track applications, and reach 10 interviews.

The UI should stay dark, local-first, and sidebar-based. It should remain mostly English, but use helpful Hebrew job-market terms and simple explanations. The first-open flow should increasingly focus on Today's Mission and Jobs Ready To Apply.

The final agent vision is a council of specialists, including career strategy, Israeli job market, ATS optimization, CV tailoring, Hebrew and English language, job-fit scoring, hidden-market sourcing, risk/compliance, and a Final Decision Chief. Agents must not silently apply to jobs or send emails; Adel must review and confirm.

Current limitation: Phase 5.0 uses local SQLite data, deterministic validation, manual job/source intake, manual evidence links, and manual application packets. AI, Gmail, upload parsing, real agents, resume generation, DOCX/PDF export, and automatic communication are intentionally not connected yet.

## Local Setup

Create a local environment file:

copy .env.example .env

Install dependencies:

npm install

Run migrations:

npx prisma migrate dev

Seed local data:

npm run db:seed

Start development server:

npm run dev

Open:

http://localhost:3000

If port 3000 is busy, Next.js may use another port such as 3001.

## Useful Commands

npm run test
npm run build
npm run lint
npm run db:studio

## Data And Privacy Notes

This project is local-first.

Do not commit:

- .env
- .env.local
- API keys
- prisma/dev.db
- real private CV files
- sensitive personal documents

The repository tracks schema, migrations, source code, tests, and documentation. Local data stays local.

## Project Memory

The docs folder contains the official project memory:

- THUCYDIDES_MASTER_CONTEXT.md
- CURRENT_STATE.md
- NEXT_PROMPT_CONTEXT.md
- ARCHITECTURE.md
- DECISIONS.md
- TASKS.md
- CODEX_LOG.md
- TEST_PLAN.md

Future work should read and update these files after each phase.

## Roadmap

Next planned phase: Phase 5.1 - Controlled AI Drafting.

Planned work:

- Controlled AI drafting from reviewed Application Packets
- Source-to-profile linking refinements
- Saved job-search views if still useful
- More persistence/server-action tests

Later phases include Resume Lab, English/Hebrew CV drafts, cover letters, recruiter messages, DOCX/PDF export, OpenAI-backed Agent Council, and Gmail integration.
