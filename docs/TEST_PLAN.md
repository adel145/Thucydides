# Test Plan

## Phase 0 Manual Checks

- Run `npm install`. Completed.
- Run `npm run build`. Completed.
- Run `npm run lint`. Completed.
- Run `npm run dev -- -p 3000`. Completed.
- Open the local Next.js URL. Dashboard returned HTTP 200.
- Confirm `/jobs/example-placeholder` loads the dynamic job detail placeholder. Returned HTTP 200.
- Confirm text clearly states placeholders where features are not implemented. Completed in implementation.
- Confirm Stitch files remain present. Completed.
- Confirm no nested `thucydides` folder exists. Completed.

Remaining visual QA:

- Click each sidebar navigation item in a browser.
- Inspect mobile and desktop layouts visually.

## Phase 1 Checks

- Run `npm install`. Completed.
- Run `npx prisma migrate dev --name phase1_local_data`. Completed after pre-creating empty `prisma/dev.db`.
- Run `npm run db:seed`. Completed.
- Run `npm run test`. Completed: 1 file, 7 tests.
- Run `npm run build`. Completed.
- Run `npm run lint`. Completed with no warnings or errors, plus Next.js deprecation notice.
- Confirm local database counts. Completed: 1 profile and 10 jobs.
- Confirm `/profile` returns HTTP 200. Completed.
- Confirm `/jobs` returns HTTP 200. Completed.
- Confirm real `/jobs/[id]` returns HTTP 200. Completed.

## Phase 2 Test Needs

- Run `npm install`. Completed.
- Run `npm run db:seed`. Completed.
- Run `npm run test`. Completed: 5 files, 15 tests.
- Run `npm run build`. Completed.
- Run `npm run lint`. Completed with no warnings or errors, plus Next.js deprecation notice.
- Run `npm run dev -- -p 3000`. Completed.
- Smoke-check `/`. Completed: HTTP 200.
- Smoke-check `/profile`. Completed: HTTP 200.
- Smoke-check `/jobs`. Completed: HTTP 200.
- Smoke-check a real `/jobs/[id]`. Completed: HTTP 200.
- Smoke-check a real `/jobs/[id]/edit`. Completed: HTTP 200.
- Smoke-check `/pipeline`. Completed: HTTP 200.

## Phase 3 Test Needs

- Run `npm install`. Completed.
- Run `npx prisma migrate dev --name phase3_campaign_intelligence`. Completed.
- Run `npm run db:seed`. Completed.
- Run `npm run test`. Completed: 8 files, 27 tests.
- Run `npm run build`. Completed.
- Run `npm run lint`. Completed with no warnings or errors, plus Next.js deprecation notice.
- Run `npm run dev -- -p 3000`. Completed.
- Smoke-check `/`. Completed: HTTP 200.
- Smoke-check `/profile`. Completed: HTTP 200.
- Smoke-check `/jobs` with filters. Completed: HTTP 200.
- Smoke-check `/sources`. Completed: HTTP 200.
- Smoke-check a real `/jobs/[id]`. Completed: HTTP 200.
- Smoke-check a real `/jobs/[id]/edit`. Completed: HTTP 200.
- Smoke-check a real `/jobs/[id]/delete`. Completed: HTTP 200.
- Smoke-check `/pipeline`. Completed: HTTP 200.

## Phase 4 Test Needs

- Run `npm run test`.
- Run `npm run build`.
- Run `npm run lint`.
- Verify deterministic Jobs Ready To Apply helper.
- Verify dashboard mission grouping.
- Verify source readiness helper.
- Verify quick review filters.
- Verify manual source-to-profile evidence linking.
- Verify agent contract helper behavior.
- Smoke-check `/`, `/jobs`, `/sources`, and a real `/sources/[id]` after seeding local data.

Remaining Phase 4 follow-up tests:

- Persistence tests for source update/delete behavior.
- Server action tests for job reminders and priority updates.
- Persistence tests for profile source link server actions.

## Phase 5 Test Needs

