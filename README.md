# Thucydides

Thucydides is Adel's local-first strategic job-search command center for reaching 10 interviews in the Israeli job market.

It is built as a disciplined, specification-driven project rather than a one-shot vibe-coding app.

## Current Phase

Current state: Phase 6.2 - Real Discovery Quality + Candidate Ranking.

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
- Source-candidate funnel: search/listing/generic pages are stored separately before any job lead is created
- Source candidate actions for retry classify, safe enumeration, and skip
- Provider diagnostics for Tavily and SerpApi, including clear SerpApi 401 guidance
- Safe public Workday adapter foundation and generic career-link extraction
- Markdown and plain URL extraction from candidate text for public career/job links
- Discovery action guide and top cleanup action for old noisy leads
- Discovery sections for verified job postings, sources to process, legacy/noisy leads, and skipped/unsupported records
- Discovery candidate quality scoring and ranking for stronger source review
- Separate processed-source section so already-enumerated sources do not crowd current next actions
- Display-only candidate grouping so repeated Workday/career sources collapse into one review card
- Workday/career-link noise reduction for clear non-target locations while keeping Israel/remote and strong unknown-location technical roles reviewable
- Hebrew RTL `/discovery` page with action-oriented labels for source candidates and verified job states
- Global Hebrew-first RTL app shell and core workflow pages, with technical terms and enum/status badges kept in English where useful
- Responsive overflow guards across the shared shell and core pages so long URLs, pasted text, raw descriptions, and provider snippets stay inside cards
- Responsive `/discovery` cards that wrap long URLs, Markdown snippets, provider text, and descriptions without horizontal overflow
- Expandable source/job text previews so noisy raw provider text does not dominate cards
- Verified job postings can show Ready to import, Blocked, Duplicate, Imported, or Needs review without falling into legacy/noisy
- Hide action for old non-importable leads without deleting data or touching imported jobs
- Workday/plain-URL candidate title cleanup so raw ids are avoided when readable surrounding text exists
- Workday search/listing URLs stay source candidates; only exact public Workday job URLs can become ATS job postings after verification
- Import quality gate for verified single job postings only
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

Discovery sources prioritize company career pages first, then job platforms, then Gmail job-alert intake as fallback. Phase 6.2 keeps the Hebrew RTL workflow and adds deterministic source quality ranking. The 6.2A QA polish demotes generic Workday search/listing boards without Israel/remote evidence and collapses repeated source candidates in display only. Tavily/search results remain `DiscoverySourceCandidate` records first; only verified single job postings or structured Google Jobs results become `JobDiscoveryLead` records that can be manually imported. Source review now prioritizes Israel/remote technical sources, separates already-processed sources, and pushes clear non-target/noisy sources out of the primary action list. Verified postings can still be blocked, duplicated, imported, or need review before import. Source candidates are not jobs yet. The cleanup action only marks old non-importable leads as `SKIPPED`; it does not delete data or touch imported jobs. The app does not login, bypass restrictions, read Gmail automatically, send email, or apply through APIs.

Future export goals include DOCX/PDF CV and cover-letter outputs, TXT recruiter messages/notes, local per-job folders, and RTL/LTR support. Exports are not implemented yet.

The UI should stay dark, local-first, and sidebar-based. The visible product UI is now Hebrew-first and RTL for Adel's day-to-day workflow, while technical terms such as Thucydides, SQLite, OpenAI, AI, Gmail, Tavily, SerpApi, Workday, Greenhouse, Job Inbox, DOCX/PDF/TXT, URLs, env vars, and enum/status badges can remain English. The first-open flow should increasingly focus on Today's Mission and Jobs Ready To Apply.

The final agent vision is a council of specialists, including career strategy, Israeli job market, ATS optimization, CV tailoring, Hebrew and English language, job-fit scoring, hidden-market sourcing, risk/compliance, and a Final Decision Chief. Agents must not silently apply to jobs or send emails; Adel must review and confirm.

Current limitation: Phase 6.2 uses local SQLite data, deterministic validation, manual job/source intake, discovery source candidates and verified job postings, manual pasted Gmail alert intake, local file upload storage, URL-only source records, manual evidence links, manual application packets, and optional controlled OpenAI drafting for packet text only. A provider key being present does not mean the provider is verified. Workday support is safe/public and limited; JS-only or blocked pages remain candidates with errors, search/listing URLs are not treated as exact postings, and obvious non-target job links are filtered conservatively from extracted candidates. SerpApi 401 means `SERPAPI_API_KEY` or account access must be fixed outside the app. Gmail OAuth, automatic inbox reading, login-gated scraping, browser automation, automatic profile updates from sources, real agents, resume generation, DOCX/PDF export, automatic applications, and automatic communication are intentionally not connected.

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

Next planned phase: manually QA real discovery runs with Tavily/SerpApi/career-page results after the Phase 6.2 ranking cleanup, then consider more ATS adapters only after public behavior is verified.

Planned work:

- Tune company-career and platform discovery quality conservatively
- Add more ATS adapters only after public API behavior is verified
- Refine saved job-search views if still useful
- Continue persistence/server-action tests

Later phases may include read-only Gmail OAuth after safety design, stronger Resume Lab generation, English/Hebrew CV drafts, cover letters, recruiter messages, DOCX/PDF export, and an OpenAI-backed Agent Council.
