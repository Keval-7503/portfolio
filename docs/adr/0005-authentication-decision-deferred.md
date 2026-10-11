# ADR 0005: Defer Authentication Provider Selection

Status: Proposed / owner decision required  
Date: 2026-10-09

## Context

The product requires a single allow-listed administrator, mandatory MFA, secure session lifecycle, recovery, rate limiting, and sensitive-operation reauthentication. Provider choice changes cost, privacy, schema, runtime compatibility, and operational ownership.

Current official Better Auth documentation demonstrates TOTP, backup codes, lockout, passkeys, session integrations, and a Next.js example. Managed providers may reduce credential operations but add vendor/data dependencies.

## Decision

Do not implement a custom authentication system or select a provider silently. Evaluate Better Auth and at least one managed provider against runtime compatibility, MFA enforcement, passkeys, recovery, session revocation, auditability, exportability, privacy, cost, and maintenance. The owner approves the final choice.

## Consequences

- Public, schema-independent work may proceed.
- Admin implementation and auth schema migration wait for OD-003.
- No login mock may be represented as secure authentication.
