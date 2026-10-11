# ADR 0004: Isolate Private Documents from Public Media

Status: Accepted  
Date: 2026-10-09

## Context

Transcripts and source documents must not become public through predictable URLs, bucket configuration mistakes, shared CDN caching, or generic media APIs.

## Decision

Use separate public and private storage policies (preferably separate buckets), opaque keys, quarantine-before-acceptance, and authorized short-lived or streamed private retrieval. Private documents have no public slug or public asset route.

## Consequences

- Storage configuration and access-denial tests become release gates.
- Public media workflows cannot be reused blindly for private documents.
- Deletion must cover originals, derived text, embeddings/indexes, and cached access artifacts.
