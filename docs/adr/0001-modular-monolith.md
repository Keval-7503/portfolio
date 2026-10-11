# ADR 0001: TypeScript Modular Monolith

Status: Accepted for initial implementation  
Date: 2026-10-09

## Context

The product has broad domain scope but only one owner and one public application. Independent services would add deployment, consistency, observability, cost, and security complexity before scale evidence exists.

## Decision

Build one TypeScript application with explicit domain modules, service-level authorization boundaries, PostgreSQL transactions, and separately invokable job handlers.

## Consequences

- Public site, admin, jobs, and AI orchestration can share types and transactions.
- Module boundaries must be enforced through code review and tests rather than network isolation.
- A future service can be extracted only when measured scaling, isolation, or availability needs justify it.
