# ADR 0002: PostgreSQL as System of Record

Status: Accepted  
Date: 2026-10-09

## Context

The domain requires relational integrity, publication workflows, revisions, many-to-many links, safe synchronization, transactions, and indexed public queries.

## Decision

Use managed PostgreSQL with version-controlled migrations. Store binary objects in object storage and retain only metadata and access state in PostgreSQL.

## Consequences

- Strong constraints and transactions support synchronization and publishing correctness.
- The hosting choice must provide secure PostgreSQL connectivity compatible with its runtime.
- A provider and region remain owner decisions.
