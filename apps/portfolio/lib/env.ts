import { env } from "cloudflare:workers";
import { z } from "zod";

function runtimeString(name: string): string | undefined {
  const binding = (env as unknown as Record<string, unknown>)[name];
  return typeof binding === "string" ? binding : process.env[name];
}

const serverEnvironmentSchema = z.object({
  DATABASE_URL: z.string().url().startsWith("postgresql://"),
});

export type ServerEnvironment = z.infer<typeof serverEnvironmentSchema>;

export function getSiteOrigin(): string {
  const result = z.string().url().safeParse(runtimeString("APP_ORIGIN"));
  if (!result.success) {
    throw new Error("Public site origin is not configured. Set APP_ORIGIN.");
  }
  return result.data.replace(/\/$/, "");
}

export function getServerEnvironment(): ServerEnvironment {
  const result = serverEnvironmentSchema.safeParse({
    DATABASE_URL: runtimeString("DATABASE_URL"),
  });

  if (!result.success) {
    throw new Error(
      "Server configuration is incomplete. Configure DATABASE_URL before using database-backed features.",
    );
  }

  return result.data;
}

const githubEnvironmentSchema = z.object({
  GITHUB_USERNAME: z.string().min(1).max(39),
  GITHUB_ACCOUNT_ID: z.coerce.number().int().positive(),
  GITHUB_TOKEN: z.string().min(1).optional(),
});

export type GitHubEnvironment = z.infer<typeof githubEnvironmentSchema>;

export function getGitHubEnvironment(): GitHubEnvironment {
  const result = githubEnvironmentSchema.safeParse({
    GITHUB_USERNAME: runtimeString("GITHUB_USERNAME"),
    GITHUB_ACCOUNT_ID: runtimeString("GITHUB_ACCOUNT_ID"),
    GITHUB_TOKEN: runtimeString("GITHUB_TOKEN") || undefined,
  });

  if (!result.success) {
    throw new Error(
      "GitHub synchronization is not configured. Set GITHUB_USERNAME and GITHUB_ACCOUNT_ID.",
    );
  }

  return result.data;
}

const githubSyncSecretSchema = z.string().min(32);

export function getGitHubSyncSecret(): string {
  const result = githubSyncSecretSchema.safeParse(runtimeString("GITHUB_SYNC_SECRET"));
  if (!result.success) {
    throw new Error("GitHub scheduled synchronization is not configured.");
  }
  return result.data;
}

export function getContactIntegrationEnvironment() {
  return {
    turnstileSecret: runtimeString("TURNSTILE_SECRET_KEY") || undefined,
    turnstileSiteKey: runtimeString("NEXT_PUBLIC_TURNSTILE_SITE_KEY") || undefined,
    resendApiKey: runtimeString("RESEND_API_KEY") || undefined,
    notificationFrom: runtimeString("CONTACT_NOTIFICATION_FROM") || undefined,
  };
}

const authEnvironmentSchema = z.object({
  APP_ORIGIN: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  ADMIN_EMAIL_ALLOWLIST: z
    .string()
    .min(3)
    .transform((value, context) => {
      const emails = value
        .split(",")
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean);
      const emailSchema = z.string().email();
      if (emails.length !== 1 || !emailSchema.safeParse(emails[0]).success) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Exactly one valid administrator email is required.",
        });
        return z.NEVER;
      }
      return emails;
    }),
});

export type AuthEnvironment = z.infer<typeof authEnvironmentSchema>;

export function getAuthEnvironment(): AuthEnvironment {
  const result = authEnvironmentSchema.safeParse({
    APP_ORIGIN: runtimeString("APP_ORIGIN"),
    BETTER_AUTH_SECRET: runtimeString("BETTER_AUTH_SECRET"),
    ADMIN_EMAIL_ALLOWLIST: runtimeString("ADMIN_EMAIL_ALLOWLIST"),
  });
  if (!result.success) {
    throw new Error(
      "Owner authentication is not configured. Set APP_ORIGIN, BETTER_AUTH_SECRET, and ADMIN_EMAIL_ALLOWLIST.",
    );
  }
  return result.data;
}
