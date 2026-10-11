# Owner Decision Register

Personal biography fields can be supplied later through the admin and do not block foundation work. The decisions below materially change security, runtime, cost, or external state and require explicit owner input before their dependent task begins.

## P0 — required before application foundation or sensitive features

| ID | Decision | Why it matters | Recommended starting point | Status |
|---|---|---|---|---|
| OD-001 | Production hosting platform, region, and monthly budget ceiling | Determines runtime, schedule, database connectivity, logs, and deployment model. | Cloudflare Workers Free, global edge; strict usage caps and no paid overage authorization. | DECIDED — owner requires $0 |
| OD-002 | Managed PostgreSQL provider and region | Affects network path, backups, recovery, residency, and cost. | Neon Free PostgreSQL; begin with a US East region for the current America/New_York operating context, subject to owner correction before real private data. | DECIDED — engineering choice authorized |
| OD-003 | Authentication approach and owner identity bootstrap | Determines MFA, recovery, sessions, vendor exposure, and operational burden. | Self-hosted MIT-licensed Better Auth using PostgreSQL, allow-listed owner email from runtime secret/config, mandatory TOTP and optional passkey; no public sign-up. | DECIDED — owner requires $0 |
| OD-004 | Private/public object storage provider and region | Required before uploads; affects signed URLs, scanning, lifecycle, and privacy. | Separate Cloudflare R2 Standard buckets/bindings for public media, private documents, and quarantine; remain inside free quotas. | DECIDED — engineering choice authorized |
| OD-005 | Domain/origin plan | Required for cookies, passkeys, OAuth callbacks, canonical URLs, CSP, and email. | Use a free deployment origin initially; production and preview origins remain isolated. Custom domain is deferred because domains are not generally free. | DECIDED — $0 launch |

## P1 — required before corresponding integration

| ID | Decision | Why it matters | Recommended starting point | Status |
|---|---|---|---|---|
| OD-006 | GitHub username and credential method | Username must not be guessed; authenticated limits are materially higher than anonymous use. | Verified public owner `Keval-7503` (GitHub account ID `80451128`). Begin with credential-free public reads; require separate approval before adding a least-privilege token or GitHub App. | DECIDED — public identity verified; credential deferred |
| OD-007 | Email notification provider and approved sender/recipient | Contact notifications require domain verification and anti-abuse configuration. | Resend Free with tracking disabled where configurable; final sender setup waits for a verified domain. Store messages before notification. | DECIDED — $0 tier |
| OD-008 | Spam protection approach | Impacts privacy, accessibility, abuse resistance, and external processing. | Server rate/length/honeypot controls plus Cloudflare Turnstile Free. | DECIDED — $0 tier |
| OD-009 | AI provider, approved models, budget, and retention requirements | Private data, cost, region, model quality, and deletion guarantees differ. | Cloudflare Workers AI behind a provider interface and hard daily quota; private-document processing stays disabled until model-specific privacy/retention review. | DECIDED FOR FOUNDATION — privacy gate remains |
| OD-010 | Monitoring/error provider and alert destination | Required for incident response and job failure awareness. | Begin with structured redacted Cloudflare logs/metrics and database job history; add no paid service. | DECIDED — $0 tier |
| OD-011 | Analytics policy | Cookie/consent and data collection depend on provider/configuration. | Cloudflare Web Analytics or no analytics; aggregate public routes only, never admin/private routes. | DECIDED — privacy-first $0 tier |
| OD-012 | Malware scanning service or operational workflow | Upload acceptance must not imply unverified scanning. | Quarantine, strict allow-list/signature/size validation, and owner-only uploads. Local development uses current Microsoft Defender signatures through a fail-closed checksum-verifying scan command; files remain quarantined until explicit owner promotion. Production promotion remains blocked until an equivalent private hosted scanner is approved. | DECIDED WITH LIMITATION |

## Policy decisions

| ID | Decision | Recommended starting point | Status |
|---|---|---|---|
| OD-013 | Contact, private-document, AI, audit, and log retention periods | Minimize; define separate periods and legal holds rather than one global duration. | UNDECIDED |
| OD-014 | Account recovery custodians/procedure | Offline recovery codes plus a documented, tested owner-only recovery procedure. | UNDECIDED |
| OD-015 | Target visitor jurisdictions and legal review | Identify primary residence/business and expected audience before final privacy/cookie terms. | UNDECIDED |
| OD-016 | Whether light/dark mode is required at launch | Launch with one thoroughly tested light theme; add dark mode after content/design validation unless owner prefers otherwise. | UNDECIDED |

## Content inputs (non-blocking for foundation)

- Exact display name and professional headline.
- Approved biography, experience, education, research, publications, skills, achievements, and interests.
- Exact GitHub and LinkedIn URLs plus any other profile URLs.
- Current public resume file/version and approved category label.
- Approved contact email and public location wording, if any.
- Original illustration preferences or visual references that the owner is licensed to use.

Until supplied, all corresponding fields remain null and public pages use truthful empty states.

## Sensitive owner input received outside repository configuration

The owner supplied an administrator email in chat. It is intentionally not reproduced in this repository. When authentication is configured, it must be provided through a secret/runtime environment value such as `ADMIN_EMAIL_ALLOWLIST`, never committed source or documentation.

The supplied email was not used to infer a GitHub identity. The owner later supplied `https://github.com/Keval-7503`; a read-only public API request verified login `Keval-7503` and stable account ID `80451128` on 2026-10-09. No token or account permission has been requested. Any future credential remains a separate least-privilege decision.