- Run `npx prisma migrate dev --name phase5_application_packet`. Completed.
- Run `npx prisma generate`. Completed.
- Run `npm run db:seed`. Completed.
- Run `npm run test`.
- Run `npm run build`.
- Run `npm run lint`.
- Verify Application Packet helper language, decision, checklist, and missing-item logic.
- Verify Application Packet READY safety gate blocks forbidden, archived, rejected, closed, and critically incomplete packets.
- Verify controlled AI drafting helpers with missing env, blocked jobs, review-only prompt wording, response text extraction, and output validation.
- Verify controlled AI request bodies include `store: false`, `tools: []`, and `tool_choice: "none"`.
- Verify AI draft output validation rejects array fields with non-string items and rejects empty/no-useful generated output.
- Verify missing `OPENAI_API_KEY` or `OPENAI_MODEL` disables AI drafting without fake output.
- Manually verify direct mark-ready attempts without a saved packet show `packetMissing=1` and do not mark READY.
- Smoke-check `/jobs/[id]/application`.
- Smoke-check `/resumes`.

Remaining Phase 5 follow-up tests:

- Persistence tests for packet save and mark-ready server actions.
- Persistence tests for AI draft run creation, error storage, and copy-to-packet action.

Phase 5.2 completed coverage:

- Helper-level tests for Application Packet save preparation, safe READY blocking, checklist snapshots, and missing items.
- Helper-level tests for mark-ready success, packet-missing behavior, forbidden/archived/rejected/application-progress blocking, and incomplete packet blocking.
- Helper-level tests for AI draft disabled/blocked reasons, success audit records, error audit records, and explicit packet draft replacement fields.
- Manual UI refinement remains browser QA: Application Packet evidence review, Resume Lab readiness summaries, and Source detail manual evidence copy.

Phase 5.3 completed coverage:

- Unit tests for source upload filename sanitization, relative stored upload path generation, and file-size formatting.
- Build/type verification covers additive `SourceFile` upload metadata in Sources list/detail pages.
- Manual QA should smoke-check `/jobs`, `/jobs/[id]/application`, `/resumes`, `/sources`, and `/sources/[id]`.
- Confirm uploaded files stay under `local_uploads/sources/` and no extracted text is generated automatically.

Phase 5.3 Correction Patch coverage:

- Unit coverage confirms source readiness copy treats LinkedIn as URL or pasted text, not file-only.
- Build/type verification covers URL-only source creation and URL display on Sources list/detail pages.
- Manual QA should confirm `/sources` still has upload intake, link source intake without file upload, and pasted text/notes intake.
- Manual QA should confirm `/sources/[id]` shows uploaded-file metadata for file sources and an Open source link action for URL sources.
- Manual QA should confirm `/jobs`, `/jobs/[id]/application`, and `/resumes` remain readable with clearer actions and no new integrations.

Phase 5.4 coverage:

- Unit coverage confirms bulk evidence-link target preparation skips duplicate fields and rejects invalid target fields.
- Manual QA should confirm `/sources/[id]` can create multiple evidence links from one source in one save.
- Manual QA should confirm duplicate source + target field links are not created.
- Manual QA should confirm `/resumes` separates profile text, source records, and evidence links with actions to `/profile` and `/sources`.
- Manual QA should confirm `/profile` highlights missing real data and shows examples for technical skills, GitHub projects, portfolio links, field experience, and certificates.
- Manual QA should confirm `/jobs` and `/jobs/[id]/application` remain easier to read after the comfort theme pass.

Phase 5.5 coverage:

- Unit fixtures confirm Deep Learning / AI / ML / Research Student wording is a positive deterministic role signal.
- Unit fixtures confirm mandatory security clearance, mandatory army experience, sales, and regular customer service still force FORBIDDEN even when AI/ML wording is present.
- Manual QA should confirm the top bar separates "AI drafting configured" or "AI drafting not configured" from "Gmail not connected."
- Manual QA should confirm `/jobs/[id]/application` explains READY versus NEEDS_MANUAL_REVIEW and still blocks unsafe READY states.
- Manual QA should confirm Dashboard, Resume Lab, and Application Packet mention future discovery/export only as planned work.

