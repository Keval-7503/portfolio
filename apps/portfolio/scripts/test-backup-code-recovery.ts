import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";

import { createDb } from "../db/client";
import {
  authAccounts,
  authRateLimits,
  authSessions,
  authTwoFactors,
  authUsers,
} from "../db/schema";
import { createPortfolioAuth } from "../lib/auth/factory";

const databaseUrl = process.env.DATABASE_URL;
const secret = process.env.BETTER_AUTH_SECRET;
if (!databaseUrl || !secret) throw new Error("DATABASE_URL and BETTER_AUTH_SECRET are required.");
const db = createDb(databaseUrl);
const marker = randomUUID();
const email = `recovery-${marker}@example.invalid`;
const password = `T3st-${randomBytes(20).toString("base64url")}!`;
const baseURL = "http://127.0.0.1:8787";
const auth = createPortfolioAuth({
  db,
  baseURL,
  secret,
  allowedEmails: [email],
  allowSignUp: true,
  enforceAdminSession: false,
});

async function post(path: string, body: unknown, cookie?: string) {
  return auth.handler(
    new Request(`${baseURL}/api/auth${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: baseURL,
        "cf-connecting-ip": "192.0.2.45",
        ...(cookie ? { Cookie: cookie } : {}),
      },
      body: JSON.stringify(body),
    }),
  );
}

function responseCookies(response: Response) {
  return response.headers
    .getSetCookie()
    .map((value) => value.split(";", 1)[0])
    .join("; ");
}

let userId = "";
try {
  const signUp = await post("/sign-up/email", { name: "Recovery fixture", email, password });
  assert.equal(signUp.status, 200);
  const created = (await signUp.json()) as { user: { id: string } };
  userId = created.user.id;
  const signIn = await post("/sign-in/email", { email, password });
  assert.equal(signIn.status, 200);
  const sessionCookie = responseCookies(signIn);
  assert.ok(sessionCookie);

  const enabled = await post("/two-factor/enable", { password }, sessionCookie);
  assert.equal(enabled.status, 200);
  const setup = (await enabled.json()) as { backupCodes: string[] };
  assert.equal(setup.backupCodes.length, 10);
  const code = setup.backupCodes[0]!;

  const firstUse = await post(
    "/two-factor/verify-backup-code",
    { code, trustDevice: false },
    sessionCookie,
  );
  assert.equal(firstUse.status, 200);
  const secondUse = await post(
    "/two-factor/verify-backup-code",
    { code, trustDevice: false },
    sessionCookie,
  );
  assert.equal(secondUse.status, 401);
} finally {
  if (userId) {
    await db.delete(authSessions).where(eq(authSessions.userId, userId));
    await db.delete(authTwoFactors).where(eq(authTwoFactors.userId, userId));
    await db.delete(authAccounts).where(eq(authAccounts.userId, userId));
    await db.delete(authUsers).where(eq(authUsers.id, userId));
  }
  await db.delete(authRateLimits).where(eq(authRateLimits.key, email));
}

console.log("Isolated owner backup-code recovery succeeded once, rejected reuse, and cleaned up.");
