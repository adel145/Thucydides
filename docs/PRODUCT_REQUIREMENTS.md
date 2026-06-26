# Product Requirements

## Product

Thucydides is Adel's personal strategic job-search command center for reaching 10 interviews in Israel.

## Users

- Primary user: Adel.
- Secondary future users: none planned. This is a personal local-first app, not a SaaS product.

## Success Metric

The north-star metric is 10 interviews.

Supporting metrics planned for later phases:

- Jobs found
- Jobs analyzed
- Applications ready
- Applications sent
- Replies
- Interviews
- Rejections and archived jobs

## Core Modules

- Dashboard: campaign overview and metrics.
- Profile Intelligence: source of truth for Adel's CV, LinkedIn, GitHub, portfolio, certificates, academic status, salary constraints, and geography preferences.
- Job Inbox: imported jobs and first-pass filtering.
- Job Detail: role analysis, fit notes, dealbreakers, and application readiness.
- Resume Lab: English/Hebrew resume variants and targeted application material.
- Agent Council: coordinated specialist agents for profile, job search, filtering, scoring, drafting, and QA.
- Pipeline: tracking from discovered to interview or archive.
- Sources: local source records and manual text intake for CVs, LinkedIn, GitHub projects, portfolio, certificates, academic documents, and job-search notes.
- Gmail: recruiter email monitoring and follow-up support.
- Settings: local configuration, secrets guidance, source preferences, and safety controls.

## Constraints

- Must run from `C:\Users\adelm\Documents\Thucydides`.
- Must not create a nested `thucydides` project folder.
- Must preserve Stitch reference files.
- Must not claim placeholder features are working.
- Must keep private data local by default.
- Must not parse or upload files automatically until a later phase explicitly designs that workflow.
