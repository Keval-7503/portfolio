import assert from "node:assert/strict";
import { eq } from "drizzle-orm";

import { createDb } from "../db/client";
import { authUsers } from "../db/schema";
import { createPortfolioAuth } from "../lib/auth/factory";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required.");

const db = createDb(databaseUrl);
const unauthorizedFixtureEmail = "other@example.invalid";
await db.delete(authUsers).where(eq(authUsers.email, unauthorizedFixtureEmail));
const baseOptions = {
  db,
  baseURL: "http://127.0.0.1:8787",
  secret: "test-only-secret-with-at-least-32-characters",
  allowedEmails: ["owner@example.invalid"],
};

const lockedAuth = createPortfolioAuth(baseOptions);
assert.equal(await lockedAuth.api.getSession({ headers: new Headers() }), null);
await assert.rejects(
  lockedAuth.api.signUpEmail({
    body: { name: "Blocked", email: "owner@example.invalid", password: "correct-horse-fixture" },
  }),
);

const bootstrapAuth = createPortfolioAuth({ ...baseOptions, allowSignUp: true });
try {
  await bootstrapAuth.api
    .signUpEmail({
      body: { name: "Blocked", email: unauthorizedFixtureEmail, password: "correct-horse-fixture" },
    })
    .catch(() => undefined);
  const unauthorizedUsers = await db
    .select({ id: authUsers.id })
    .from(authUsers)
    .where(eq(authUsers.email, unauthorizedFixtureEmail));
  assert.equal(unauthorizedUsers.length, 0);
} finally {
  await db.delete(authUsers).where(eq(authUsers.email, unauthorizedFixtureEmail));
}

console.log("Auth schema, closed registration, and owner allow-list checks passed.");
