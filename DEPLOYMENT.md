# Deployment Decision and Runbook Outline

Deployment is prepared but remains inactive until the owner configures the GitHub `production` environment, required Cloudflare/Neon secrets, and `PRODUCTION_ORIGIN`. The workflow is manual-only and does not grant itself write access to repository contents.

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

## Rollback

Application rollback must not assume a destructive database downgrade. Prefer backward-compatible expand/contract migrations and forward fixes. Object changes use versioned keys. Provider-specific rollback commands will be added only after selection and testing.

## Recovery

Define target RPO/RTO with the owner, schedule encrypted backups, restrict restore credentials, and run documented restoration drills. A configured backup without a successful restore test is not verified recovery.
