# Next Prompt Context

Thucydides is a local-first Next.js app in `C:\Users\adelm\Documents\Thucydides`. The repo and docs are the official project memory.

As of Phase 6.1, the app supports local SQLite profile/jobs/sources/pipeline data, deterministic validation, job filters, priority/reminder fields, audit events, manual evidence links, application packets, controlled Application Packet AI drafting, local/manual Gmail job-alert paste intake, and env-gated internet job discovery.

## Product Mission

The mission is to help Adel reach 10 interviews in the Israeli job market. Adel lives in Beersheba, prefers the South, is open to strong roles across Israel, can consider remote roles if he can work from Israel, and expects to complete remaining degree requirements around September.

Target roles include Help Desk, IT Support, Technical Support, PC Technician, NOC, QA Manual, QA Automation Junior, backend/full-stack/Python/software engineer roles, junior software engineering/development, data/BI, junior data engineering, AI/ML/computer vision junior, AI/ML research student roles, application/product/API support engineering, system administrator junior, junior DevOps, SOC Tier 1, Implementation Engineer, Technical Integration, Solutions Engineer Junior, and safe technical infrastructure/state-project roles.

Hard forbidden roles remain sales, regular customer service, non-technical service center, regular מוקד שירות, mandatory security clearance, and mandatory army experience. Degree-completion requirements before September are risk/manual-check notes, not hard forbidden blockers.

## Current Behavior

- Dashboard first view is Today's Mission and now links to `/discovery` with "Find suitable jobs".
- Discovery priority is company career pages first, job platforms second, Gmail alerts third.
- `/discovery` shows Tavily/SerpApi/Gmail provider status, discovery run form, run history, counts, and lead review board.
- `JobDiscoveryRun` stores discovery run status, provider/query metadata, counts, and errors.
- `JobDiscoveryLead` stores both Gmail/manual leads and internet discovery leads, including source/evidence fields, extracted content, confidence, fit score, and reasons.
- Safe non-forbidden discovery leads can be manually imported into normal local `Job` records.
- Imported discovery leads create `JOB_IMPORTED_FROM_DISCOVERY` events.
- Forbidden discovery leads stay blocked from normal import.
- `/gmail` remains manual pasted job-alert fallback/intake and links back to `/discovery`.
- Job Inbox uses local job cards, filters, sorting, lifecycle actions, and manual pasted-job intake.
- Sources supports manual file upload records, URL-only source records, pasted text/notes, and manual source-to-profile evidence links.
- Application Packet stores one manual job-specific workspace per job.
- READY status is safety-gated: forbidden, archived, rejected, closed, or critically incomplete packets stay DRAFT.
- Controlled OpenAI drafting exists only inside Application Packet when `OPENAI_API_KEY` and `OPENAI_MODEL` are configured.
- OpenAI drafting uses the Responses API with `store: false`, `tools: []`, `tool_choice: "none"`, no browsing, no Gmail, and no autonomous application behavior.
- Top-bar status separates SQLite, AI drafting configuration, and Gmail. It says "AI drafting configured" when env values exist; Gmail remains "Gmail not connected."

## Discovery Modules

- `lib/discovery/discoveryProviders.ts`: provider config/status and labels.
- `lib/discovery/discoveryQueries.ts`: target companies and default role/platform queries.
- `lib/discovery/tavilySearchClient.ts`: Tavily search client with timeout and result caps.
- `lib/discovery/serpApiJobsClient.ts`: SerpApi Google Jobs client with timeout and result caps.
- `lib/discovery/companyCareerDiscovery.ts`: Greenhouse board token detection, public board fetch, and mapping.
- `lib/discovery/jobPageFetcher.ts`: public page fetch with timeout.
- `lib/discovery/jobDescriptionExtractor.ts`: JSON-LD JobPosting extraction and visible HTML fallback.
- `lib/discovery/jobDiscoveryEngine.ts`: provider orchestration and lead preparation.
- `lib/discovery/jobDiscoveryScoring.ts`: deterministic fit scoring.
- `lib/discovery/jobDiscoveryCounts.ts`: dashboard/review counts.
- `lib/discovery/jobDiscoveryImport.ts`: safe import shaping that prefers enriched/extracted descriptions over noisy snippets.

## Env

Optional provider env:

```env
TAVILY_API_KEY=
SERPAPI_API_KEY=
JOB_DISCOVERY_MAX_RESULTS=20
JOB_DISCOVERY_COUNTRY=israel
```

OpenAI env remains only for controlled Application Packet drafting:

```env
OPENAI_API_KEY=
OPENAI_MODEL=
```

## Hard Boundaries

- No automatic applications.
- No automatic emails.
- No Gmail OAuth.
- No automatic Gmail inbox reading.
- No provider login.
- No captcha bypass.
- No scraping behind authentication.
- No applying through APIs.
- No OpenAI discovery scoring or parsing.
- No fake job descriptions.
- No DOCX/PDF export.
- No real autonomous agents.
- No auth or deployment.

## Known Limitations

- Tavily and SerpApi are optional and missing keys produce no provider results.
- Search can miss jobs, return stale jobs, or return duplicate/platform wrapper pages.
- Public career pages may block fetches or omit useful JSON-LD.
- Greenhouse support is limited to public board URLs/tokens.
- HTML fallback extraction is conservative and may produce low-confidence leads.
- Manual review remains required before any lead becomes a Job.

## Recommended Next Work

1. Manually QA `/discovery` with real Tavily and SerpApi keys and tune query/result filtering.
2. Add more public ATS adapters only after inspecting real public behavior, likely Lever and Ashby first.
3. Add a dedicated discovery lead detail page if cards become too dense.
4. Keep imports manual and forbidden leads blocked unless a future override flow is explicitly designed.
