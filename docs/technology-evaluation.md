# Technology Evaluation

Review date: 2026-10-09. Only official project/vendor documentation was used for the factual checks below. Package versions will be pinned from the selected runtime's compatible stable set during scaffolding, then verified by install, typecheck, tests, build, and dependency audit.

## Web framework

| Candidate | Current official signal | Fit | Risks / open checks | Position |
|---|---|---|---|---|
| Next.js | Official blog lists 16.3 as current; App Router/server rendering, route handlers, metadata, caching, and adapter work fit the product. | Strong match to owner-proposed stack and dynamic/public/admin routes. | Hosting adapter/runtime, scheduled jobs, upload streaming, and PostgreSQL driver compatibility must be tested. December 2025 RSC advisories make patched versions mandatory. | Preferred, pending hosting compatibility. |
| Sites portable Vinext starter | Available in the current environment and targets Cloudflare-compatible output. | Could support a Site-hosted implementation. | The requested production architecture, managed PostgreSQL, private object storage, auth, and schedules require capability/provider confirmation; do not silently substitute it for the agreed production stack. | Keep as hosting option, not yet selected. |

Official sources: https://nextjs.org/blog and https://nextjs.org/docs

## UI and styling

- React: official blog lists 19.3 current. Pin only a Next.js-supported patched version.
- Tailwind CSS: official blog lists 4.3 current. Use design tokens and authored components; no default theme as final design.
- Motion: official docs include `useReducedMotion` and global reduced-motion configuration. Prefer CSS for simple transitions and add Motion only where it meaningfully improves interaction.

Sources: https://react.dev/blog, https://tailwindcss.com/blog, https://motion.dev/docs/react-use-reduced-motion

## Database and ORM

PostgreSQL is accepted in ADR 0002. Drizzle and Prisma remain candidates:

| Criterion | Drizzle | Prisma |
|---|---|---|
| Schema/control | SQL-oriented, explicit schema and query composition | High-level schema/client and mature migration workflow |
| Runtime fit | Often suitable for serverless HTTP/pooled drivers; exact provider path must be tested | Engine/runtime deployment characteristics must be checked for the chosen host |
| Team maintenance | Smaller abstraction, more SQL literacy required | More generated tooling, familiar developer workflow |

Decision should follow hosting/database selection, migration review needs, connection strategy, transaction support, and measured bundle/cold-start impact. Do not select by popularity alone.

Sources to re-check at selection: https://orm.drizzle.team/docs/overview and https://www.prisma.io/docs

## Authentication

Better Auth is a self-hosted candidate. Its official documentation currently covers TOTP, OTP, backup codes, lockout, passkeys, cookies, and Next.js/server integrations. A managed provider may offer stronger operated recovery/risk controls at added cost and data sharing. ADR 0005 defines the evaluation gate.

Sources: https://better-auth.com/docs/plugins/2fa, https://better-auth.com/docs/plugins/passkey, https://better-auth.com/docs/examples/next-js

## GitHub integration

Use documented REST endpoints through a server-side client. GitHub's official docs state that paginated endpoints expose navigation links and commonly allow up to 100 items per page. Official rate-limit docs state 60 requests/hour for unauthenticated public calls and generally 5,000 requests/hour for authenticated user requests; actual headers remain authoritative. Store and react to rate-limit/conditional-request headers.

Webhook APIs exist, but repository/account installation and permissions require an owner-approved GitHub App or webhook configuration. Scheduled reconciliation remains the correctness fallback.

Sources:

- https://docs.github.com/en/rest/using-the-rest-api/using-pagination-in-the-rest-api
- https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api
- https://docs.github.com/en/rest/repos/webhooks

## LinkedIn

Official Microsoft/LinkedIn documentation says most permissions require explicit approval. OpenID Connect open permissions allow authenticated-member profile information such as name, headline, photo, and email depending on scope; broader Profile API access is restricted and subject to storage limitations. The baseline product therefore uses an owner-managed LinkedIn URL/card and does not promise automatic career-history synchronization or scraping.

Sources: https://learn.microsoft.com/en-us/linkedin/shared/authentication/getting-access and https://learn.microsoft.com/en-us/linkedin/shared/integrations/people/profile-api

## Testing

- Vitest official blog lists 5.0 current and notes Node.js/Vite minimums; final selection must match the framework toolchain.
- Playwright official release notes list 1.63 current and support browser-level E2E/accessibility-oriented assertions and trace evidence.
- Add a dedicated accessibility engine plus documented manual checks; tooling alone cannot verify WCAG 2.2 AA.

Sources: https://vitest.dev/blog and https://playwright.dev/docs/release-notes

## Security reference

OWASP identifies ASVS 5.0.0 as the latest stable version. The project will select and map an appropriate Level 2-oriented subset; it will not claim full ASVS compliance without evidence.

Source: https://owasp.org/projects/asvs

## Providers still requiring owner approval

Hosting, PostgreSQL, object storage, identity, email, anti-spam, monitoring, analytics, AI, and malware scanning are intentionally not selected. Evaluate recurring cost, region/residency, exportability, least privilege, retention/deletion, backup/restore, incident controls, and runtime compatibility before adoption.

## Selected zero-cost foundation

On 2026-10-09 the owner required a free starting tier and authorized engineering to choose the providers. The selected baseline is Cloudflare Workers Free for hosting and cron triggers, Neon Free for PostgreSQL, separate Cloudflare R2 Standard buckets for public/private/quarantine objects, self-hosted Better Auth, Cloudflare Turnstile, Resend Free, Cloudflare-native redacted telemetry, and quota-capped Workers AI.

This selection is free only while usage remains within changing provider quotas. The application will use hard limits and setup-required states rather than enabling paid overages. Free plans do not provide the production guarantees of paid plans.
