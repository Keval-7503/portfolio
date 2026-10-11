# ADR 0006: Zero-Cost Provider Baseline

Status: Accepted for foundation  
Date: 2026-10-09

## Context

The owner requires all initial infrastructure and authentication to cost $0 and authorized engineering to choose free providers. The product still requires PostgreSQL, scheduled synchronization, private/public object storage, MFA, contact protection, email notifications, and a real AI boundary.

## Decision

- Host the Cloudflare-compatible application on Workers Free and use Cron Triggers for the target 15-minute GitHub schedule.
- Use Neon Free PostgreSQL through a Workers-compatible pooled or HTTP driver.
- Use separate Cloudflare R2 Standard buckets/bindings for public media, private documents, and quarantine.
- Self-host MIT-licensed Better Auth with an owner allow-list, mandatory TOTP, backup codes, and optional passkey.
- Use Turnstile Free plus server-side abuse controls for contact submission.
- Use Resend Free for notification only after sender verification; persistence does not depend on email delivery.
- Use Workers AI behind a provider abstraction with a hard free-quota ceiling. Keep private-document processing disabled until a model-specific privacy review is recorded.

## Consequences

- No paid overage or automatic upgrade is authorized. Limit exhaustion must degrade safely and surface an admin warning.
- Free tiers and their terms may change; limits require monitoring and periodic review.
- There is no production SLA. Backups/export and recovery remain essential.
- A custom domain is deferred unless the owner already controls one.
- Private malware scanning is not honestly available in the selected free stack; risky formats remain quarantined/blocked until a suitable private scanner is approved.
