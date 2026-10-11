# Database Model Proposal

Status: Logical model; no migration has been generated.  
Database: PostgreSQL  

Implementation note (2026-10-09): the first Drizzle PostgreSQL migration is stored at `apps/portfolio/drizzle/0000_premium_forgotten_one.sql`. It covers the initial GitHub/project slice and has been inspected for bounded schema-only statements. It has not yet been applied to a live database.
Identifiers: UUIDv7 or provider-neutral UUID generated server-side unless an external stable identifier is the natural integration key.

## Conventions

- Every mutable record has `created_at`, `updated_at`, and an optimistic concurrency field such as `version` where concurrent edits matter.
- Publication-capable records use a shared enum: `DRAFT`, `PUBLISHED`, `UNPUBLISHED`, `ARCHIVED`.
- Recoverable content uses `deleted_at`; sensitive ephemeral data may be hard-deleted according to retention policy.
- User-visible ordering uses bounded integer `sort_order` with transactional reorder operations.
- External URLs are normalized and validated before storage.
- Timestamps use `timestamptz`; date-only professional fields use `date` or year/month components to avoid false precision.

## Identity and security

### `admin_users`

`id` PK, unique normalized `email`, external/auth subject (unique), display label, `status`, `mfa_required`, last login, timestamps. The application rejects any authenticated subject not active in this table.

### Auth-provider tables

Sessions, credentials, authenticators/TOTP, verification tokens, and recovery artifacts follow the selected maintained library's schema. Secrets and backup codes must be encrypted or irreversibly protected as the library specifies.

### `audit_logs`

Append-oriented `id`, actor, action, target type/id, request correlation ID, timestamp, redacted metadata JSON, outcome, and optional previous event hash. No raw document text, credential, token, or contact message body.

## Site composition

### `site_settings`

Singleton/versioned configuration: title, public origin, default metadata, navigation/footer settings, appearance choices constrained to approved tokens.

### `profiles`

Editable display name, headline, introduction, biography status fields, and public contact fields. Unknown fields remain null.

### `homepage_sections`

Stable section key (unique), enabled flag, sort order, layout variant, configuration JSON constrained by per-section schemas.

### `content_revisions`

`id`, record type/id, revision number, actor, snapshot JSON, reason, created timestamp. Unique `(record_type, record_id, revision_number)`. Snapshots follow retention and exclude large binary/private document contents.

## Portfolio content

Separate normalized tables: `experiences`, `education_records`, `research_projects`, `publications`, `skill_categories`, `skills`, `achievements`, `certifications`, `blog_posts`, `blog_categories`, `tags`, and `social_profiles`.

Common publication fields include status, published timestamp, archive/deletion timestamps, slug, SEO title/description, featured flag where applicable, and sort order. Join tables model project/skill, project/research, research/publication, education/certification, blog/tag, and related-content associations.

Rich content is stored as validated structured Markdown or a constrained editor document; rendered HTML is regenerated through a versioned sanitizer rather than trusted as authoritative input.

## GitHub and projects

### `github_accounts`

Singleton active account enforced by a partial unique index. Stores configured username, account stable ID once verified, sync enablement, and timestamps. Tokens remain in secret storage, never this table.

### `github_repositories`

- `github_id bigint` unique and immutable integration identity
- current name/full name, owner ID/login, URLs, description, topics, primary language
- stars, forks, GitHub creation/update/push timestamps
- `is_fork`, `is_archived`, observed visibility/state
- README raw Markdown plus content hash and source metadata
- first/last observed timestamps, last complete sync ID, consecutive miss count

Language breakdown uses `github_repository_languages(repository_id, language, bytes)` with a composite key.

### `projects`

Owner-managed record with optional unique `github_repository_id`, stable canonical slug, custom title, narrative fields, category, featured flag, sort order, publication state, and `visibility_override` (`INHERIT`, `FORCE_HIDDEN`, `FORCE_VISIBLE`). For GitHub-created projects, `INHERIT` publishes while the repository is verified public; `FORCE_HIDDEN` always wins.

### `project_slug_redirects`

Unique old slug -> project ID, preventing reuse and preserving links after rename.

### `github_sync_runs`

Trigger, start/end timestamps, status, pages/items observed, change counts, rate-limit metadata, error code/redacted message, complete-snapshot flag, lease owner/expiry, and correlation ID.

## Documents and media

### `media_assets`

Object key, storage class (`PUBLIC`, `PRIVATE`, `QUARANTINE`), media type, detected type, byte size, checksum, dimensions where applicable, alt text, owner, scan status, lifecycle state, timestamps. Object keys are opaque and unique.

### `resume_versions`

Media asset FK, label/category, public flag, selected-current flag, archive timestamp, safe filename. A partial unique index enforces at most one current public resume.

### `private_documents`

Private media FK, document type, owner label, processing permission state, retention state, extraction status, checksum, timestamps. No public slug.

### `document_processing_records`

Document FK, processor/version, status, started/completed timestamps, error code, extracted-content storage reference, deletion state. Extracted text must remain private and independently deletable.

## AI assistance

### `ai_processing_consents`

Admin, purpose, scope, selected document IDs via join table, provider policy version, granted/withdrawn timestamps.

### `ai_drafts`

Admin, consent FK, target content type/id, prompt summary (not confidential raw text), provider/model identifier, status (`REQUESTED`, `GENERATED`, `REVIEWED`, `REJECTED`, `APPLIED`), structured proposal, token/cost metadata where available, timestamps.

### `ai_draft_sources`

Draft FK, document processing/chunk reference, locator, support classification. This preserves traceability without copying unrestricted source content into public records.

## Contact and operations

### `contact_messages`

Validated sender fields, subject, encrypted/restricted message body as required by the selected threat model, status, spam score/provider result, source metadata minimized and retention expiry. Search may require a carefully scoped derived index rather than logging bodies.

### `job_runs`

Job type, idempotency key (unique per logical run), trigger, status, attempts, timestamps, safe diagnostics.

### `redirects`

Unique source path, safe internal destination, HTTP status, lifecycle timestamps. External open redirects are prohibited.

## Indexes and constraints

- Partial indexes on `status = 'PUBLISHED'` and `deleted_at IS NULL` for public queries.
- Unique canonical slugs among active records, plus reserved redirect slugs.
- Foreign keys default to `RESTRICT`; joins may cascade when both parents are deleted. GitHub source deletion never cascades to owner-authored projects.
- Check constraints enforce date ranges, URL length, nonnegative counters, valid sort bounds, and selected/current resume invariants.
- Case-insensitive unique indexes for emails and suitable slugs.

## Migration strategy

1. Generate reviewed SQL migrations in version control.
2. Test forward migrations against an empty database and a production-like snapshot.
3. Use expand/migrate/contract changes for destructive schema evolution.
4. Back up and document recovery before high-risk production migrations.
5. Never edit an applied migration; add a corrective migration.

## Retention notes

Retention durations require owner/legal input. The schema supports per-record expiry and deletion state; application jobs must make deletion observable and auditable without retaining the deleted sensitive payload in logs.
