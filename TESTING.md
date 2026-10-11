# Testing Strategy

## Evidence rule

Every recorded test result includes date, environment, exact command or manual procedure, pass/fail/blocked counts, and relevant artifact path. A skipped or blocked test is never a pass.

## Layers

- Unit: validation, publication/visibility policy, date handling, URL rules, mapping, reconciliation, Markdown policy, file metadata, authorization helpers.
- Integration: PostgreSQL transactions, auth adapter, publication and revision flows, GitHub sync with recorded fixtures, storage access, resume selection, contact handling, AI approval state machine.
- End-to-end: critical public routes and admin flows in a production-like runtime.
- Security: authorization matrix, CSRF, XSS, malicious Markdown, SSRF, upload confusion, private object denial, rate limits, session expiry/revocation, prompt injection, secret scans.
- Accessibility: automated axe-style checks plus manual keyboard, focus, zoom/reflow, reduced motion, contrast, touch targets, dialogs, forms, and representative screen reader tests.
- Performance: controlled Lighthouse/lab runs and real-user monitoring if approved; record conditions and percentiles.

## Critical suites

GitHub fixtures must cover initial multi-repository import, an additional repository, pagination, rename, README and metadata updates, fork/archive labels, deletion/private transitions, outage, rate limiting, partial response, duplicate/concurrent sync, owner enrichment preservation, and hidden-project persistence.

Private-document suites must prove anonymous and improperly authorized users cannot list, fetch, infer, cache, or access objects directly; deletion must cover derivatives.

## Quality commands

Commands will be added after framework scaffolding and must include formatting check, lint, type check, unit/integration tests, production build, E2E tests, accessibility smoke, dependency audit, and secret scan where tooling permits.

## Manual release checklist

- Real keyboard navigation and visible focus.
- Admin MFA enrollment, recovery, revocation, and logout.
- Publication/unpublication and cache invalidation.
- Resume preview/download on desktop and mobile.
- Private object access denial with copied URLs.
- GitHub outage while public project pages remain available.
- Contact delivery failure while submission remains recoverable.
- Backup restoration drill in a non-production environment.

## Executed evidence — 2026-10-09

| Check | Result | Notes |
|---|---|---|
| `npm run typecheck` | PASS | Strict TypeScript completed without errors after the framework/security upgrades. |
| `npm run lint` | PASS | ESLint completed without findings. |
| `npm run build` | PASS | Vinext/Vite completed all five Cloudflare-compatible build stages. Route classification remains reported as unknown by Vinext static analysis. |
| Local production request | PASS | After the dependency upgrades, `/` returned HTTP 200 with 25,380 bytes; rendered HTML contained the robot asset reference. |
| `npm audit --omit=dev` | FAIL / KNOWN | Four moderate findings remain in the Drizzle Kit → deprecated esbuild-kit development chain. Critical/high findings were remediated. A forced breaking downgrade was rejected. |
| Browser visual QA | NOT RUN | No user-facing preview/browser tool was available in this environment. |
| Automated accessibility/E2E | NOT RUN | Tooling has not yet been installed; tracked by FND-002 and QA-901. |

## GitHub identity increment — 2026-10-09

| Check | Result | Notes |
|---|---|---|
| Official GitHub public API identity lookup | PASS | Owner-supplied login resolved to `Keval-7503`, stable account ID `80451128`, account type `User`. |
| Public owned repository enumeration | PASS | One API page returned nine public repositories; the local snapshot preserves IDs, URLs, descriptions, language, topics, license, fork/archive state, and update time where supplied. |
| `npm run typecheck` | PASS | Snapshot and repository rendering compile under strict TypeScript. |
| `npm run lint` | PASS | No ESLint findings. |
| `npm run build` | PASS | All five Vinext production build stages completed. |
| Updated local production request | PASS | `/` returned HTTP 200 with 37,045 bytes and contained the verified display name and repository content. |

## GitHub persistence increment — 2026-10-09

