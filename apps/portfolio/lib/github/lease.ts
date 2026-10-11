import { and, eq, isNull, lt, or } from "drizzle-orm";

import type { Database } from "@/db/client";
import { githubAccounts } from "@/db/schema";

export const GITHUB_SYNC_LEASE_MS = 10 * 60 * 1000;

export async function tryAcquireGitHubSyncLease(
  db: Database,
  accountId: string,
  leaseOwner: string,
  now = new Date(),
): Promise<Date | null> {
  const leaseExpiresAt = new Date(now.getTime() + GITHUB_SYNC_LEASE_MS);
  const acquired = await db
    .update(githubAccounts)
    .set({ syncLeaseOwner: leaseOwner, syncLeaseExpiresAt: leaseExpiresAt, updatedAt: now })
    .where(
      and(
        eq(githubAccounts.id, accountId),
        or(isNull(githubAccounts.syncLeaseExpiresAt), lt(githubAccounts.syncLeaseExpiresAt, now)),
      ),
    )
    .returning({ id: githubAccounts.id });

  return acquired.length === 1 ? leaseExpiresAt : null;
}

export async function releaseGitHubSyncLease(
  db: Database,
  accountId: string,
  leaseOwner: string,
): Promise<void> {
  await db
    .update(githubAccounts)
    .set({ syncLeaseOwner: null, syncLeaseExpiresAt: null, updatedAt: new Date() })
    .where(and(eq(githubAccounts.id, accountId), eq(githubAccounts.syncLeaseOwner, leaseOwner)));
}
