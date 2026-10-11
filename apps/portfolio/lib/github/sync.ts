import { and, eq, notInArray, sql } from "drizzle-orm";

import type { Database } from "@/db/client";
import {
  githubAccounts,
  githubRepositories,
  githubSyncRuns,
  projectSlugRedirects,
  projects,
} from "@/db/schema";
import { fetchGitHubSnapshot, fetchRepositoryReadme, GitHubApiError } from "./client";
import { releaseGitHubSyncLease, tryAcquireGitHubSyncLease } from "./lease";

type SyncTrigger = "manual" | "scheduled" | "bootstrap";

export function projectSlug(name: string, githubId: number): string {
  const normalized = name
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);

  return `${normalized || "repository"}-${githubId}`;
}

export async function reconcileRepositoryRename(
  db: Database,
  input: {
    repositoryId: string;
    githubId: number;
    previousName: string;
    currentName: string;
  },
) {
  if (input.previousName === input.currentName) return false;
  const [project] = await db
    .select({ id: projects.id, slug: projects.slug })
    .from(projects)
    .where(eq(projects.githubRepositoryId, input.repositoryId))
    .limit(1);
  if (!project) return false;

  const previousSlug = projectSlug(input.previousName, input.githubId);
  const currentSlug = projectSlug(input.currentName, input.githubId);
  if (project.slug !== previousSlug || currentSlug === previousSlug) return false;

  const now = new Date();
  await db.batch([
    db
      .insert(projectSlugRedirects)
      .values({ projectId: project.id, oldSlug: previousSlug })
      .onConflictDoNothing({ target: projectSlugRedirects.oldSlug }),
    db
      .update(projects)
      .set({ slug: currentSlug, updatedAt: now })
      .where(eq(projects.id, project.id)),
  ]);
  return true;
}

function safeFailure(error: unknown): { code: string; message: string } {
  if (error instanceof GitHubApiError) {
    return { code: error.code.slice(0, 64), message: error.message.slice(0, 500) };
  }
  return { code: "sync_failed", message: "GitHub synchronization failed." };
}

