import { and, eq } from "drizzle-orm";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { twoFactor } from "better-auth/plugins";

import type { Database } from "@/db/client";
import {
  adminUsers,
  authAccounts,
  authRateLimits,
  authSessions,
  authTwoFactors,
  authUsers,
  authVerifications,
} from "@/db/schema";

type PortfolioAuthOptions = {
  db: Database;
  baseURL: string;
  secret: string;
  allowedEmails: readonly string[];
  allowSignUp?: boolean;
  enforceAdminSession?: boolean;
};

export function createPortfolioAuth(options: PortfolioAuthOptions) {
  const allowedEmails = new Set(options.allowedEmails.map((email) => email.toLowerCase()));

  return betterAuth({
    appName: "Keval Patel Portfolio",
    baseURL: options.baseURL,
    secret: options.secret,
    database: drizzleAdapter(options.db, {
      provider: "pg",
      transaction: false,
      schema: {
        user: authUsers,
        session: authSessions,
        account: authAccounts,
        verification: authVerifications,
        twoFactor: authTwoFactors,
        rateLimit: authRateLimits,
      },
    }),
    emailAndPassword: {
      enabled: true,
      disableSignUp: !(options.allowSignUp ?? false),
      autoSignIn: false,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      revokeSessionsOnPasswordReset: true,
    },
    user: {
      validateUserInfo: ({ user }) => {
        const email = user.email?.toLowerCase();
        if (!email || !allowedEmails.has(email)) {
          return { error: "OWNER_ONLY", errorDescription: "This sign-in is not authorized." };
        }
      },
    },
    session: {
      expiresIn: 12 * 60 * 60,
      updateAge: 60 * 60,
      freshAge: 10 * 60,
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => (allowedEmails.has(user.email.toLowerCase()) ? undefined : false),
        },
        update: {
          before: async (user) =>
            !user.email || allowedEmails.has(user.email.toLowerCase()) ? undefined : false,
        },
      },
      session: {
        create: {
          before: async (session) => {
            if (options.enforceAdminSession === false) return undefined;
            const [admin] = await options.db
              .select({ id: adminUsers.id })
              .from(adminUsers)
              .where(
                and(eq(adminUsers.authUserId, session.userId), eq(adminUsers.status, "active")),
              )
              .limit(1);
            return admin ? undefined : false;
          },
        },
      },
    },
    plugins: [
      twoFactor({
        issuer: "Keval Patel Portfolio",
        skipVerificationOnEnable: false,
        twoFactorCookieMaxAge: 10 * 60,
        trustDeviceMaxAge: 0,
        backupCodeOptions: { amount: 10, length: 12 },
        accountLockout: { enabled: true, maxFailedAttempts: 5, durationSeconds: 15 * 60 },
      }),
    ],
    rateLimit: {
      enabled: true,
      storage: "database",
      window: 60,
      max: 30,
      customRules: {
        "/sign-in/email": { window: 60, max: 5 },
        "/two-factor/verify-totp": { window: 60, max: 5 },
        "/two-factor/verify-backup-code": { window: 60, max: 5 },
      },
    },
    telemetry: { enabled: false },
    advanced: {
      ipAddress: { ipAddressHeaders: ["cf-connecting-ip"] },
    },
  });
}
