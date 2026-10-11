import { and, eq } from "drizzle-orm";

import { createDb } from "../db/client";
import { adminUsers, authUsers } from "../db/schema";
import { createPortfolioAuth } from "../lib/auth/factory";

const databaseUrl = process.env.DATABASE_URL;
const baseURL = process.env.APP_ORIGIN;
const secret = process.env.BETTER_AUTH_SECRET;
const email = process.env.ADMIN_EMAIL_ALLOWLIST?.trim().toLowerCase();
const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;

if (!databaseUrl || !baseURL || !secret || secret.length < 32 || !email || !password) {
  throw new Error("Local auth configuration and a bootstrap password are required.");
}
if (password.length < 12 || password.length > 128) {
  throw new Error("The owner password must contain between 12 and 128 characters.");
}
if (email.includes(",")) throw new Error("Exactly one owner email is supported.");

const db = createDb(databaseUrl);
const existingAdmin = await db.select({ id: adminUsers.id }).from(adminUsers).limit(1);
if (existingAdmin.length > 0) {
  throw new Error("The owner account is already initialized. No changes were made.");
}

let [user] = await db
  .select({ id: authUsers.id, email: authUsers.email })
  .from(authUsers)
  .where(eq(authUsers.email, email))
  .limit(1);

if (!user) {
  const auth = createPortfolioAuth({
    db,
    baseURL,
    secret,
    allowedEmails: [email],
    allowSignUp: true,
  });
  const result = await auth.api.signUpEmail({
    body: { name: "Portfolio Owner", email, password },
  });
  user = { id: result.user.id, email: result.user.email };
}

await db
  .insert(adminUsers)
  .values({
    authUserId: user.id,
    email: user.email.toLowerCase(),
    status: "active",
    mfaRequired: true,
  })
  .onConflictDoNothing();

const [ready] = await db
  .select({ id: adminUsers.id })
  .from(adminUsers)
  .where(and(eq(adminUsers.authUserId, user.id), eq(adminUsers.status, "active")))
  .limit(1);
if (!ready) throw new Error("Owner initialization did not complete.");

console.log("Owner account initialized. Sign in locally and complete MFA setup.");