| Check | Result | Notes |
|---|---|---|
| PostgreSQL migration generation | PASS | Initial five-table migration generated; a second generation reported no schema changes. |
| Live GitHub client validation | PASS | Credential-free request returned login `Keval-7503`, account ID `80451128`, nine repositories on one page, no ownership mismatch, an ETag, and rate-limit metadata. |
| Conditional GitHub request | PASS | Reusing the collection ETag produced the expected not-modified result and zero repository reprocessing. |
| Source/editorial isolation review | PASS | Repository synchronization updates only `github_repositories`; existing `projects` rows use conflict-do-nothing and retain owner-authored fields. |
| Live database migration/sync | PASS | Completed in the later live-Neon increment below. |

## Live Neon and database-backed homepage — 2026-10-09

| Check | Result | Notes |
|---|---|---|
| Secure migration verification | PASS | Owner-run verifier confirmed `github_accounts`, `github_repositories`, `github_sync_runs`, `project_slug_redirects`, and `projects`. |
| Bootstrap GitHub synchronization | PASS | Stored one account, nine repositories, nine projects, zero missing repositories, and one successful run. |
| HTTP-driver failure handling | PASS | Unsupported transaction attempt created no repository rows and was recorded as failed; implementation changed to idempotent staged writes with absence reconciliation last. |
| Database-backed production request | PASS | `/` returned HTTP 200, contained verified repository content, identified the synchronized database source, and did not identify snapshot fallback. |
| Local secret cleanup | PASS | Temporary Worker environment copies were removed after validation; the original ignored `.env` remains. |

## GitHub synchronization hardening â€” 2026-10-09

| Check | Result | Notes |
|---|---|---|
| `npm run github:test` | PASS | Fixture checks proved a transient `503` is retried, `401` is not retried, and bearer credential comparison accepts only the exact service secret. |
| Additive database migration | PASS | Migration `0001_brown_groot.sql` added the account lease owner/expiry fields and expiry index to live Neon; repeat generation reported no drift. |
| `npm run github:test:lease` | PASS | Two simultaneous atomic acquisition attempts produced exactly one winner; release cleared both lease fields, and a deliberately expired lease was reclaimable. |
| Conditional live sync | PASS | The post-migration sync returned `not_modified`; one account, nine repositories, and nine projects remained intact with no missing records. |
| `npm run typecheck` | PASS | Strict TypeScript completed with incremental cache output disabled to avoid the pre-existing locked cache file. |
| `npm run lint` | PASS | ESLint completed without findings. |
| `npm run build` | PASS | Production build included `/api/internal/github-sync`; the Windows build cache required a clean privileged regeneration because old generated files were locked. |
| Local production HTTP | PASS | `/` returned 200 using the database source; unconfigured `POST /api/internal/github-sync` failed closed with 503; `GET` returned 405. |
| Hosted authenticated trigger | NOT RUN | No deployment or hosted service secret has been authorized. Activation remains behind the deployment security gate. |

## Owner authentication foundation â€” 2026-10-09

| Check | Result | Notes |
|---|---|---|
| Auth schema migration | PASS | Additive migrations `0002_cold_nocturne.sql` and `0003_spotty_gwen_stacy.sql` created the Better Auth user/session/account/verification/TOTP/rate-limit tables plus the single-active-admin policy table in live Neon and aligned the rate-limit schema with runtime validation. |
| `npm run admin:test` | PASS | Live schema validation passed; public registration stayed closed and a direct unauthorized bootstrap call created no user record. |
| `npm run typecheck` | PASS | Strict TypeScript accepted the server/client auth integration and protected routes. |
| `npm run lint` | PASS | ESLint completed without errors; navigation warnings were removed before final verification. |
| `npm run build` | PASS | Production build includes the owner login, TOTP challenge/enrollment, protected admin page, and catch-all auth API route. |
| Local public/login HTTP | PASS | `/` and `/admin/login` both returned 200; the public page remained database-backed. |
| Owner bootstrap | PASS | Owner completed the local secure setup; runtime settings are present and live Neon contains exactly one auth user, one credential account, and one active admin record. No password was read or logged. |
| Restarted auth health check | PASS | Anonymous `/api/auth/get-session` returned HTTP 200 with no session and `/admin/login` returned HTTP 200 after the runtime reloaded the new settings. |
| MFA browser flow | PASS | Owner completed sign-in, authenticator enrollment, and TOTP verification locally. Runtime logs showed successful enable/verify requests and protected admin navigation; live data contains one MFA-enabled owner and one factor record. No password, secret, backup code, or TOTP value was read or logged. |
| Anonymous admin denial | PASS | An unauthenticated `GET /admin` returned HTTP 307 with `Location: /admin/login`. |
| Protected dashboard build | PASS | The owner-only dashboard compiles and reads live project, repository, account, and sync health data. Typecheck, lint, and the five-stage production build passed; `/` and `/admin/login` returned HTTP 200 after restart. |