Phase 6.0 coverage:

- Unit tests cover Gmail alert provider classification for LinkedIn, Indeed, Drushim, AllJobs, and unknown senders.
- Unit tests cover conservative pasted-alert parsing, URL extraction, raw snippet preservation, and noisy/empty text avoidance.
- Unit tests cover role safety for AI/ML research student leads and hard forbidden blockers.
- Unit tests cover safe Job create shaping, forbidden import blocking, and duplicate detection.
- Unit tests cover dashboard count logic for local Gmail alert leads awaiting review.
- Build/type verification covers additive `GmailJobAlert` and `JobDiscoveryLead` models, `/gmail`, and dashboard count integration.
- Manual QA should confirm `/gmail` loads, saves pasted alert text, creates local leads, imports a safe lead, blocks forbidden leads, and never claims Gmail is connected.
- Manual QA should confirm Dashboard copy says "Manual Gmail alert leads awaiting review" and does not imply inbox scanning.

Phase 6.1 coverage:

- Unit tests cover Tavily/SerpApi provider configuration and missing-key behavior.
- Unit tests cover company-career-first and platform query generation.
- Unit tests cover Greenhouse board token detection and Greenhouse job mapping.
- Unit tests cover JSON-LD JobPosting extraction and visible HTML fallback extraction.
- Unit tests cover expanded role rules for backend, full-stack, Python, software engineer, and AI training titles, including hard-blocker overrides.
- Unit tests cover deterministic fit scoring for strong AI/ML research leads, forbidden leads, and low-confidence missing-description leads.
- Unit tests cover discovery lead preparation and import using enriched descriptions over noisy snippets.
- Unit tests cover discovery dashboard counts.
- Build/type verification covers `/discovery`, discovery server actions, `JobDiscoveryRun`, expanded `JobDiscoveryLead`, and provider clients.
- Manual QA should confirm `/discovery` loads, provider status degrades gracefully without keys, runs create source candidates and only verified review leads when providers are configured, and imports remain manual.
- Manual QA should confirm no automatic apply, email sending, Gmail OAuth, login bypass, or authenticated scraping exists.

Phase 6.1A coverage:

- Unit tests cover source classification for broad search titles, aggregator/listing pages, generic company pages, and JSON-LD JobPosting pages.
- Unit tests cover URL safety rejection for unsafe schemes, localhost, and private/internal IP ranges.
- Unit tests cover Greenhouse exact job-id mapping and board filtering so discovery does not blindly pick the first listing.
- Unit tests cover import refusal for low-confidence and non-posting source classifications.
- Unit tests cover verified technical postings with mandatory security clearance still being blocked as FORBIDDEN.
- Unit tests cover skip-non-imported discovery run behavior without touching imported leads.
- Build/type verification covers additive `DiscoverySourceCandidate`, source-candidate UI, source classification, and the import quality gate.
- Manual QA should confirm `/discovery` separates Source candidates from Job leads and disables import for non-importable candidates.

Phase 6.1B coverage:

- Unit tests cover SerpApi 401 diagnostic copy without exposing keys.
- Unit tests cover Workday search pages as non-importable ATS board candidates.
- Unit tests cover exact public Workday job-like pages becoming ATS job leads only when title and meaningful description exist.
- Unit tests cover Workday JS-only/blocked pages staying candidates with errors and no leads.
- Unit tests cover generic public career HTML extracting target-role links as source candidates.
- Unit tests cover broad Glassdoor listings remaining unsupported/non-importable.
- Unit tests cover enumeration updating `createdLeadCount`.
- Unit tests keep LOW-confidence/listing candidates non-importable and verified security-clearance postings FORBIDDEN.
- Build/type verification covers `/discovery` provider tests and source-candidate retry/enumerate/skip actions.
- Manual QA should confirm SerpApi 401 tells Adel to fix the key/account outside the app and does not print secrets.

## Future Automated Tests

- Role allow/deny rule tests.
- Profile validation tests.
- Job parsing tests.
- Fit score snapshot tests.
- Agent output contract tests.
- Resume language-selection tests.
- Pipeline state transition tests.
