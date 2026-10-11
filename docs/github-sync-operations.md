# GitHub synchronization operations

The portfolio reads public repository data for the configured GitHub account and stores it in PostgreSQL. Synchronization does not use a signed-in visitor, access connected apps, or write to GitHub.

## Unattended writer

- Send `POST /api/internal/github-sync` with `Authorization: Bearer <service secret>`.
- Configure `GITHUB_SYNC_SECRET` only in the hosted secret manager. It must be at least 32 characters and must never be placed in source, logs, schedule prompts, or browser code.
- The endpoint has one narrow capability: read the configured account's public GitHub profile/repositories and update their corresponding synchronization records.
- A database lease permits only one active run for an account. A competing request returns `409` with `status: busy` and performs no repository reconciliation.

## Source and schedule

- Source: GitHub's official public REST API for the owner configured by `GITHUB_USERNAME` and stable `GITHUB_ACCOUNT_ID`.
- Suggested production cadence: every six hours. Do not activate a hosted schedule until the deployment security gate is cleared and the endpoint is verified through its hosted service access.
- The API client makes at most two retries for network failures and transient HTTP `408`, `429`, `502`, `503`, and `504` responses. Delays are bounded; authentication and validation failures are not retried.

## Readback and failure behavior

After a successful run, read back the public homepage and the latest `github_sync_runs` row. A complete snapshot may update repository facts and mark absent repositories missing. Failed, partial, or overlapping runs never infer deletion. Owner-authored project fields remain separate and are not overwritten.

Operational responses contain only status and counts. Secrets, authorization headers, and GitHub response payloads are excluded from errors and logs.
