# Agents Spec

This document records planned agents for future phases. No agents run in Phase 0.

## Planned Agents

- Profile Curator: normalizes Adel's CV, LinkedIn text, projects, certificates, portfolio, and academic status.
- Job Scout: imports or records candidate jobs from approved sources.
- Role Filter: rejects forbidden roles and flags risky requirements.
- Fit Scorer: compares a job with Adel's profile, geography, salary, and degree status.
- Resume Tailor: proposes English or Hebrew resume variants based on job language.
- Application Operator: prepares application checklists but does not submit without Adel's confirmation.
- Follow-Up Monitor: watches for replies and suggests next actions after Gmail integration exists.
- QA Reviewer: checks whether recommendations are truthful, role-safe, and aligned with constraints.

## Agent Rules

- Agents must not silently send emails or applications.
- Agents must preserve a clear audit trail.
- Agents must mark uncertainty.
- Agents must respect forbidden roles.
- Agents must prefer local data and explicit user confirmation.