## Public project detail increment — 2026-10-09

| Check | Result | Notes |
|---|---|---|
| `npm run typecheck` | PASS | Published-project data access, metadata, route parameters, and homepage links pass strict TypeScript. |
| `npm run lint` | PASS | ESLint completed without findings. |
| `npm run build` | PASS | The five-stage production build includes dynamic `/projects/:slug`. |
| Representative project routes | PASS | Two database-backed project pages returned HTTP 200 with record-specific titles and verified-source content. |
| Unknown project denial | PASS | `/projects/does-not-exist` returned HTTP 404. The query also excludes drafts, forced-hidden projects, and missing repositories. |
| Homepage detail links | PASS | Rendered homepage HTML contains internal links to the synchronized project slugs. |

## Safe Markdown increment — 2026-10-09

| Check | Result | Notes |
|---|---|---|
| `npm run markdown:test` | PASS | Malicious fixture proved raw HTML is escaped, unsafe schemes are not linked, remote images are not loaded, and safe HTTPS links remain usable. |
| `npm run typecheck` | PASS | Central Markdown renderer and project-page integration pass strict TypeScript. |
| `npm run lint` | PASS | ESLint completed without findings. |
| `npm run build` | PASS | All production build stages completed with safe owner-published project notes integrated. |

## GitHub README ingestion — 2026-10-09

| Check | Result | Notes |
|---|---|---|
| README schema migration | PASS | Additive migration `0004_complete_tana_nile.sql` added nullable Markdown and fetch-time fields to live Neon. |
| Live README import | PASS | Nine public repositories were checked; eight READMEs were stored and one absent README remained a safe empty state. Individual payloads are capped at 500 KB. |
| Combined quality batch | PASS | Markdown security fixture, strict TypeScript, ESLint, and the five-stage production build all passed. |
| Live rendering | PASS | A README-backed project and a second project returned HTTP 200; the first rendered the safe Markdown container and no injected script markup. |

## Request security foundation — 2026-10-09

| Check | Result | Notes |
|---|---|---|
| `npm run security:test` | PASS | Same-origin mutation accepted; cross-origin and originless mutations denied; unsafe, credential-bearing, private, and lookalike provider URLs rejected. |
| Combined quality batch | PASS | Markdown fixture, strict TypeScript, ESLint, and production build passed. |
| Live security headers | PASS | Public response includes enforced CSP, permissions policy, referrer policy, nosniff, and frame denial. Admin login returns `Cache-Control: private, no-store`. |
| HSTS | NOT RUN | Intentionally deferred until a real HTTPS domain and redirect behavior are verified. |

## Secure project editor foundation — 2026-10-09

| Check | Result | Notes |
|---|---|---|
| Combined quality batch | PASS | Security helper test, strict TypeScript, ESLint, and production build passed. Build contains protected editor and mutation routes. |
| Anonymous editor access | PASS | Direct project editor request returned HTTP 307 to `/admin/login`. |
| Anonymous mutation denial | PASS | Same-origin anonymous PATCH returned HTTP 401 with private/no-store caching. |
| Cross-origin mutation denial | PASS | Cross-site PATCH returned HTTP 403 before authentication or input processing. No project data was changed. |
| Authenticated edit lifecycle | PARTIAL PASS | Owner save returned HTTP 200 and created a prior-state revision. Restore remains pending. |

