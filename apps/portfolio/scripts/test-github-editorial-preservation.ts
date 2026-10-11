import assert from "node:assert/strict";

import { and, eq, ne } from "drizzle-orm";

import { createDb } from "../db/client";
import { githubAccounts, githubRepositories, projects } from "../db/schema";
import { synchronizeGitHubAccount } from "../lib/github/sync";
import { getPublicProjectBySlug } from "../lib/projects/detail";

const databaseUrl = process.env.DATABASE_URL;
const username = process.env.GITHUB_USERNAME;
const expectedAccountId = Number.parseInt(process.env.GITHUB_ACCOUNT_ID ?? "", 10);
if (!databaseUrl || !username || !Number.isSafeInteger(expectedAccountId)) {
  throw new Error("DATABASE_URL, GITHUB_USERNAME, and GITHUB_ACCOUNT_ID are required.");
}

const db = createDb(databaseUrl);
const [account] = await db
  .select({ id: githubAccounts.id, collectionEtag: githubAccounts.collectionEtag })
  .from(githubAccounts)
  .where(eq(githubAccounts.githubAccountId, expectedAccountId))
  .limit(1);
if (!account) throw new Error("Configured GitHub account was not found.");

const [project] = await db
  .select({
    id: projects.id,
    slug: projects.slug,
    customTitle: projects.customTitle,
    summaryMarkdown: projects.summaryMarkdown,
    bodyMarkdown: projects.bodyMarkdown,
    category: projects.category,
    isFeatured: projects.isFeatured,
    sortOrder: projects.sortOrder,
    publicationState: projects.publicationState,
    visibilityOverride: projects.visibilityOverride,
    publishedAt: projects.publishedAt,
    archivedAt: projects.archivedAt,
    updatedAt: projects.updatedAt,
  })
  .from(projects)
  .innerJoin(githubRepositories, eq(projects.githubRepositoryId, githubRepositories.id))
  .where(
    and(
      eq(githubRepositories.accountId, account.id),
      eq(githubRepositories.availability, "public"),
      eq(projects.publicationState, "published"),
      ne(projects.visibilityOverride, "force_hidden"),
    ),
  )
  .limit(1);
if (!project) throw new Error("A visible synchronized project is required.");

const editorialFixture = {
  customTitle: "Editorial preservation verification",
  summaryMarkdown: "Owner summary preserved during synchronization.",
  bodyMarkdown: "## Owner content\n\nThis content must survive synchronization.",
  category: "Verification",
  isFeatured: !project.isFeatured,
  sortOrder: 777,
  publicationState: "published" as const,
  visibilityOverride: "force_hidden" as const,
};
let syncSucceeded = false;

try {
  await db
    .update(projects)
    .set({ ...editorialFixture, updatedAt: new Date() })
    .where(eq(projects.id, project.id));
  assert.equal(await getPublicProjectBySlug(project.slug, db), null);

  await db
    .update(githubAccounts)
    .set({ collectionEtag: null, updatedAt: new Date() })
    .where(eq(githubAccounts.id, account.id));
  const result = await synchronizeGitHubAccount(db, {
    username,
    expectedAccountId,
    trigger: "manual",
    token: process.env.GITHUB_TOKEN || undefined,
  });
  assert.equal(result.status, "succeeded");
  syncSucceeded = true;

  const [observed] = await db
    .select({
      customTitle: projects.customTitle,
      summaryMarkdown: projects.summaryMarkdown,
      bodyMarkdown: projects.bodyMarkdown,
      category: projects.category,
      isFeatured: projects.isFeatured,
      sortOrder: projects.sortOrder,
      publicationState: projects.publicationState,
      visibilityOverride: projects.visibilityOverride,
    })
    .from(projects)
    .where(eq(projects.id, project.id));
  assert.deepEqual(observed, editorialFixture);
  assert.equal(await getPublicProjectBySlug(project.slug, db), null);
} finally {
  await db
    .update(projects)
    .set({
      customTitle: project.customTitle,
      summaryMarkdown: project.summaryMarkdown,
      bodyMarkdown: project.bodyMarkdown,
      category: project.category,
      isFeatured: project.isFeatured,
      sortOrder: project.sortOrder,
      publicationState: project.publicationState,
      visibilityOverride: project.visibilityOverride,
      publishedAt: project.publishedAt,
      archivedAt: project.archivedAt,
      updatedAt: project.updatedAt,
    })
    .where(eq(projects.id, project.id));
  if (!syncSucceeded) {
    await db
      .update(githubAccounts)
      .set({ collectionEtag: account.collectionEtag, updatedAt: new Date() })
      .where(eq(githubAccounts.id, account.id));
  }
}

assert.ok(await getPublicProjectBySlug(project.slug, db));
console.log("GitHub sync preserved owner fields and hidden override; restoration passed.");
