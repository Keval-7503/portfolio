import { eq } from "drizzle-orm";

import { createDb } from "../db/client";
import { githubRepositories } from "../db/schema";
import { fetchRepositoryReadme } from "../lib/github/client";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required.");

const db = createDb(databaseUrl);
const repositories = await db
  .select({ id: githubRepositories.id, fullName: githubRepositories.fullName })
  .from(githubRepositories)
  .where(eq(githubRepositories.availability, "public"));

let imported = 0;
let absent = 0;
for (const repository of repositories) {
  const markdown = await fetchRepositoryReadme(repository.fullName, {
    token: process.env.GITHUB_TOKEN || undefined,
  });
  await db
    .update(githubRepositories)
    .set({ readmeMarkdown: markdown, readmeFetchedAt: new Date(), updatedAt: new Date() })
    .where(eq(githubRepositories.id, repository.id));
  if (markdown) imported += 1;
  else absent += 1;
}

console.log(JSON.stringify({ status: "ready", observed: repositories.length, imported, absent }));
