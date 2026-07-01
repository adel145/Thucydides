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

Phase 6.1C coverage:

- Unit tests cover Markdown job-link extraction.
- Unit tests cover plain Workday job URL extraction.
- Unit tests confirm HTML link extraction still works.
- Unit tests cover URL dedupe during extraction/enumeration preparation.
- Unit tests cover NVIDIA Workday Markdown text producing source candidates.
- Unit tests cover provider status copy distinguishing key present from verified/auth failed.
- Unit tests cover deduped SerpApi 401/auth messages.
- Unit tests cover verified job lead versus legacy/noisy lead separation.
- Unit tests cover hiding old non-importable leads without affecting imported leads.
- Build/type verification covers `/discovery` trust sections and hide-old-leads server action.

Phase 6.1D coverage:

- Unit tests cover Markdown job-link title preservation.
- Unit tests cover plain Workday URLs using readable surrounding text instead of hash-like ids.
- Unit tests cover untitled Workday URLs falling back to "Untitled job link from Workday".
- Unit tests cover extracted source candidates preserving readable titles.
- Unit tests cover verified posting action labels for blocked, duplicate, needs-review, and ready-to-import states.
- Unit tests cover verified job posting versus legacy/noisy lead separation and safe hide behavior.
- Build/type verification covers `/discovery` action guide, renamed sections, source-candidate cards, and verified posting labels.
- Manual QA should confirm "Clean old noisy leads" marks old non-importable leads skipped without deletion and without touching imported jobs.
- Manual QA should confirm source candidates are not presented as jobs, and verified postings can still be blocked by role rules.

Phase 6.1E coverage:

- Unit tests cover low-confidence actual job postings staying in Verified job postings as Needs review.
- Unit tests cover duplicate verified postings staying in Verified job postings with Duplicate state.
- Unit tests cover imported verified postings staying in Verified job postings with Imported state.
- Unit tests cover Workday search URLs becoming ATS board source candidates, not ATS job postings.
- Unit tests cover exact public Workday job URLs still becoming ATS job postings after verification.
- Unit tests cover Clean old noisy leads safety so imported jobs and verified postings are not hidden.
- Build/type verification covers `/discovery` state labels and import disabled states.
- Manual QA should confirm the import button appears only for non-imported active verified postings and is disabled unless the posting is truly ready.

Phase 6.1F coverage:

- Existing unit coverage remains unchanged because discovery backend behavior and import eligibility were not changed.
- Build/type verification covers the Hebrew RTL `/discovery` page, expandable details, and responsive class changes.
- Manual QA should confirm `/discovery` has no horizontal page scroll with the sidebar open at 100% zoom.
- Manual QA should confirm long URLs, Markdown snippets, raw provider text, and descriptions wrap or stay inside clipped previews.
- Manual QA should confirm source candidates clearly read as sources, not jobs, and verified posting state labels are clear in Hebrew.

Phase 6.1G coverage:

- Existing unit coverage remains unchanged because this is a UI/readability patch only.
- Build/type verification covers global `dir="rtl"`, shared shell copy, core page translation, and responsive class changes.
- Dev runtime QA confirmed `/sources` returns HTTP 200 without the prior React Server Action form `encType` warning.
- Manual QA should confirm Dashboard, Profile, Job Inbox, Job detail/edit/delete, Application Packet, Resume Lab, Agent Council, Pipeline, Sources, Source Detail, Gmail, Settings, and Discovery are Hebrew-first and right-aligned.
- Manual QA should confirm technical terms, provider names, env vars, URLs, and enum/status badges remain readable in English where useful.
- Manual QA should confirm long URLs, pasted job descriptions, source text, raw snippets, and notes do not create horizontal page scroll with the sidebar open at 100% zoom.
- Manual QA should confirm no discovery/import eligibility, forbidden-role blocking, Gmail behavior, AI scope, schema, or provider behavior changed.

Phase 6.2 coverage:

- Unit tests cover deterministic source-candidate quality scoring for Israel/remote technical sources, noisy sources, and clear non-target locations.
- Unit tests cover source candidate grouping into current action, processed, and unsupported buckets.
- Unit tests cover generic Workday search/listing boards not scoring `HIGH 100` without Israel/remote evidence.
- Unit tests cover display grouping for repeated Workday ATS board candidates and processed source candidates.
- Unit tests cover repeated blocked verified postings grouping for display without deleting or hiding the underlying records.
- Unit tests cover Workday/career-link extraction filtering clear non-target locations while preserving Israel and strong unknown-location technical links.
- Unit tests cover verified posting ordering by action state: ready, needs review, duplicate, imported, blocked.
- Build/type verification covers `/discovery` ranking/grouping UI, the processed-source section, source-quality helper imports, and career-link extraction changes.
- Manual QA should confirm `/discovery` primary source review is less noisy and that processed sources remain available but secondary.
- Manual QA should confirm no import eligibility, forbidden-role blocking, exact Workday verification, Gmail behavior, AI scope, schema, provider, scraping, or automation behavior changed.

Phase 6.3 coverage:

- Unit tests cover JSON-LD JobPosting extraction with title, company, location, description, and requirements.
- Unit tests cover visible HTML fallback cleaning navigation/menu/cookie noise.
- Unit tests cover requirements/qualifications section extraction.
- Unit tests cover weak/noisy HTML staying non-meaningful.
- Unit tests cover Workday exact static pages enriching with real description/requirements.
- Unit tests cover Workday JS-only pages creating no fake description and staying unsupported/needs-review.
- Unit tests cover static Greenhouse public job HTML extraction.
- Unit tests cover static Lever-style public job HTML extraction.
- Existing tests keep hard-forbidden verified postings blocked and low-confidence/missing-description leads non-importable.
- Build/type verification covers the extractor, enrichment action feedback, Workday exact-page handling, and source candidate enumeration.
- Manual QA should confirm enrichment retry does not overwrite useful lead data when public page extraction fails.

## Future Automated Tests

- Role allow/deny rule tests.
- Profile validation tests.
- Job parsing tests.
- Fit score snapshot tests.
- Agent output contract tests.
- Resume language-selection tests.
- Pipeline state transition tests.
