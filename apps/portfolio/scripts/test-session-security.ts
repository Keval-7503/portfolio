import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";

import { createDb } from "../db/client";
import { authSessions, authUsers } from "../db/schema";
import {
  isSessionFresh,
  listActiveAdminSessions,
  revokeOtherAdminSessions,
} from "../lib/auth/session-security";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required.");

const db = createDb(databaseUrl);
const fixtureId = `session-test-${randomUUID()}`;
const currentSessionId = randomUUID();
const now = new Date();

assert.equal(isSessionFresh(new Date(now.getTime() - 9 * 60 * 1000), now), true);
assert.equal(isSessionFresh(new Date(now.getTime() - 11 * 60 * 1000), now), false);

await db.insert(authUsers).values({
  id: fixtureId,
  name: "Session fixture",
  email: `${fixtureId}@example.invalid`,
  emailVerified: true,
});

try {
  await db.insert(authSessions).values([
    {
      id: currentSessionId,
      userId: fixtureId,
      token: randomUUID(),
      expiresAt: new Date(now.getTime() + 60 * 60 * 1000),
      userAgent: "current-fixture",
    },
    {
      id: randomUUID(),
      userId: fixtureId,
      token: randomUUID(),
      expiresAt: new Date(now.getTime() + 60 * 60 * 1000),
      userAgent: "other-fixture",
    },
    {
      id: randomUUID(),
      userId: fixtureId,
      token: randomUUID(),
      expiresAt: new Date(now.getTime() - 60 * 1000),
      userAgent: "expired-fixture",
    },
  ]);

  const activeBefore = await listActiveAdminSessions(db, fixtureId, now);
  assert.equal(activeBefore.length, 2);
  assert.equal(
    activeBefore.some((session) => session.userAgent === "expired-fixture"),
    false,
  );

  const revoked = await revokeOtherAdminSessions(db, fixtureId, currentSessionId);
  assert.equal(revoked, 2);
  const remaining = await db.select().from(authSessions).where(eq(authSessions.userId, fixtureId));
  assert.deepEqual(
    remaining.map((session) => session.id),
    [currentSessionId],
  );
} finally {
  await db.delete(authUsers).where(eq(authUsers.id, fixtureId));
}

console.log("Session freshness, active-session filtering, and other-session revocation passed.");
