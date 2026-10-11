# Portfolio application

Cloudflare-compatible TypeScript application for the public portfolio and private administration system.

## Current implementation

- Responsive neobrutalist homepage and database-backed public project pages.
- Original generated workbench-robot illustration and custom favicon.
- Strict TypeScript, ESLint, formatting, automated tests, secret scanning, production build, and portable Workers runtime.
- Live Neon schema and GitHub synchronization for the owner-supplied public account.
- Better Auth owner allow-list, MFA, freshness enforcement, secure logout, session revocation, and password controls.
- Protected project editing with revision snapshots and attributable, redacted audit events.

## Commands

```bash
npm run dev
npm run quality
npm run test:integration
npm run test:e2e
npm run audit:dependencies
npm run build
npm run start
```

Run `npm start` before `npm run test:e2e`. Integration tests require the ignored local `.env` and the configured Neon database. `npm run verify` combines the environment-independent quality gate and production build.

Copy `.env.example` to an ignored local environment file only when configuring services. Never commit real values. GitHub Actions runs the environment-independent quality and build gates with read-only repository permissions.

## Honest limitations

Upload storage, résumé management, contact inbox, AI processing, and production deployment remain unimplemented. The public application continues to show truthful empty states for unavailable content.
