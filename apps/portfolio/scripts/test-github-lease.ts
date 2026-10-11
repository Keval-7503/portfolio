import assert from "node:assert/strict";
import { eq } from "drizzle-orm";

import { createDb } from "../db/client";
import { githubAccounts } from "../db/schema";
import { releaseGitHubSyncLease, tryAcquireGitHubSyncLease } from "../lib/github/lease";

const databaseUrl = process.env.DATABASE_URL;
const githubAccountId = Number.parseInt(process.env.GITHUB_ACCOUNT_ID ?? "", 10);
if (!databaseUrl || !Number.isSafeInteger(githubAccountId)) {
  throw new Error("DATABASE_URL and GITHUB_ACCOUNT_ID are required.");
}

const db = createDb(databaseUrl);
const [account] = await db
  .select({ id: githubAccounts.id })
  .from(githubAccounts)
  .where(eq(githubAccounts.githubAccountId, githubAccountId));
assert.ok(account, "Configured GitHub account was not found.");

const owners = [crypto.randomUUID(), crypto.randomUUID()];
const acquired = await Promise.all(
  owners.map((owner) => tryAcquireGitHubSyncLease(db, account.id, owner)),
);
const winningIndex = acquired.findIndex((expiresAt) => expiresAt !== null);

try {
  assert.equal(acquired.filter((expiresAt) => expiresAt !== null).length, 1);
} finally {
  if (winningIndex >= 0) {
    await releaseGitHubSyncLease(db, account.id, owners[winningIndex]);
  }
}

const [releasedAccount] = await db
  .select({
    leaseOwner: githubAccounts.syncLeaseOwner,
    leaseExpiresAt: githubAccounts.syncLeaseExpiresAt,
  })
  .from(githubAccounts)
  .where(eq(githubAccounts.id, account.id));
assert.equal(releasedAccount?.leaseOwner, null);
assert.equal(releasedAccount?.leaseExpiresAt, null);

const expiredOwner = crypto.randomUUID();
const replacementOwner = crypto.randomUUID();
await db
  .update(githubAccounts)
  .set({ syncLeaseOwner: expiredOwner, syncLeaseExpiresAt: new Date(0) })
  .where(eq(githubAccounts.id, account.id));

try {
  assert.ok(await tryAcquireGitHubSyncLease(db, account.id, replacementOwner));
} finally {
  await releaseGitHubSyncLease(db, account.id, replacementOwner);
}

console.log("GitHub database lease concurrency check passed.");
