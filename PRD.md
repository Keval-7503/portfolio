# Product Requirements Document

Status: Baseline draft 0.1  
Source classification: Requirements are `USER_PROVIDED` unless explicitly marked otherwise.  
Last updated: 2026-10-09

## Product vision

Create a long-lived personal digital universe that accurately presents the owner's professional, academic, research, and engineering identity while allowing ordinary content maintenance without code. The product combines a public portfolio, a secure single-owner administration system, automated synchronization of one public GitHub account, and a private source-grounded AI drafting assistant.

## Goals

1. Publish accurate, owner-approved professional content through an accessible, distinctive public experience.
2. Let one authorized administrator manage content, publication state, ordering, media, resumes, contacts, and configuration without redeployment.
3. Import and refresh every public repository owned by one configured GitHub account while preserving manual enhancements and visibility overrides.
4. Keep private documents, authentication data, contact messages, and AI processing isolated from public access.
5. Provide auditable drafting assistance that cites authorized source material and never publishes autonomously.
6. Maintain professional engineering evidence: migrations, tests, threat model, operational documentation, and traceable requirements.

## Non-goals

- Public user registration, community accounts, or multi-tenant administration.
- Supporting multiple GitHub identities in the initial product.
- Scraping LinkedIn or unsupported third-party endpoints.
- Automatically publishing AI-generated text.
- Exposing transcripts or private reference documents publicly.
- Claiming legal compliance, production readiness, security, or performance without evidence.
- Introducing microservices, Kubernetes, Redis, or a message broker without a demonstrated need.

## Audiences and personas

| Persona | Primary needs |
|---|---|
| Recruiter or hiring manager | Quickly understand verified strengths, experience, projects, research, and obtain the current public resume. |
| Engineer or collaborator | Inspect technical depth, repository evidence, architecture, research, and writing. |
| Academic or research reviewer | Review accurately labeled education, research projects, and publication status. |
| Portfolio owner/administrator | Securely maintain, preview, publish, synchronize, and audit content without changing code. |

## Core user journeys

### Visitor discovers the owner

The visitor lands on a narrative homepage, understands the owner's editable headline and introduction, explores selected work or research, and can reach verified profiles, the public resume, and the contact form. If owner data is absent, the page shows a respectful empty state rather than invented claims.

### Visitor explores a GitHub-backed project

The visitor searches or filters projects, opens a stable project URL, sees synchronized GitHub facts separately from owner-authored context, and can safely read sanitized README content. Forks and archives are labeled.

### Owner publishes content

The owner signs in with mandatory MFA, creates or edits a draft, previews it, publishes it, and sees the public view update without a code deployment. The mutation creates an audit event and a recoverable revision where appropriate.

### Repository synchronization

A scheduled or owner-triggered job obtains a concurrency lease, paginates the official GitHub API, stages a complete observation, upserts repositories by stable GitHub ID, creates and auto-publishes newly discovered projects, preserves manual fields and hide overrides, and records outcome and rate-limit data. Destructive reconciliation only occurs after a complete successful observation.

### Owner uses private AI assistance

The owner selects authorized private sources and a drafting task, explicitly consents to processing, reviews source references and uncertainty in the result, edits or rejects the proposal, and separately approves any content change. The assistant cannot publish or perform unrestricted database operations.

## Functional requirements

### Public portfolio

- Routes: Home, About, Experience, Education, Research, Publications, Projects, Skills, Certifications/Achievements, Blog, Resume, Profiles, and Contact.
- All professional content is database-driven, ordered, and visibility-controlled.
- The homepage supports editable identity fields, calls to action, featured sections, and admin-controlled section order.
- Public pages support drafts and publication status without leaking preview or unpublished records.
- Dedicated detail pages exist for projects, research, publications, blog posts, and other suitable records.
- Missing data is omitted or represented by purposeful empty states.

### Administration

- Exactly one explicitly allow-listed administrator identity; no public registration.
- MFA is required before administrative access is considered complete.
- Server-side deny-by-default authorization protects pages, mutations, uploads, jobs, and private downloads.
- Content workflows support create, read, update, preview, publish, unpublish, archive, restore, reorder, and recoverable deletion where appropriate.
- Revision history and audit events cover sensitive and publication-changing actions.
- The admin console manages site settings, navigation, appearance constraints, SEO, media, inbox, integrations, and health information.