## Revision and audit foundation — 2026-10-09

| Check | Result | Notes |
|---|---|---|
| Revision/audit migration | PASS | Additive migration `0005_windy_salo.sql` created indexed `project_revisions` and `audit_events` tables with owner attribution foreign keys. |
| Combined quality batch | PASS | Strict TypeScript, ESLint, security helper tests, and all production build stages passed. |
| Restore authorization | PASS | Cross-origin restore returned 403; same-origin anonymous restore returned 401. Both tables remained empty, proving denial before writes. |
| Authenticated revision integrity | PARTIAL PASS | One authenticated update created one attributable, redacted audit event and one prior-state revision. No restore event exists yet. |

## Authenticated editor and session-security increment — 2026-10-09

| Check | Result | Notes |
|---|---|---|
| Authenticated project save | PASS | Owner save returned HTTP 200 and created one prior-state revision plus one attributable update audit event. Audit metadata contains field names only. |
| Authenticated project restore | PASS | Owner restored the recorded revision; the protected endpoint returned HTTP 200. |
| `npm run admin:verify-audit` | PASS | Live data reports one update, one restore, two revisions, actor attribution, and redacted metadata. |
| Session security implementation | PASS | Protected `/admin/security` lists active devices, supports revoking all other sessions, and changes the password with other-session revocation. Better Auth freshness rules protect these sensitive operations. |
| Combined quality batch | PASS | Strict TypeScript, ESLint, and the five-stage production build completed successfully. The local preview restarted at `http://127.0.0.1:8787`. |

## Search and crawl controls — 2026-10-09

| Check | Result | Notes |
|---|---|---|
| Homepage metadata | PASS | HTTP 200 response contains an absolute canonical and escaped Person JSON-LD. |
| Project metadata | PASS | Representative published project contains a canonical and SoftwareSourceCode JSON-LD. |
| Dynamic sitemap | PASS | `/sitemap.xml` returned HTTP 200 with all nine currently published project URLs. |
| Robots controls | PASS | `/robots.txt` excludes `/admin/` and `/api/`; admin responses also send `X-Robots-Tag: noindex, nofollow, noarchive`. |
| Combined quality batch | PASS | Strict TypeScript, ESLint, and the five-stage production build passed. |

## Session lifecycle and unified quality gates — 2026-10-09

| Check | Result | Notes |
|---|---|---|
| `npm run admin:test:sessions` | PASS | Neon fixture proved ten-minute freshness calculation, expired-session exclusion, other-session revocation, and current-session preservation; fixture data was removed. |
| Session mutation denial | PASS | Originless and cross-site DELETE returned 403; same-origin anonymous DELETE returned 401; anonymous security page returned 307 to login. |
| `npm run quality` | PASS | Formatting, ESLint, strict TypeScript, unit/security fixtures, and high-confidence source secret scan passed as one command. |
| `npm run test:integration` | PASS | Auth boundary, session lifecycle, audit integrity, and GitHub lease concurrency passed against Neon. |
| `npm run test:e2e` | PASS | Public routes, metadata, crawl files, project 404, and admin denial passed against the production-like local Worker. |
| `npm run audit:dependencies` | PASS WITH KNOWN MODERATES | No high/critical production finding. Four moderate findings remain in the Drizzle Kit development chain; the offered fix is a breaking downgrade. |
| GitHub Actions workflow | IMPLEMENTED | Read-only workflow runs install, unified quality, and production build on pull requests and main pushes. Hosted execution awaits source-control setup/push. |

## Diagnostics foundation — 2026-10-09

| Check | Result | Notes |
|---|---|---|
| `npm run observability:test` | PASS | Valid correlation IDs are retained, invalid IDs are replaced, nested secret keys are redacted, and credential-bearing URL/Bearer values do not survive serialization. |
| Request correlation | PASS | Public responses include generated UUID request IDs; a valid caller ID is forwarded and returned unchanged. |
| `/api/health` | PASS | HTTP 200 with a minimal no-store liveness body and request ID. |
| `/api/ready` | PASS | HTTP 200 after a live Neon probe; response exposes only `database: ready`, while structured logs contain safe outcome and latency fields. |
| Error boundaries | PASS | Route, global, and 404 boundaries compile with generic user-safe messages and no raw exception output. |
| Combined quality/build | PASS | Unified quality gate and all five production build stages pass with diagnostics routes included. |

