import assert from "node:assert/strict";

import { and, eq } from "drizzle-orm";

import { createDb } from "../db/client";
import { githubAccounts, githubRepositories, projectSlugRedirects, projects } from "../db/schema";
import { projectSlug, reconcileRepositoryRename } from "../lib/github/sync";
import { getPublicProjectBySlug } from "../lib/projects/detail";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required.");
const db = createDb(databaseUrl);
const [account] = await db
  .select({ id: githubAccounts.id, githubAccountId: githubAccounts.githubAccountId })
  .from(githubAccounts)
  .where(eq(githubAccounts.isActive, true))
  .limit(1);
if (!account) throw new Error("An active GitHub account is required.");

const githubId = Number(`8${Date.now()}`);
const previousName = "rename-verification-before";
const currentName = "rename-verification-after";
const previousSlug = projectSlug(previousName, githubId);
const currentSlug = projectSlug(currentName, githubId);
let repositoryId: string | undefined;
let projectId: string | undefined;

try {
  const [repository] = await db
    .insert(githubRepositories)
    .values({
      accountId: account.id,
      githubId,
      ownerGithubId: account.githubAccountId,
      ownerLogin: "Keval-7503",
      name: currentName,
      fullName: `Keval-7503/${currentName}`,
      htmlUrl: `https://github.com/Keval-7503/${currentName}`,
      apiUrl: `https://api.github.com/repos/Keval-7503/${currentName}`,
      defaultBranch: "main",
      visibility: "public",
      githubCreatedAt: new Date(),
      githubUpdatedAt: new Date(),
    })
    .returning({ id: githubRepositories.id });
  assert.ok(repository);
  repositoryId = repository.id;

  const [project] = await db
    .insert(projects)
    .values({
      githubRepositoryId: repository.id,
      slug: previousSlug,
      customTitle: "Rename verification fixture",
      summaryMarkdown: "Owner content retained across source rename.",
      publicationState: "published",
      publishedAt: new Date(),
    })
    .returning({ id: projects.id });
  assert.ok(project);
  projectId = project.id;

  assert.equal(
    await reconcileRepositoryRename(db, {
      repositoryId: repository.id,
      githubId,
      previousName,
      currentName,
    }),
    true,
  );
  const [renamed] = await db
    .select({ slug: projects.slug, customTitle: projects.customTitle })
    .from(projects)
    .where(eq(projects.id, project.id));
  assert.equal(renamed?.slug, currentSlug);
  assert.equal(renamed?.customTitle, "Rename verification fixture");
  const [redirect] = await db
    .select({ projectId: projectSlugRedirects.projectId })
    .from(projectSlugRedirects)
    .where(eq(projectSlugRedirects.oldSlug, previousSlug));
  assert.equal(redirect?.projectId, project.id);
  assert.ok(await getPublicProjectBySlug(currentSlug, db));

  const customSlug = `owner-controlled-${githubId}`;
  await db.update(projects).set({ slug: customSlug }).where(eq(projects.id, project.id));
  assert.equal(
    await reconcileRepositoryRename(db, {
      repositoryId: repository.id,
      githubId,
      previousName: currentName,
      currentName: "another-source-name",
    }),
    false,
  );
  assert.ok(await getPublicProjectBySlug(customSlug, db));

  await db
    .update(githubRepositories)
    .set({ availability: "missing", consecutiveMissCount: 3 })
    .where(eq(githubRepositories.id, repository.id));
  assert.equal(await getPublicProjectBySlug(customSlug, db), null);
  const [retained] = await db
    .select({ customTitle: projects.customTitle })
    .from(projects)
    .where(eq(projects.id, project.id));
  assert.equal(retained?.customTitle, "Rename verification fixture");
} finally {
  if (projectId) {
    await db.delete(projectSlugRedirects).where(eq(projectSlugRedirects.projectId, projectId));
    await db.delete(projects).where(eq(projects.id, projectId));
  }
  if (repositoryId) {
    await db
      .delete(githubRepositories)
      .where(
        and(eq(githubRepositories.id, repositoryId), eq(githubRepositories.githubId, githubId)),
      );
  }
}

console.log("GitHub rename redirect, custom slug, missing denial, retention, and cleanup passed.");
