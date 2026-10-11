# ADR 0003: Separate GitHub Source Data from Editorial Project Data

Status: Accepted  
Date: 2026-10-09

## Context

Synchronization must update verified GitHub facts without overwriting owner-authored descriptions or resurrecting a hidden project.

## Decision

Keep `github_repositories` as synchronized source records and `projects` as editorial/publication records connected by an optional foreign key. A tri-state visibility override is authoritative over inherited GitHub visibility.

## Consequences

- Sync becomes idempotent and manual edits are preserved.
- Public project queries must combine source state, project status, and visibility override correctly.
- Deleting or privatizing a repository does not destroy editorial history.
