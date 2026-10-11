# Security Baseline and Preliminary Threat Model

Status: Architecture baseline, not a claim of compliance or production security.  
Reference: OWASP ASVS **5.0.0**, using a selected Level 2-oriented subset to be mapped before security verification. OWASP identifies 5.0.0 as the latest stable release at the review date: https://owasp.org/projects/asvs

## Security objectives

1. Only the explicitly authorized owner can access administration, private documents, AI processing, contact messages, job controls, or mutations.
2. Public responses contain only intentionally published records and public media.
3. External content—GitHub Markdown, uploads, documents, URLs, webhooks, and AI output—is untrusted.
4. A compromised external provider cannot silently publish content or gain broad infrastructure access.
5. Security-relevant actions are attributable without logging secrets or private content.

## Trust boundaries

- Browser ↔ application server
- Public routes ↔ private/admin routes
- Application ↔ PostgreSQL
- Application ↔ public/private/quarantine object storage
- Application/job runner ↔ GitHub, identity, email, monitoring, and AI providers
- AI orchestration ↔ authorized private document index
- CI/CD ↔ production environment and supply chain

## Data classification

| Class | Examples | Handling |
|---|---|---|
| Public | Published biography, selected resume, public project facts | Cacheable only after explicit publication. |
| Internal | Drafts, sync diagnostics, non-sensitive configuration | Admin-only; redact operational logs. |
| Confidential | Contact messages, unpublished career content, private documents, extracted text | Least privilege, private storage, no shared cache, retention limits. |
| Restricted secret | Password verifiers, TOTP seeds, backup codes, API tokens, signing keys | Secret manager/encrypted auth storage; never log or return to clients. |

## Threat actors

- Anonymous attacker probing public endpoints and uploads.
- Credential-stuffing or phishing attacker targeting the single admin.
- Malicious contact submitter or spam bot.
- Malicious content embedded in README, document, Markdown, link, or image metadata.
- Compromised dependency, CI token, provider, or administrator device.
- Accidental administrator error or storage misconfiguration.

## Primary threats and controls

### Account takeover

Controls: no public registration, explicit identity allow-list, MFA required, credential rate limiting, account lockout tuned against denial-of-service, secure recovery, session rotation/revocation, secure `HttpOnly`/`Secure`/`SameSite` cookies, short idle and bounded absolute expiry, reauthentication for secrets/MFA/private export, and audit alerts.

### Broken authorization / IDOR

Controls: deny-by-default server policy on every private object and mutation, opaque identifiers as defense-in-depth only, ownership/role checks, no direct private bucket URLs, and matrix tests covering anonymous, authenticated-but-not-allowed, allowed-without-MFA, and fully authorized states.

### XSS and content injection

Controls: React escaping, constrained Markdown AST, raw HTML disabled, sanitizer allow-list, URL scheme validation, safe external link attributes, CSP with minimal script sources, no `dangerouslySetInnerHTML` without a reviewed sanitizer boundary, and stored/reflected XSS tests.

### SSRF and unsafe fetches

Controls: server fetches use known provider hosts or validated allow-lists, resolve/reject private/link-local/loopback addresses when arbitrary URLs are unavoidable, limit redirects and response size/time, disallow non-HTTPS except documented local development, and never fetch URLs supplied by rendered Markdown without policy.

### Malicious upload

Controls: authorize before accepting, bounded streaming sizes, sanitized display filenames, opaque keys, extension/media-type/signature agreement, image re-encoding where appropriate, quarantine and malware scan, deny executable/archive types unless justified, private-by-default classification, and storage access tests.

### Private-document exposure

Controls: separate storage policy, public access disabled, private route authorization, short-lived signed links or streaming, `Cache-Control: private, no-store`, no indexing, no analytics payloads, no client hydration of document text, deletion propagation to extracted text/indexes, and direct object URL denial tests.

### GitHub synchronization corruption