export async function synchronizeGitHubAccount(
  db: Database,
  input: {
    username: string;
    expectedAccountId: number;
    trigger: SyncTrigger;
    token?: string;
  },
) {
  const now = new Date();
  const [account] = await db
    .insert(githubAccounts)
    .values({
      githubAccountId: input.expectedAccountId,
      username: input.username,
      profileUrl: `https://github.com/${encodeURIComponent(input.username)}`,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: githubAccounts.githubAccountId,
      set: {
        username: input.username,
        profileUrl: `https://github.com/${encodeURIComponent(input.username)}`,
        updatedAt: now,
      },
    })
    .returning();

  if (!account) throw new Error("GitHub account upsert returned no record.");

  const correlationId = crypto.randomUUID();
  const leaseOwner = crypto.randomUUID();
  const leaseExpiresAt = await tryAcquireGitHubSyncLease(db, account.id, leaseOwner, now);
  if (!leaseExpiresAt) {
    return { status: "busy" as const, observed: 0, created: 0, missing: 0 };
  }

  let run: { id: string } | undefined;

  try {
    [run] = await db
      .insert(githubSyncRuns)
      .values({
        accountId: account.id,
        trigger: input.trigger,
        correlationId,
        leaseOwner,
        leaseExpiresAt,
      })
      .returning({ id: githubSyncRuns.id });

    if (!run) throw new Error("GitHub sync run creation returned no record.");

    const snapshot = await fetchGitHubSnapshot(input.username, account.collectionEtag, {
      token: input.token,
    });

    if (snapshot.profile.id !== input.expectedAccountId) {
      throw new GitHubApiError("stable_account_id_mismatch", null);
    }

    await db
      .update(githubAccounts)
      .set({
        username: snapshot.profile.login,
        profileUrl: snapshot.profile.html_url,
        displayName: snapshot.profile.name,
        headline: snapshot.profile.bio,
        location: snapshot.profile.location,
        avatarUrl: snapshot.profile.avatar_url,
        lastVerifiedAt: now,
        updatedAt: now,
      })
      .where(eq(githubAccounts.id, account.id));

    if (snapshot.notModified) {
      await db.batch([
        db
          .update(githubAccounts)
          .set({ lastSuccessfulSyncAt: now, updatedAt: now })
          .where(eq(githubAccounts.id, account.id)),
        db
          .update(githubSyncRuns)
          .set({
            status: "not_modified",
            completedAt: now,
            pagesObserved: snapshot.pagesObserved,
            completeSnapshot: true,
            responseEtag: snapshot.etag,
            rateLimitRemaining: snapshot.rateLimitRemaining,
            rateLimitResetAt: snapshot.rateLimitResetAt,
          })
          .where(eq(githubSyncRuns.id, run.id)),
      ]);
      return { status: "not_modified" as const, observed: 0, created: 0, missing: 0 };
    }

    const knownRepositories = await db
      .select({
        id: githubRepositories.id,
        githubId: githubRepositories.githubId,
        name: githubRepositories.name,
      })
      .from(githubRepositories)
      .where(eq(githubRepositories.accountId, account.id));
    const knownIds = new Set(knownRepositories.map((repository) => repository.githubId));
    const knownByGithubId = new Map(
      knownRepositories.map((repository) => [repository.githubId, repository]),
    );
    const observedIds = snapshot.repositories.map((repository) => repository.id);
    const createdCount = observedIds.filter((id) => !knownIds.has(id)).length;
    const missingCount = knownRepositories.filter(
      (repository) => !observedIds.includes(repository.githubId),
    ).length;

    for (const repository of snapshot.repositories) {
      const readmeMarkdown = await fetchRepositoryReadme(repository.full_name, {
        token: input.token,
      });
      const [storedRepository] = await db
        .insert(githubRepositories)
        .values({
          accountId: account.id,
          githubId: repository.id,
          ownerGithubId: repository.owner.id,
          ownerLogin: repository.owner.login,
          name: repository.name,
          fullName: repository.full_name,
          htmlUrl: repository.html_url,
          apiUrl: repository.url,
          description: repository.description,
          homepageUrl: repository.homepage || null,
          primaryLanguage: repository.language,
          topics: repository.topics,
          licenseSpdxId: repository.license?.spdx_id ?? null,
          stars: repository.stargazers_count,
          forks: repository.forks_count,
          openIssues: repository.open_issues_count,
          defaultBranch: repository.default_branch,
          readmeMarkdown,
          readmeFetchedAt: now,
          isFork: repository.fork,
          isArchived: repository.archived,
          isDisabled: repository.disabled,
          visibility: repository.visibility,
          availability: "public",
          githubCreatedAt: new Date(repository.created_at),
          githubUpdatedAt: new Date(repository.updated_at),
          githubPushedAt: repository.pushed_at ? new Date(repository.pushed_at) : null,
          lastObservedAt: now,
          lastCompleteSyncId: run.id,
          consecutiveMissCount: 0,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: githubRepositories.githubId,
          set: {
            ownerGithubId: repository.owner.id,
            ownerLogin: repository.owner.login,
            name: repository.name,
            fullName: repository.full_name,
            htmlUrl: repository.html_url,
            apiUrl: repository.url,
            description: repository.description,
            homepageUrl: repository.homepage || null,
            primaryLanguage: repository.language,
            topics: repository.topics,
            licenseSpdxId: repository.license?.spdx_id ?? null,
            stars: repository.stargazers_count,
            forks: repository.forks_count,
            openIssues: repository.open_issues_count,
            defaultBranch: repository.default_branch,
            readmeMarkdown,
            readmeFetchedAt: now,
            isFork: repository.fork,
            isArchived: repository.archived,
            isDisabled: repository.disabled,
            visibility: repository.visibility,
            availability: "public",
            githubUpdatedAt: new Date(repository.updated_at),
            githubPushedAt: repository.pushed_at ? new Date(repository.pushed_at) : null,
            lastObservedAt: now,
            lastCompleteSyncId: run.id,
            consecutiveMissCount: 0,
            updatedAt: now,
          },
        })
        .returning({ id: githubRepositories.id });

      if (!storedRepository) throw new Error("Repository upsert returned no record.");

      await db
        .insert(projects)
        .values({
          githubRepositoryId: storedRepository.id,
          slug: projectSlug(repository.name, repository.id),
          publicationState: "published",
          publishedAt: now,
        })
        .onConflictDoNothing({ target: projects.githubRepositoryId });

      const knownRepository = knownByGithubId.get(repository.id);
      if (knownRepository) {
        await reconcileRepositoryRename(db, {
          repositoryId: storedRepository.id,
          githubId: repository.id,
          previousName: knownRepository.name,
          currentName: repository.name,
        });
      }
    }

    const missingWhere = observedIds.length
      ? and(
          eq(githubRepositories.accountId, account.id),
          notInArray(githubRepositories.githubId, observedIds),
        )
      : eq(githubRepositories.accountId, account.id);

    await db.batch([
      db
        .update(githubRepositories)
        .set({
          availability: "missing",
          consecutiveMissCount: sql`${githubRepositories.consecutiveMissCount} + 1`,
          lastCompleteSyncId: run.id,
          updatedAt: now,
        })
        .where(missingWhere),
      db
        .update(githubAccounts)
        .set({
          collectionEtag: snapshot.etag,
          lastSuccessfulSyncAt: now,
          updatedAt: now,
        })
        .where(eq(githubAccounts.id, account.id)),
      db
        .update(githubSyncRuns)
        .set({
          status: "succeeded",
          completedAt: now,
          pagesObserved: snapshot.pagesObserved,
          itemsObserved: snapshot.repositories.length,
          createdCount,
          updatedCount: snapshot.repositories.length - createdCount,
          missingCount,
          completeSnapshot: true,
          responseEtag: snapshot.etag,
          rateLimitRemaining: snapshot.rateLimitRemaining,
          rateLimitResetAt: snapshot.rateLimitResetAt,
        })
        .where(eq(githubSyncRuns.id, run.id)),
    ]);

    return {
      status: "succeeded" as const,
      observed: snapshot.repositories.length,
      created: createdCount,
      missing: missingCount,
    };
  } catch (error) {
    const failure = safeFailure(error);
    if (run) {
      await db
        .update(githubSyncRuns)
        .set({
          status: "failed",
          completedAt: new Date(),
          errorCode: failure.code,
          errorMessage: failure.message,
        })
        .where(eq(githubSyncRuns.id, run.id));
    }
    throw error;
  } finally {
    await releaseGitHubSyncLease(db, account.id, leaseOwner);
  }
}
