declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    DATABASE_URL?: string;
    APP_ORIGIN?: string;
    ADMIN_EMAIL_ALLOWLIST?: string;
    BETTER_AUTH_SECRET?: string;
    GITHUB_USERNAME?: string;
    GITHUB_ACCOUNT_ID?: string;
    GITHUB_TOKEN?: string;
    GITHUB_SYNC_SECRET?: string;
    GITHUB_SYNC_ALERT_WEBHOOK_URL?: string;
    RESEND_API_KEY?: string;
    CONTACT_NOTIFICATION_FROM?: string;
    TURNSTILE_SECRET_KEY?: string;
    NEXT_PUBLIC_TURNSTILE_SITE_KEY?: string;
  }
}
