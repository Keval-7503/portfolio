# Deployment Decision and Runbook Outline

The owner-authorized free-tier production deployment is active at `https://portfolio.kevalpatel.workers.dev`; its admin entry point is `/admin`. It uses Cloudflare Workers Free, an R2 bucket enabled under its free allowance, and the existing Neon database. No paid feature was activated. The GitHub `production` environment remains an optional follow-up for repeatable workflow-driven releases; the initial release was performed through authenticated local Wrangler after the same quality, audit, build, migration-state, and smoke gates.

Source repository: `https://github.com/Keval-7503/portfolio`. The first hosted quality run exposed an over-broad ignore rule that omitted required Vite helper source. After including that source and upgrading to Next.js 16.4.1, replacement quality run `38815019371` passed on a clean Ubuntu runner. The renamed production Worker version `d825f4c5-78ba-4345-84d3-62bf7131d1fc` passed database readiness and all six public/private smoke checks on 2026-10-15; the public resume returned the expected 44,469-byte PDF and `/admin` redirected to the login route on the new origin.

## Provider capabilities required

- Supported server-rendered runtime for the selected framework.
- Scheduled jobs near the target 15-minute interval or a documented feasible alternative.
- Secure PostgreSQL connectivity, migrations, backups, point-in-time recovery options, and restore procedures.
- Public and private object storage policies, signed access, lifecycle rules, and regional controls.
- Environment-scoped secret management.
- TLS, custom domains, security headers, logs, monitoring, and alert integrations.
- Preview/staging isolation from production data and credentials.

## Release sequence

1. Review change, migration, dependency, and provider impact.
2. Run static checks, tests, security scans, and production build.
3. Back up before risky migrations and confirm rollback/forward-fix plan.
4. Apply migrations with least-privilege credentials.
5. Deploy immutable build artifact.
6. Execute smoke tests for public, admin, private access denial, contact, resume, and job health.
7. Observe error/security telemetry and document actual result.

## GitHub production environment

Required secrets: `DATABASE_URL`, `CLOUDFLARE_API_TOKEN`, and `CLOUDFLARE_ACCOUNT_ID`. The Cloudflare token must be scoped only to the target account/Worker resources. Runtime application secrets are managed in Cloudflare rather than copied into build logs. Required environment variable: `PRODUCTION_ORIGIN`.

The manual `.github/workflows/deploy.yml` workflow runs quality, dependency audit, production build, additive migrations, Worker deployment, and public/private smoke checks. Configure environment approval so a deployment cannot begin from an unreviewed click.

Cloudflare string settings are encrypted Worker Secrets. The generated Worker explicitly enables `nodejs_compat_populate_process_env` and the application accepts either Cloudflare's importable environment binding or its supported `process.env` projection. R2 remains a native non-string binding. Three owner-approved documents were copied from local Miniflare storage to private production R2 under their existing opaque keys; byte counts and SHA-256 digests matched after remote retrieval, and temporary transfer files were deleted.

## Rollback

Application rollback must not assume a destructive database downgrade. Prefer backward-compatible expand/contract migrations and forward fixes. Object changes use versioned keys. Provider-specific rollback commands will be added only after selection and testing.

## Recovery

Define target RPO/RTO with the owner, schedule encrypted backups, restrict restore credentials, and run documented restoration drills. A configured backup without a successful restore test is not verified recovery.
