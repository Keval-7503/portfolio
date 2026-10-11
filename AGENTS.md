# Repository Instructions for Engineering Agents

Read `MEMORY.md`, `TASKS.md`, `SECURITY.md`, and the relevant ADRs before changing code.

## Mission

Build a truthful, secure, maintainable personal portfolio with a public website, single-owner admin, one-account GitHub synchronization, public resume management, private document isolation, and approval-only AI drafting.

## Engineering priorities

Security → correctness → maintainability → accessibility → performance → functionality → visual polish.

## Repository structure

Until scaffolding, root Markdown files define product and engineering contracts. Future source should use explicit domain modules for identity, publishing, portfolio, projects/GitHub, documents/media, AI, contact, and audit/operations. Keep public and private route/data boundaries obvious.

## Required behavior

- Never fabricate owner identity, history, links, metrics, project results, or credentials.
- Label evidence as `VERIFIED`, `USER_PROVIDED`, `DERIVED`, or `UNVERIFIED` when provenance matters.
- Preserve GitHub-synchronized fields separately from owner-authored project content.
- Treat uploaded files, Markdown, URLs, webhooks, GitHub content, and AI output as untrusted.
- Enforce admin authorization on the server for every private read/mutation; frontend guards are supplementary.
- Keep private documents out of public storage, public routes, search, analytics, client state, and logs.
- Require explicit consent for selected-document AI processing; AI cannot publish.
- Prefer small reversible changes, versioned migrations, typed schemas, and recorded evidence.

## Coding conventions

- Strict TypeScript; do not disable or suppress type checking to pass builds.
- Validate external and mutation inputs with shared schemas at the server boundary.
- Use parameterized ORM/query operations and transactions for multi-record invariants.
- Keep route handlers thin; domain services own policy and transactions.
- Use UTC instants and explicit date-only types; do not invent date precision.
- Centralize publication/visibility and authorization predicates and test them exhaustively.
- Use semantic HTML, visible focus, reduced motion, and accessible primitives.
- Do not introduce dependencies without checking maintenance, license, security, runtime fit, and bundle/server impact.

## Security rules

- Never commit `.env` files, tokens, passwords, TOTP seeds, backup codes, raw transcripts, student IDs, or private document text.
- Fail closed for authorization and private storage errors.
- Never infer repository deletion from a failed, partial, or incompletely paginated sync.
- Never render arbitrary HTML from Markdown or rich text.
- Never fetch arbitrary URLs server-side without the centralized SSRF policy.
- Do not weaken tests or controls to make a build pass.

## Test and verification commands

Run application commands from `apps/portfolio`:

```bash
npm run typecheck
npm run lint
npm run build
npm audit --omit=dev
```

Unit/integration, E2E, accessibility smoke, formatting, and secret-scan commands remain to be added under FND-002. Do not expose the local development server beyond loopback while the documented Drizzle Kit/esbuild development-only advisory remains.

Do not report a command as passing unless it was executed in the current relevant state. Record blocked checks and why.

## Documentation updates

Every meaningful implementation increment updates:

- `TASKS.md` status and concrete evidence;
- `MEMORY.md` decisions, status, risks, and next actions;
- affected architecture/security/database/API/design/test/deployment docs;
- an ADR for meaningful architecture changes;
- requirements traceability when scope or verification changes.

## Definition of done

A feature is done only when requirements and architecture are clear, implementation exists, type/build checks pass, relevant tests execute successfully, authorization/error/accessibility/security concerns are reviewed, documentation is current, and limitations/evidence are recorded.

## Forbidden shortcuts

No fake APIs presented as production, hardcoded secrets, disabled security protections, private data in fixtures, unsafe uploads, unsupported scraping, autonomous AI publication, history rewriting, silent deletion of owner work, fabricated test results, or production-readiness claims without evidence.

## Change management

- Inspect the worktree before edits and preserve unrelated/user changes.
- Prefer coherent commits after the user authorizes or requests commits; never rewrite history without permission.
- Apply database changes through new migrations.
- Require explicit owner approval for deployment, external account changes, purchases, provider activation, secret rotation, destructive production actions, and confidential document transfer.
