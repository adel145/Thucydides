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

- Persistence tests for source create/delete behavior.
- Server action tests for job reminders and priority updates.
- Saved-view/filter tests.
- Daily review metric tests.
- Integration tests around source-to-profile workflows.

## Future Automated Tests

- Role allow/deny rule tests.
- Profile validation tests.
- Job parsing tests.
- Fit score snapshot tests.
- Agent output contract tests.
- Resume language-selection tests.
- Pipeline state transition tests.
