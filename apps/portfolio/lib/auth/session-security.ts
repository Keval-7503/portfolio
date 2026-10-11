import { and, desc, eq, gt, ne } from "drizzle-orm";

import type { Database } from "@/db/client";
import { authSessions } from "@/db/schema";

export const SESSION_FRESH_AGE_SECONDS = 10 * 60;

export function isSessionFresh(createdAt: Date, now = new Date()): boolean {
  return now.getTime() - createdAt.getTime() < SESSION_FRESH_AGE_SECONDS * 1000;
}

export function listActiveAdminSessions(db: Database, userId: string, now = new Date()) {
  return db
    .select({
      id: authSessions.id,
      createdAt: authSessions.createdAt,
      expiresAt: authSessions.expiresAt,
      ipAddress: authSessions.ipAddress,
      userAgent: authSessions.userAgent,
    })
    .from(authSessions)
    .where(and(eq(authSessions.userId, userId), gt(authSessions.expiresAt, now)))
    .orderBy(desc(authSessions.createdAt));
}

export async function revokeOtherAdminSessions(
  db: Database,
  userId: string,
  currentSessionId: string,
) {
  const revoked = await db
    .delete(authSessions)
    .where(and(eq(authSessions.userId, userId), ne(authSessions.id, currentSessionId)))
    .returning({ id: authSessions.id });
  return revoked.length;
}