## Configurable homepage composition — 2026-10-09

| Check | Result | Notes |
|---|---|---|
| Migration `0006_melted_lady_mastermind.sql` | PASS | Live Neon contains five seeded stable homepage section records with bounded order values. |
| `npm run homepage:test` | PASS | Reversible integration test changed order/visibility, read the exact persisted state, rejected duplicate positions, and restored the original configuration. |
| Mutation authorization | PASS | Originless and cross-site PUT returned 403; same-origin anonymous PUT returned 401. |
| Public composition | PASS | Homepage returned HTTP 200 with database-configured flex composition and expected visible section anchors. |
| Combined quality/build | PASS | Formatting, lint, strict TypeScript, unit/security checks, secret scan, and all production build stages passed. |

## Required public routes — 2026-10-09

| Check | Result | Notes |
|---|---|---|
| Required information architecture | PASS | Home, About, Experience, Education, Research, Publications, Projects, Skills, Certifications, Achievements, Blog, Resume, Profiles, and Contact returned HTTP 200. |
| Projects index | PASS | Database-backed `/projects` rendered all nine currently published synchronized projects and linked to stable detail routes. |
| Truthful empty states | PASS | Routes without reviewed records explicitly report that nothing is published/selected/available; no professional history or credential claims were invented. |
| Unknown section denial | PASS | Unrecognized top-level section returned HTTP 404. Existing project publication/visibility filters continue to fail closed. |
| Shared navigation and metadata | PASS | Every required route includes semantic shared navigation and a route-specific canonical; sitemap includes the full public IA and published project details. |
| Expanded `npm run test:e2e` | PASS | Required routes, health/readiness, crawl controls, project detail, unknown routes, and admin denial passed against the local production Worker. |
| Combined quality/build | PASS | Formatting, ESLint, strict TypeScript, unit/security checks, secret scan, and all five build stages passed. |

## Private upload quarantine foundation — 2026-10-09

| Check | Result | Notes |
|---|---|---|
| Migration `0007_nervous_loners.sql` | PASS | Live Neon contains constrained media metadata, scan/lifecycle/storage enums, opaque object-key uniqueness, SHA-256 uniqueness, owner attribution, and a 5 MB database size guard. |
| `npm run upload:test` | PASS | Valid minimal PDF accepted; unsafe extension, media mismatch, executable signature, truncated PDF, active-content marker, and oversized payload fixtures rejected. Filename normalization and SHA-256 output verified. |
| Storage isolation | PASS | Local Worker exposes a private R2 binding only. Objects use opaque quarantine keys and `application/octet-stream`; no public object route or URL is generated. Direct quarantine-style HTTP path returned 404. |
| Upload authorization | PASS | Originless and cross-site POST returned 403; same-origin anonymous POST returned 401 before multipart parsing. Anonymous document manager access redirected to login. |
| Failure handling | PASS | Database-write failure triggers best-effort R2 deletion; quarantined deletion removes the object before metadata. No uploaded bytes or filenames enter operational logs. |
| Combined quality/build | PASS | Formatting, ESLint, strict TypeScript, upload/security/unit checks, secret scan, and all production build stages passed with R2 and protected upload routes. |
| Local malware scan | PASS | Three owner-uploaded PDFs were exported from local R2 into random temporary paths, SHA-256 verified, scanned without remediation by Microsoft Defender signature `1.459.641.0`, and marked clean with audit events. Temporary copies were deleted; files remained quarantined pending explicit promotion. This does not approve a production scanner. |
| Clean-file promotion | IMPLEMENTED | Fresh-MFA, same-origin owner controls can move a clean transcript to the private namespace or explicitly publish a clean résumé as current. R2 copy precedes an atomic Neon metadata/audit batch; failures delete the destination copy. Interactive owner promotion remains. |

