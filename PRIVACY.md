# Privacy and Data Handling

This document is an engineering policy draft, not legal advice or a claim of compliance.

## Principles

- Collect the minimum data needed for the stated portfolio function.
- Make publication explicit and reversible in the application, while acknowledging downloaded public copies cannot be revoked.
- Keep private academic/reference documents and their derived data outside public routes, indexes, analytics, and ordinary logs.
- Send private data to an AI provider only after explicit, scoped owner consent.
- Define and implement deletion across originals, derivatives, indexes, caches, and provider-side artifacts where supported.

## Data inventory

| Data | Purpose | Default visibility |
|---|---|---|
| Portfolio content | Public professional presentation | Draft/private until published |
| Public resume version | Visitor review/download | Public only when selected |
| Private documents/transcripts | Owner reference and optional AI grounding | Confidential |
| Contact submissions | Respond to professional inquiries | Confidential |
| Admin auth/session data | Protect administration | Restricted |
| GitHub public repository metadata | Project synchronization | Public after verified sync and policy |
| AI consent, usage, proposals | Source-grounded drafting and audit | Confidential |
| Operational logs | Reliability/security | Internal, redacted |

## Retention

Exact periods require owner and jurisdictional review. Implementation must support configurable expiry for contact submissions, failed uploads, extracted document data, AI proposals, audit logs, and operational logs. Security audit evidence may need longer retention than content payloads; it must remain payload-free.

## Analytics

Prefer aggregate, cookieless or minimal analytics. Do not enable cross-site advertising profiles, keystroke/session replay, or collection of private/admin route activity. Consent requirements depend on the chosen provider, configuration, and visitor jurisdictions.

## Data subject and owner operations

Document export, correction, deletion, and retention override procedures before production. Deletion jobs must be idempotent and produce evidence without retaining the deleted content itself.

## Legal review items

- Privacy notice and contact-form disclosure.
- Cookie/analytics consent by target jurisdictions.
- AI provider terms, training/retention controls, and cross-border processing.
- Storage and backup residency.
- Third-party asset, font, and repository-content licenses.
- Incident/breach notification obligations.