### GitHub synchronization

- One configurable GitHub username; never inferred.
- Discover all owned public repositories across every result page, including forks and archived repositories.
- Store stable GitHub repository IDs and verified metadata, language data, topics, dates, counts, links, and README content where available.
- Automatically publish newly discovered public repositories unless a persistent manual visibility override exists.
- Keep synchronized source fields separate from owner-authored enrichment fields.
- Handle rename redirects, updates, archives, deletion, and public-to-private transitions safely.
- Provide initial, scheduled (target: configurable 15 minutes), and manual synchronization with retries, idempotency, locking, caching, history, failure reporting, and rate-limit awareness.
- Never make public rendering depend on a live GitHub request.

### Resume and documents

- The selected current public resume has a preview, stable download action, mobile fallback, and cache invalidation on replacement.
- Resume versions support categories, public/private state, selection, archive, and deletion.
- Transcripts and reference documents remain private, use non-public object storage, and are only retrievable through authorized short-lived access or streamed endpoints.
- Uploads require size, extension, media type, signature, filename, authorization, and malware-processing controls appropriate to the file type.

### AI assistant

- Uses a real server-side provider selected by the owner, with explicit document selection and processing consent.
- Retrieval and drafting retain source references and distinguish supported facts from uncertainty.
- Prompt injection from documents is treated as untrusted content.
- Results are proposals only and require review plus a separate publish action.
- Cost, token, timeout, size, retry, retention, and deletion controls are observable.

### Contact, blog, profiles, and media

- Contact submissions are server-validated, length-limited, rate-limited, spam-protected, stored securely, and never act as an open relay.
- Blog content uses sanitized structured Markdown or an equivalently safe format; arbitrary executable HTML is forbidden.
- Profile links accept any number of owner-approved platforms, validate schemes and hosts as appropriate, and use safe external-link attributes.
- Media records distinguish public assets from private documents and store provenance, accessibility text, and lifecycle state.

## Nonfunctional requirements

- Security priority: use OWASP ASVS 5.0.0 as the named verification reference, targeting an explicitly selected Level 2 subset rather than claiming blanket compliance.
- Accessibility target: WCAG 2.2 AA, with automated checks and documented manual verification.
- Performance targets at the 75th percentile: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1; these remain targets until measured.
- Responsive support for phones, tablets, laptops, desktops, keyboard, and touch.
- Privacy-conscious data minimization, retention, export/deletion procedures, and redacted logs.
- Maintainability through a modular monolith, typed boundaries, migrations, tests, ADRs, and dependency review.
- Availability: cached/database-backed public content survives temporary GitHub, email, storage, and AI provider outages where feasible.

## Constraints

- No identity, history, URLs, metrics, results, or credentials may be fabricated.
- No secret may be committed or exposed to browser code.
- No deployment, provider purchase, domain change, account mutation, or confidential transfer is authorized by this document.
- Provider-specific claims remain unverified until selected and tested.
- The public site must not depend on the AI service.

## Acceptance summary

The complete product is accepted only when each critical requirement in `docs/requirements-traceability.md` has implementation evidence, relevant automated tests have executed, required manual checks are recorded, private document isolation is verified, and known limitations are documented. Visual completeness alone is insufficient.

## Risks

- Provider selection may constrain scheduled jobs, streaming uploads, PostgreSQL connectivity, and private object access.
- GitHub reconciliation can hide valid content if incomplete observations are mistaken for deletion.
- Private documents create high-impact authorization, storage, logging, and AI-retention risks.
- A single administrator increases account-recovery and lockout sensitivity.
- Rich Markdown and external media introduce XSS, SSRF, and tracking risks.
- Animation can undermine accessibility and Core Web Vitals if not budgeted.

## Open questions

See `docs/owner-decisions.md`. Missing biography and profile content is not an implementation blocker; editable empty states are required.

## Traceability

Requirement identifiers and their implementation/test mappings are maintained in `docs/requirements-traceability.md`. Backlog execution is maintained in `TASKS.md`.