Controls: stable numeric IDs, complete pagination, staged idempotent writes, an atomic expiring per-account concurrency lease, bounded transient retries, manual field separation, hide override precedence, no deletion inference after incomplete/API-failed runs, explicit status labels, and safe Markdown rendering. The unattended writer is a server-only `POST` endpoint protected by its own high-entropy bearer secret; it has no visitor identity, connected-app authority, or GitHub write access and returns only safe status/count data.

### AI prompt injection and data leakage

Controls: treat document instructions as data, retrieve only explicitly selected sources, least-data prompts, provider keys server-side, tool-free drafting model by default, strict structured output, source/citation validation, no autonomous publish capability, response sanitization, usage/time limits, and provider-retention review before activation.

### Contact abuse

Controls: server schema and length limits, per-IP and behavioral rate controls with privacy minimization, honeypot/challenge where justified, persistent submission before notification, no recipient/header control by sender, output encoding, retention expiry, and inbox authorization.

### Supply-chain compromise

Controls: committed lockfile, dependency and license review, automated vulnerability/secret scanning, pinned CI actions by commit where feasible, minimal CI permissions, protected production environments, reproducible build evidence, and prompt patching of security advisories.

## HTTP security baseline

- HTTPS only in production; HSTS after domain/redirect verification.
- CSP designed from actual asset needs; start in report-only during validation, then enforce.
- `X-Content-Type-Options: nosniff`.
- `Referrer-Policy: strict-origin-when-cross-origin` or stricter where compatible.
- `Permissions-Policy` denies unused capabilities.
- Frame protection through CSP `frame-ancestors`.
- Restrictive CORS; same-origin by default.
- Explicit cache headers for public, admin, download, and private routes.

## CSRF strategy

For cookie-authenticated mutations, require same-origin requests and framework/library CSRF protections; validate `Origin`/`Host` for sensitive endpoints and use anti-CSRF tokens where the selected architecture requires them. Scheduled jobs and webhooks use separate authentication and cannot reuse browser sessions.

## Secret management

- Local secrets live in ignored environment files; `.env.example` contains names and safe descriptions only.
- Hosted secrets use the platform secret manager and are scoped per environment.
- Rotate after suspected exposure and document token ownership, purpose, scope, and expiry.
- Do not store provider tokens in PostgreSQL unless encryption and rotation needs justify it; never expose them in admin responses.

## Logging and incident response

Log correlation ID, action, outcome, actor ID, target ID/type, safe error code, latency, and provider request ID when safe. Redact authorization headers, cookies, tokens, passwords, MFA data, private document text, AI prompt bodies, contact bodies, and sensitive query parameters.

Incident outline: contain credentials/sessions, preserve redacted evidence, identify affected data and integrations, patch and rotate, assess notification obligations with qualified counsel, restore verified service, and record a post-incident review.

## Verification gates

- Threat model reviewed after provider selection and before private uploads.
- Authorization matrix passes before any admin route is considered implemented.
- Storage isolation and malicious-file tests pass before private document use.
- AI adversarial tests and provider privacy review pass before real private content is processed.
- Dependency/secret scans and security headers pass before deployment.
- No claim of full ASVS, WCAG, privacy-law, or production-security compliance is permitted without scoped evidence.

## Known limitations

Provider controls, encryption implementation, recovery method, malware scanner, CSP sources, retention periods, regional requirements, and incident contacts are unresolved. These are tracked in `docs/owner-decisions.md` and `TASKS.md`.

The initial dependency audit found critical/high framework and image-processing advisories. The foundation was upgraded to Next.js 16.4.0, React 19.3.0, sharp 0.35.5, and patched source-map/browser-mapping packages; typecheck, lint, and build passed afterward. Four moderate advisories remain in the Drizzle Kit development chain through deprecated esbuild-kit packages. The affected development server is restricted to loopback, no deployment has occurred, and this must be reassessed before release. Next.js has also announced an out-of-band upstream security update for 2026-10-14, so deployment is blocked pending that review.
