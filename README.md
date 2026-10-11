# Dynamic Personal Portfolio

This repository is the engineering workspace for a secure, database-driven personal portfolio, private administration console, GitHub synchronization service, and source-grounded AI writing assistant.

The repository contains a working local application backed by Neon and synchronized from the owner's public GitHub account. Production deployment has not been attempted.

## Current state

- Product, architecture, design, security, database, privacy, and testing baselines are documented.
- A zero-cost provider baseline is recorded and local credentials remain ignored.
- `apps/portfolio` contains the tested Cloudflare-compatible application, public project routes, GitHub synchronization, and MFA-protected owner administration.
- Neon migrations, authenticated editing, revision restore, audit attribution, session controls, and crawl controls have local evidence in `TESTING.md`.

## Documentation map

- `PRD.md` — product requirements and acceptance criteria
- `ARCHITECTURE.md` — system boundaries and data flows
- `DATABASE.md` — normalized relational model proposal
- `DESIGN.md` — visual and interaction system
- `SECURITY.md` — preliminary threat model and control baseline
- `PRIVACY.md` — data classification, retention, and AI privacy rules
- `TESTING.md` — verification strategy and evidence rules
- `DEPLOYMENT.md` — deployment decision gates and runbook outline
- `TASKS.md` — implementation backlog with verification status
- `MEMORY.md` — concise cross-session project memory
- `AGENTS.md` — repository instructions for future engineering sessions
- `docs/current-state.md` — repository inspection report
- `docs/requirements-traceability.md` — requirement-to-task/test matrix
- `docs/technology-evaluation.md` — official-documentation review and stack candidates
- `docs/owner-decisions.md` — decisions requiring owner approval
- `docs/adr/` — architecture decision records

## Status vocabulary

Tasks use `NOT_STARTED`, `IN_PROGRESS`, `BLOCKED`, `IMPLEMENTED`, `TESTED`, and `VERIFIED`. A feature is not complete merely because code exists.

## Safety baseline

Do not add secrets, raw transcripts, student identifiers, access tokens, or private document contents to this repository. See `SECURITY.md`, `PRIVACY.md`, and `AGENTS.md` before implementation.
