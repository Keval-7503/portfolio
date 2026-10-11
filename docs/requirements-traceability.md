# Requirements Traceability Matrix

Status values describe evidence, not intent. `BASELINED` means the requirement is documented but not implemented.

| ID | Requirement | Source | Planned component | Verification | Task | Status |
|---|---|---|---|---|---|---|
| PUB-001 | Database-driven public routes and visibility controls | Master §§3–8, 13–18 | Public web, content service | E2E route/visibility suite | APP-201 | BASELINED |
| PUB-002 | Editable, reorderable homepage sections | Master §4 | Homepage composition service | Unit ordering + E2E publish | APP-202 | BASELINED |
| PUB-003 | Purposeful empty states; no fabricated identity | Master §§1.1, 3 | UI and serializers | Fixture review + E2E empty DB | APP-203 | BASELINED |
| GIT-001 | Exactly one configurable GitHub account | Master §9 | Integration settings | Schema constraint + integration test | GIT-301 | BASELINED |
| GIT-002 | Paginate all owned public repositories, forks and archives included | Master §§9.2–9.4 | GitHub client/sync service | Pagination and mapping tests | GIT-302 | BASELINED |
| GIT-003 | Auto-publish new repositories; manual hide wins | Master §§9.3, 9.8 | Reconciliation policy | New-repo + hidden-persistence tests | GIT-303 | BASELINED |
| GIT-004 | Separate synchronized and owner-authored fields | Master §9.8 | Database/project service | Sync overwrite regression test | GIT-304 | BASELINED |
| GIT-005 | Safe complete-snapshot deletion/private reconciliation | Master §9.7 | Reconciliation service | Partial/outage/deletion/private tests | GIT-305 | BASELINED |
| GIT-006 | Sanitized README; no arbitrary HTML or scripts | Master §9.5 | Markdown pipeline | Malicious Markdown security tests | SEC-403 | BASELINED |
| GIT-007 | Scheduled/manual sync, history, lock, retry, rate limits | Master §9.6 | Job runner/admin | Concurrency/idempotency/rate tests | GIT-306 | BASELINED |
| RES-001 | Current public resume preview and download | Master §10 | Resume service/public route | E2E preview/download/cache test | DOC-501 | BASELINED |
| DOC-001 | Transcripts never publicly accessible | Master §§7, 11 | Private document service | Anonymous/direct URL denial tests | DOC-502 | BASELINED |
| ADM-001 | Single-owner admin, no public registration, MFA required | Master §§20–21 | Authentication/authorization | Auth integration and E2E tests | IAM-101 | BASELINED |
| ADM-002 | Deny-by-default server authorization for every mutation | Master §21 | Policy boundary | Unauthorized mutation matrix | IAM-102 | BASELINED |
| ADM-003 | CRUD, publication workflow, archive/restore/reorder | Master §20.2 | Admin/content service | Unit + integration + E2E | ADM-601 | BASELINED |
| ADM-004 | Revision history and audit logging | Master §§20.3, 24 | Revision/audit services | Restore and audit integrity tests | ADM-602 | BASELINED |
| AI-001 | Explicit consent and selected-document access | Master §§11–12 | AI orchestration | Authorization/consent tests | AI-701 | BASELINED |
| AI-002 | Source-grounded proposals, never autonomous publication | Master §12 | Retrieval/draft workflow | Citation + approval-state tests | AI-702 | BASELINED |
| AI-003 | Prompt-injection, cost, timeout, and retention controls | Master §§12.5–12.6 | AI boundary | Adversarial and failure tests | AI-703 | BASELINED |
| CON-001 | Validated, rate-limited, spam-resistant contact form | Master §18 | Contact service | Validation/rate/abuse tests | CON-801 | BASELINED |
| SEC-001 | Private/public storage separation and upload validation | Master §§11, 24 | Storage/upload service | File signature and access tests | SEC-401 | BASELINED |
| SEC-002 | Secure headers, cookies, CSRF strategy, URL/SSRF controls | Master §§21, 24 | HTTP/application boundary | Header and attack tests | SEC-402 | BASELINED |
| ACC-001 | WCAG 2.2 AA target and reduced motion | Master §27 | Design system/all routes | axe + keyboard/manual checklist | QA-901 | BASELINED |
| PERF-001 | CWV targets measured, not assumed | Master §26 | Public app/observability | Lab + field measurement report | QA-902 | BASELINED |
| SEO-001 | Metadata, canonical, sitemap, robots, structured data | Master §28 | Public metadata | Crawl/metadata tests | APP-204 | BASELINED |
| OPS-001 | Monitoring, backups, recovery, structured redacted logs | Master §§24, 29 | Operations | Restore drill + log review | OPS-1001 | BASELINED |
| DOCS-001 | Required engineering documentation remains current | Master §30 | Repository process | Documentation review | GOV-001 | IN_PROGRESS |

## Evidence policy

- `IMPLEMENTED`: code and configuration exist.
- `TESTED`: relevant checks executed and recorded with command/date/result.
- `VERIFIED`: acceptance criteria, security/accessibility implications, and documentation have been reviewed; no required work remains for that item.
- Blocked tests stay visible; they are never reported as passes.
