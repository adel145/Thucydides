# Agents Spec

This document records planned agents for future phases. No real agents run in the current phase.

## Planned Agents

- Profile Curator: normalizes Adel's CV, LinkedIn text, projects, certificates, portfolio, and academic status.
- Job Scout: imports or records candidate jobs from approved sources.
- Role Filter: rejects forbidden roles and flags risky requirements.
- Fit Scorer: compares a job with Adel's profile, geography, salary, and degree status.
- Resume Tailor: proposes English or Hebrew resume variants based on job language.
- Application Operator: prepares application checklists but does not submit without Adel's confirmation.
- Follow-Up Monitor: watches for replies and suggests next actions after Gmail integration exists.
- QA Reviewer: checks whether recommendations are truthful, role-safe, and aligned with constraints.

## Adel's Desired Agent Council

Adel's desired final product is a coordinated agent system that can run as a council or as individual specialists:

- Career Strategy Agent: maps the campaign plan, interview target, priorities, and next actions.
- Israeli Job Market Agent: finds and explains relevant Israeli roles using local job-market language.
- ATS Optimization Agent: checks whether CV wording matches a target role and common ATS expectations.
- CV Tailoring Agent: prepares targeted CV/application material after Adel's profile and sources are verified.
- Hebrew Language Agent: improves Hebrew phrasing for Israeli applications and recruiter communication.
- English Language Agent: improves English CV, LinkedIn, and application wording.
- Job Fit Scoring Agent: evaluates fit against Adel's profile, salary, location, degree status, and constraints.
- Hidden Market / Sourcing Agent: suggests sourcing channels, companies, referrals, and non-obvious opportunities.
- Risk & Compliance Agent: checks hard blockers, uncertainty, privacy, and application safety.
- Final Decision Chief Agent: summarizes the council output and recommends what Adel should review next.

## Capability Mapping

- Profile Curator maps to Career Strategy, CV Tailoring, Hebrew Language, English Language, and ATS Optimization.
- Job Scout maps to Israeli Job Market and Hidden Market / Sourcing.
- Role Filter maps to Risk & Compliance.
- Fit Scorer maps to Job Fit Scoring.
- Resume Tailor maps to CV Tailoring, ATS Optimization, Hebrew Language, and English Language.
- Application Operator maps to Career Strategy and Final Decision Chief, but must remain confirmation-based.
- Follow-Up Monitor maps to Career Strategy after Gmail integration exists.
- QA Reviewer maps to Risk & Compliance and Final Decision Chief.

## Agent Rules

- Agents must not silently send emails or applications.
- Agents must preserve a clear audit trail.
- Agents must mark uncertainty.
- Agents must respect forbidden roles.
- Agents must prefer local data and explicit user confirmation.
