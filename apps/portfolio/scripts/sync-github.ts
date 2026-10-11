import { count, eq } from "drizzle-orm";

import { createDb } from "../db/client";
import { githubAccounts, githubRepositories, githubSyncRuns, projects } from "../db/schema";
import { synchronizeGitHubAccount } from "../lib/github/sync";

const databaseUrl = process.env.DATABASE_URL;
const username = process.env.GITHUB_USERNAME;
const expectedAccountId = Number.parseInt(process.env.GITHUB_ACCOUNT_ID ?? "", 10);

if (!databaseUrl || !username || !Number.isSafeInteger(expectedAccountId)) {
  throw new Error(
    "DATABASE_URL, GITHUB_USERNAME, and GITHUB_ACCOUNT_ID are required in the ignored local .env file.",
  );
}

const db = createDb(databaseUrl);
const syncResult = await synchronizeGitHubAccount(db, {
  username,
  expectedAccountId,
  trigger: "bootstrap",
  token: process.env.GITHUB_TOKEN || undefined,
});

const [accountCount, repositoryCount, projectCount, successfulRunCount] = await Promise.all([
  db.select({ value: count() }).from(githubAccounts),
  db.select({ value: count() }).from(githubRepositories),
  db.select({ value: count() }).from(projects),
  db.select({ value: count() }).from(githubSyncRuns).where(eq(githubSyncRuns.status, "succeeded")),
]);

console.log(
  JSON.stringify(
    {
      status: "ready",
      sync: syncResult,
      database: {
        accounts: accountCount[0]?.value ?? 0,
        repositories: repositoryCount[0]?.value ?? 0,
        projects: projectCount[0]?.value ?? 0,
        successfulRuns: successfulRunCount[0]?.value ?? 0,
      },
    },
    null,
    2,
  ),
);
