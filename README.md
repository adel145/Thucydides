# Thucydides

Thucydides is Adel's local-first strategic job-search command center for reaching 10 interviews in the Israeli job market.

It is built as a disciplined, specification-driven project rather than a one-shot vibe-coding app.

## Current Phase

Current state: Phase 6.1 - Internet Job Discovery Engine + Company Career Pages First.

## What Works Now

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma 7
- SQLite local database
- Local candidate profile
- Manual job intake
- Manual Gmail job-alert paste intake
- API-powered internet job discovery foundation
- Company career pages first, job platforms second, Gmail alerts third
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
- Manual local source-file upload intake without parsing
- URL-only source intake for LinkedIn, GitHub, portfolio, certificate/course, and other career links
- Manual source detail/edit workflow
- Source readiness indicators
- Manual source-to-profile evidence links
- Bulk manual evidence linking from one source to multiple profile fields
- Resume Lab guidance separating profile text from evidence links
- Profile real-data completion prompts and examples
- Local agent output contracts without API calls
- Job-specific Application Packet workspace
- Application Packet safety gate for READY status
- Controlled OpenAI drafting for Application Packets when `OPENAI_API_KEY` and `OPENAI_MODEL` are configured
- Separate local status badges for SQLite, AI drafting, and Gmail connection state
- Local job-alert lead extraction, review, duplicate detection, and manual import into Job Inbox
- Env-gated Tavily and SerpApi discovery providers
- Greenhouse public job board detection/mapping
- Deterministic discovery fit scoring for review leads
- Manual evidence review on Application Packets and Resume Lab
- Manual Resume Lab MVP
- Vitest coverage for rules, filters, dashboard metrics, priorities, source types, Israeli job fixtures, and Gmail alert intake helpers

## Mission

The main goal is to help Adel reach 10 interviews.

Target role families include Help Desk, IT Support, Technical Support, PC Technician, NOC, QA Manual, QA Automation Junior, Junior Software Engineer/Developer roles, QA Automation, Data Analyst, BI, Junior Data Engineer, ML/AI junior roles, AI/ML research student roles, Deep Learning, Machine Learning, Computer Vision, Data Science student roles, Application/Product/API Support Engineer, Junior DevOps, SOC Tier 1, Implementation Engineer, Technical Integration, and safe technical infrastructure roles.

Forbidden roles include Sales, regular customer service, non-technical service center, regular מוקד שירות, security-clearance-mandatory roles, and army-experience-mandatory roles. Completed-degree requirements before September are risk/manual-check notes, not hard forbidden blockers.

## Not Implemented Yet

The following are intentionally not implemented yet:

- Gmail OAuth and automatic inbox reading
- Applying through provider APIs
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
- Autonomous applications or automatic emails

## Product Direction

The desired product is an agent-assisted job-search command center that helps Adel find suitable Israeli jobs, evaluate fit, prepare CV/application material, track applications, and reach 10 interviews.

Future safe workflow: Find jobs -> Review jobs -> Select jobs -> Generate packets -> Review -> Export -> Manual apply. Automated application sending is not part of the plan.

Discovery sources prioritize company career pages first, then job platforms, then Gmail job-alert intake as fallback. Phase 6.1 adds env-gated Tavily and SerpApi foundations plus Greenhouse public job-board support. The app does not login, bypass restrictions, read Gmail automatically, send email, or apply through APIs.

Future export goals include DOCX/PDF CV and cover-letter outputs, TXT recruiter messages/notes, local per-job folders, and RTL/LTR support. Exports are not implemented yet.

The UI should stay dark, local-first, and sidebar-based. It should remain mostly English, but use helpful Hebrew job-market terms and simple explanations. The first-open flow should increasingly focus on Today's Mission and Jobs Ready To Apply.

The final agent vision is a council of specialists, including career strategy, Israeli job market, ATS optimization, CV tailoring, Hebrew and English language, job-fit scoring, hidden-market sourcing, risk/compliance, and a Final Decision Chief. Agents must not silently apply to jobs or send emails; Adel must review and confirm.

Current limitation: Phase 6.1 uses local SQLite data, deterministic validation, manual job/source intake, internet discovery leads, manual pasted Gmail alert intake, local file upload storage, URL-only source records, manual evidence links, manual application packets, and optional controlled OpenAI drafting for packet text only. Gmail OAuth, automatic inbox reading, login-gated scraping, automatic profile updates from sources, real agents, resume generation, DOCX/PDF export, automatic applications, and automatic communication are intentionally not connected.

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
npm run verify
npm run db:studio

Optional discovery env:

TAVILY_API_KEY=""
SERPAPI_API_KEY=""
JOB_DISCOVERY_MAX_RESULTS=20
JOB_DISCOVERY_COUNTRY=israel

## Data And Privacy Notes

This project is local-first.

Do not commit:

- .env
- .env.local
- API keys
- prisma/dev.db
- real private CV files
- sensitive personal documents
- local_uploads/

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

Next planned phase: refine discovery quality after real provider results and career pages.

Planned work:

- Tune company-career and platform discovery quality conservatively
- Add more ATS adapters only after public API behavior is verified
- Refine saved job-search views if still useful
- Continue persistence/server-action tests

Later phases may include read-only Gmail OAuth after safety design, stronger Resume Lab generation, English/Hebrew CV drafts, cover letters, recruiter messages, DOCX/PDF export, and an OpenAI-backed Agent Council.
