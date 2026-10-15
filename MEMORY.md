# Project Memory

Last updated: 2026-10-15

## Confirmed requirements

- One dynamic public portfolio, one private admin console, and one private AI drafting assistant.
- Exactly one GitHub account; all owned public repositories, including forks and archives, synchronize and newly discovered ones auto-publish unless manually hidden.
- Public resume preview/download is required; transcripts and reference documents are private.
- MFA and server-side deny-by-default authorization are mandatory; no public registration.
- AI output is source-grounded, private-data access is explicitly consented, and publication always requires owner action.
- Visual direction is modern neobrutalism plus original cartoon animation, with WCAG 2.2 AA and reduced-motion support.
- Missing personal information must remain empty/editable; no fabricated identity or claims.

## Repository state

- Workspace was empty and not a Git repository when inspected.
- Architecture/requirements documentation was created in the first increment.
- `apps/portfolio` contains a Cloudflare-compatible Vinext/Next.js TypeScript application with the public site, protected single-owner admin, GitHub synchronization, document/resume lifecycle, contact inbox, and approval-only AI drafting. Free production is active at `https://portfolio.kevalpatel.workers.dev` using Cloudflare Workers/R2 and Neon; the admin entry point is `/admin`.
- The first responsive public homepage slice is implemented with truthful empty states, a custom favicon, and an original generated workbench robot asset.
- The owner supplied and public API verification confirmed GitHub login `Keval-7503`, stable account ID `80451128`, and nine public owned repositories on 2026-10-09. The homepage prefers synchronized database records and retains the verified snapshot as a fail-safe.
- The owner created a Neon database, applied the first migration, and securely verified all five expected tables. The first credential-free GitHub bootstrap sync stored one account, nine repositories, nine published projects, zero missing repositories, and a successful run.
- The homepage now queries published projects from Neon and falls back to the bundled verified snapshot on configuration/query failure. A production-mode local request verified the database path was used.
- GitHub synchronization now has an atomic expiring account lease, bounded transient retries, redacted history, and a server-only authenticated `POST` trigger. The live upgrade migration, two-contender lease test, and conditional `not_modified` sync passed. Hosted scheduling is not active.
- Owner authentication foundation now uses self-hosted Better Auth with closed registration, a single runtime allow-list, active-admin database policy, TOTP/backup codes, expiring sessions, database throttling, and second-factor lockout. The live auth schema migration, production build, single-owner bootstrap, interactive MFA enrollment, and anonymous-denial check passed.
- The protected admin home now shows live project and public-repository totals, GitHub account/synchronization health, and a read-only project inventory. Editing remains intentionally deferred until mutation authorization and CSRF controls are in place.
- Public project detail pages are available at `/projects/[slug]`, use only published/non-hidden/available database records, expose record-specific metadata and verified GitHub facts, return 404 for unknown records, and honor stored historical slug redirects. Homepage project cards link to these pages.
- Project detail pages now use a centralized safe Markdown renderer for owner-published notes and synchronized GitHub READMEs. It never injects raw HTML, accepts only credential-free HTTPS links, does not render remote images, caps rendered input, and passed a malicious-input fixture. The live importer stores README payloads up to 500 KB; eight of nine repositories currently have READMEs.
- The runtime now enforces CSP, frame denial, nosniff, referrer and permissions policies, plus private/no-store caching for admin/auth routes. Central helpers reject cross-origin/originless browser mutations and restrict external/provider URLs. HSTS remains intentionally gated on a verified production HTTPS domain; CSP nonce hardening remains.
- Admin project records now have protected edit pages and a validated same-origin PATCH boundary for owner-controlled title, category, summary, safe Markdown, featured/order, publication, and visibility fields. Anonymous/cross-origin denial and production build passed; authenticated browser save, revisions, and audit records remain.
- Durable revision and audit tables are now live. Project edits and restores use one database batch to snapshot the previous owner-controlled state, update the record, and append an attributed audit event containing identifiers and changed field names but no content. The editor shows up to 25 revisions and supports guarded restore; an intentional owner edit is still needed for authenticated integrity evidence.
- The source is published at `https://github.com/Keval-7503/portfolio`. After fixing an over-broad ignore rule and upgrading to Next.js 16.4.1, GitHub Actions quality run `38815019371` passed on a clean Ubuntu runner. Cloudflare stores production values as encrypted Worker Secrets; repository and local secret-scan gates pass.
- Production database readiness and six-route smoke checks pass. The public résumé returns the expected PDF and all three owner-approved documents were transferred to private R2 with byte-size and SHA-256 verification; transfer temporaries were removed.

## Architecture decisions

- TypeScript modular monolith.
- PostgreSQL system of record; binaries in object storage.
- GitHub source records separated from editorial project records.
- Private documents isolated from public media storage and routes.
- Provider/runtime/auth/ORM selections are pending owner decisions and compatibility verification.
- Owner requires a zero-cost starting tier and authorized engineering to choose free providers.
- Selected foundation: Cloudflare Workers Free, Neon Free PostgreSQL, separate Cloudflare R2 buckets, self-hosted Better Auth with mandatory MFA, Turnstile Free, Resend Free, and quota-capped Workers AI.
- Free-tier limits are operational constraints, not production SLAs; the application must fail safely rather than create charges.
- The owner supplied an admin email in chat. Never copy it into repository files; use a runtime allow-list secret later.

## Rejected approaches

- Static portfolio or frontend-only mockup.
- Multiple GitHub account model.
- LinkedIn scraping.
- Live GitHub calls per visitor.
- AI autonomous publication or unrestricted database/tool access.
- Public transcript links or security through obscurity.
- Premature microservices/Kubernetes/Redis/message broker.

## Important constraints

- Do not deploy, purchase services, change accounts/domains, or transfer confidential documents without explicit authorization.
- Do not store secrets or sensitive raw content in repository documentation or logs.
- Do not mark a task verified without actual evidence.
- Current security reference is OWASP ASVS 5.0.0; no blanket compliance claim.
- Official 2026-10-14 Next.js advisories were reviewed on 2026-10-15. Next.js 16.4.0 was affected by two critical vulnerabilities and one high-severity vulnerability, so the project now uses patched 16.4.1. The production audit has five moderate findings in the Drizzle Kit development-tool chain and no critical/high finding; development servers remain loopback-only.

## Outstanding owner decisions

See `docs/owner-decisions.md`. Remaining material inputs include any future GitHub credential authorization, retention/recovery policy, jurisdictional review, and non-GitHub identity/profile content. Private-document AI processing remains gated on a model-specific privacy review.

## Next actions

1. Observe and record the first hosted scheduled GitHub synchronization.
2. Configure an optional generic sync-failure alert destination and verify receipt if the owner supplies one.
3. Configure the protected GitHub `production` environment for repeatable workflow-driven releases without exposing credentials.
4. Complete provider-level isolated restore evidence and owner-operated production accessibility checks.