## Résumé and private-document access foundation — 2026-10-09

| Check | Result | Notes |
|---|---|---|
| Migration `0008_mixed_firestar.sql` | PASS | Live Neon contains résumé versions and private-document records with media foreign keys, typed processing/retention/extraction states, and a partial unique constraint for one current public résumé. |
| `npm run documents:test` | PASS | Reversible Neon fixtures proved quarantined records never resolve, clean private assets resolve only through the private filter, and current public résumés resolve only from clean public assets. All fixtures were removed. |
| Public résumé endpoint | PASS | Before selection, `/api/resume/current` returned 404. After the owner explicitly promoted a scanned résumé, it returned HTTP 200 with the expected 44,469-byte PDF, safe inline filename, and public cache policy. |
| Private retrieval denial | PASS | Anonymous request to an owner document download endpoint returns 401; no object key or metadata is disclosed. Direct quarantine-style paths return 404. |
| Response policy | PASS | Authorized private downloads are attachment-only, PDF/nosniff, private/no-store, noindex, and use sanitized ASCII filenames. Public résumé responses use stable routes, ETags, and bounded revalidation caching. |
| Combined verification | PASS | Unified quality, Neon integration, production build, and expanded local Worker E2E pass. |
| Clean-object R2 retrieval/deletion | PARTIAL | Promotion copied all three clean objects into purpose-specific namespaces and removed quarantine copies. Public résumé R2 retrieval passed; authenticated private download and derivative deletion remain. |

## Owner document promotion — 2026-10-09

| Check | Result | Evidence |
|---|---|---|
| Explicit promotion | PASS | After fresh password and MFA verification, the owner published one clean résumé and accepted two clean transcripts into private storage; all three protected promotion calls returned HTTP 200. |
| Public résumé retrieval | PASS | `/api/resume/current` returned HTTP 200, `application/pdf`, safe inline filename `keval_patel_Resume.pdf`, public cache policy, and the expected 44,469 bytes from R2. |
| Private retrieval UI | PASS | The owner confirmed the transcript download controls; runtime evidence recorded an authenticated HTTP 200 private-document retrieval. The endpoint remains owner-authorized with `private, no-store`. |
| Résumé cache invalidation policy | PASS | The live stable resolver returned the selected 44,469-byte PDF with its checksum ETag and `Cache-Control: public, max-age=0, must-revalidate`, forcing cache revalidation after replacement or deletion. |
| Permanent deletion controls | IMPLEMENTED | Every managed document exposes an explicit confirmation control. The protected endpoint requires same-origin fresh MFA, deletes R2 bytes first, atomically removes registration/metadata, and appends a redacted audit event. No derived records currently exist. Isolated destructive E2E remains. |

## Project lifecycle completion — 2026-10-09

| Check | Result | Evidence |
|---|---|---|
| Reversible lifecycle integration | PASS | A temporary owner-authored project was created as a private draft, denied by public lookup, published, archived and denied again, restored from revision, permanently deleted, audited, then cleaned of fixture audit records. |
| Deletion boundary | PASS | Permanent deletion is available only for manual projects after confirmation and fresh MFA. GitHub-synchronized projects return a source-managed conflict and remain hide/archive-only. |
| Private preview | PASS | Protected preview route renders draft summary and body through the centralized safe Markdown renderer without making the draft publicly addressable. |
| Combined checks/build | PASS | Strict TypeScript, ESLint, Markdown/security suites, lifecycle integration, and all production build stages passed. |

## Contact and inbox foundation — 2026-10-09

| Check | Result | Evidence |
|---|---|---|
| Migration and submission | PASS | Migration `0009_mean_morlun.sql` applied. A reversible same-origin validated message returned HTTP 201, persisted through the real Neon path, and was deleted after verification. |
| Abuse foundation | PASS | Schema/input bounds, hidden honeypot, keyed request-identifier hashes, and a five-message-per-hour database limit are active. Turnstile remains before production acceptance. |
| Private inbox | PASS | Owner verified a real public submission and protected inbox display. The latest 100 messages support read, archive, and restore states without placing message bodies in operational logs. |
