# Operations runbook

## Service objectives

- Target recovery point: 24 hours for owner-authored PostgreSQL data; GitHub-derived records are rebuildable.
- Target recovery time: 4 hours during owner availability.
- Budget: $0. Free-tier retention is monitored and is not represented as guaranteed archival backup.

## Monitoring and alerts

- Cloudflare Worker observability receives structured redacted logs.
- `/api/health` checks process liveness; `/api/ready` checks the Neon path without exposing schema or credentials.
- GitHub sync history is durable in PostgreSQL. Its six-hour cron emits a generic HTTPS webhook alert on failure when `GITHUB_SYNC_ALERT_WEBHOOK_URL` is configured.
- Contact submissions are stored before notification, so Resend failure does not lose the message.
- During an incident, preserve request IDs and timestamps only; never paste cookies, document text, contact bodies, bearer values, or database URLs into tickets.

## Backup and restore

1. Before deployment or a risky migration, create a Neon branch/restore point if the active free plan supports it and export a logical PostgreSQL backup to owner-controlled encrypted storage.
2. Record UTC time, migration version, checksum, and operator without storing the backup or credentials in this repository.
3. Restore into an isolated Neon branch/database, never over the active database.
4. Apply migrations, run `npm run db:verify:secure`, then `npm run operations:test` against the isolated target.
5. Verify public publication filters, current résumé registration, private-document metadata counts, and owner login. Delete the drill environment after recording non-sensitive evidence.

The repository's automated restore drill uses a reversible owner-content snapshot in the configured database. It proves snapshot fidelity and exact restoration but does not replace a provider-level disaster-recovery drill.

## Incident response

1. Contain: disable the affected integration/secret or route; preserve public read availability where safe.
2. Assess: use request IDs, redacted Worker logs, audit events, sync/job history, and provider status.
3. Recover: rotate exposed secrets, deploy a forward fix, restore only into an isolated target, and smoke test.
4. Notify: the owner decides whether affected people/providers require notification based on confirmed scope.
5. Review: record timeline, root cause, impact, corrective actions, and recurrence tests without private payloads.

## Production document scanning

For this low-volume, owner-only $0 portfolio, the approved private workflow is Microsoft Defender on the owner's trusted Windows workstation. Set a least-privilege Cloudflare credential and the production `DATABASE_URL`, confirm current Defender signatures, set `ALLOW_REMOTE_DOCUMENT_SCAN=confirmed`, then run `npm run documents:scan:remote`. The command downloads each opaque quarantined object to a random OS temporary directory, verifies its stored SHA-256 checksum, scans without remediation, records only scanner/version/checksum metadata, and removes the temporary directory. Any download, checksum, signature-age, scanner, or audit failure leaves the asset pending and unpublishable. Never use VirusTotal or another public multi-scanner for private documents.

## Release smoke

Run `npm run operations:smoke -- http://127.0.0.1:8787` locally or with the deployed HTTPS origin. It verifies public, liveness, readiness, robots, anonymous admin denial, and private-document denial.
