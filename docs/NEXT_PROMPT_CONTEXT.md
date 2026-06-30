# Next Prompt Context

Thucydides is a local-first Next.js app in `C:\Users\adelm\Documents\Thucydides`. The repo and docs are the official project memory.

As of Phase 6.1F, the app supports local SQLite profile/jobs/sources/pipeline data, deterministic validation, job filters, priority/reminder fields, audit events, manual evidence links, application packets, controlled Application Packet AI drafting, local/manual Gmail job-alert paste intake, and env-gated internet job discovery with provider diagnostics, Hebrew RTL discovery review, Markdown/plain URL extraction, Workday/plain-URL title cleanup, explicit verified-posting states, and a source-candidate quality gate.

## Product Mission

The mission is to help Adel reach 10 interviews in the Israeli job market. Adel lives in Beersheba, prefers the South, is open to strong roles across Israel, can consider remote roles if he can work from Israel, and expects to complete remaining degree requirements around September.

Target roles include Help Desk, IT Support, Technical Support, PC Technician, NOC, QA Manual, QA Automation Junior, backend/full-stack/Python/software engineer roles, junior software engineering/development, data/BI, junior data engineering, AI/ML/computer vision junior, AI/ML research student roles, application/product/API support engineering, system administrator junior, junior DevOps, SOC Tier 1, Implementation Engineer, Technical Integration, Solutions Engineer Junior, and safe technical infrastructure/state-project roles.

Hard forbidden roles remain sales, regular customer service, non-technical service center, regular מוקד שירות, mandatory security clearance, and mandatory army experience. Degree-completion requirements before September are risk/manual-check notes, not hard forbidden blockers.

## Current Behavior

- Dashboard first view is Today's Mission and now links to `/discovery` with "Find suitable jobs".
- Discovery priority is company career pages first, job platforms second, Gmail alerts third.
- `/discovery` shows Tavily/SerpApi/Gmail provider status, a Hebrew "מה לעשות עכשיו" guide, a top safe cleanup action, discovery run form, run history, sources to process, counts, verified job postings, legacy/noisy leads, and skipped/unsupported records.
- `/discovery` is RTL and uses responsive overflow guards (`min-w-0`, max-width, wrapping, clipped previews, and expandable details) so long URLs, Markdown snippets, provider text, and descriptions do not force horizontal page scroll.
- `/discovery` source candidates clearly say "זה מקור, לא משרה"; verified postings show large Hebrew state labels such as "מוכן לייבוא", "חסום — לא ניתן לייבא", "כפול", "כבר יובא", and "דורש בדיקה — עדיין לא מוכן".
- `/discovery` provider badges say key present/missing until a provider test verifies or fails them. SerpApi 401 maps to "SerpApi authorization failed: check SERPAPI_API_KEY/account." and never prints API keys.
- `/discovery` source candidates can be retried, enumerated, or skipped.
- `/discovery` can hide old non-importable leads by setting them to SKIPPED without deletion and without touching imported jobs.
- `JobDiscoveryRun` stores discovery run status, provider/query metadata, counts, and errors.
- `DiscoverySourceCandidate` stores Tavily/search/career-page results before they become jobs. Generic company pages, search result pages, ATS boards, career listings, blocked pages, and noisy pages stay candidates.
- `JobDiscoveryLead` stores both Gmail/manual leads and verified internet discovery leads, including source/evidence fields, extracted content, confidence, fit score, and reasons.
- Only verified single job postings, exact ATS job postings, or structured SerpApi Google Jobs results can become importable discovery leads. Verified postings can still be blocked by deterministic role rules.
- Broad Glassdoor/listing/search pages remain source candidates and are not importable.
- Verified job postings can be Ready to import, Blocked, Duplicate, Imported, or Needs review. Low-confidence and duplicate verified postings stay in the verified section rather than legacy/noisy.
- Workday support is safe/public and limited: search/listing pages are ATS board candidates, visible exact job links become source candidates, exact public job pages can create ATS job leads only when title and meaningful description are available, and JS-only/blocked pages stay candidates with errors.
- Candidate enumeration extracts HTML anchors, Markdown links like `[Title](https://...)`, and plain public job URLs from fetched content plus saved candidate raw text/snippets. Markdown titles are preserved; plain Workday/career URLs prefer readable surrounding text and fall back to "Untitled job link from Workday" or "Untitled job link from career page" instead of raw ids when no title exists. Workday search URLs are not classified as ATS job postings. Repeated enumeration dedupes candidates and leads.
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
- `lib/discovery/providerDiagnostics.ts`: lightweight Tavily/SerpApi test helpers, key-present/verified status labels, deduped provider messages, and safe provider error messages.
- `lib/discovery/companyCareerDiscovery.ts`: Greenhouse board token/job-id detection, public board fetch, target-role filtering, and mapping.
- `lib/discovery/workdayDiscovery.ts`: safe public Workday URL/link/job-page helpers; no browser automation.
- `lib/discovery/careerLinkExtractor.ts`: target-role public career-link extraction from HTML, Markdown links, and plain URLs, including conservative candidate title cleanup.
- `lib/discovery/sourceCandidateEnumeration.ts`: source-candidate retry/enumeration logic that creates candidates or verified leads.
- `lib/discovery/discoveryLeadViews.ts`: verified versus legacy/noisy discovery lead view helpers.
- `lib/discovery/jobPageFetcher.ts`: safe public HTTP(S) page fetch with timeout and content-type checks.
- `lib/discovery/jobDescriptionExtractor.ts`: JSON-LD JobPosting extraction and visible HTML fallback.
- `lib/discovery/pageClassifier.ts`: source candidate classification and importability rules.
- `lib/discovery/jobDiscoveryEngine.ts`: provider orchestration, source-candidate creation, and verified lead preparation.
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
- Search can miss jobs, return stale jobs, or return duplicate/platform wrapper pages; these should remain source candidates unless verified as single job postings.
- SerpApi 401 is an external key/account issue to fix outside the app.
- Public career pages may block fetches or omit useful JSON-LD.
- Greenhouse support is limited to public board URLs/tokens and exact public job ids.
- Workday support is limited to visible public HTML; JS-only pages are not automated.
- HTML fallback extraction is conservative and may produce low-confidence leads.
- Manual review remains required before any lead becomes a Job.

## Recommended Next Work

1. Manually QA `/discovery` provider tests, source candidate enumeration, and SerpApi account/key status.
2. Add more public ATS adapters only after inspecting real public behavior, likely Lever and Ashby first.
3. Add a dedicated discovery lead detail page if cards become too dense.
4. Keep imports manual and forbidden leads blocked unless a future override flow is explicitly designed.
