import { count, desc, eq } from "drizzle-orm";

import { getDb } from "@/db";
import { githubAccounts, githubRepositories, githubSyncRuns, projects } from "@/db/schema";

export type AdminDashboardData = Awaited<ReturnType<typeof getAdminDashboardData>>;

export async function getAdminDashboardData() {
  const db = getDb();

  const [projectCountRows, repositoryCountRows, accountRows, syncRows, projectRows] =
    await Promise.all([
      db.select({ value: count() }).from(projects),
      db
        .select({ value: count() })
        .from(githubRepositories)
        .where(eq(githubRepositories.availability, "public")),
      db
        .select({
          username: githubAccounts.username,
          syncEnabled: githubAccounts.syncEnabled,
          lastSuccessfulSyncAt: githubAccounts.lastSuccessfulSyncAt,
        })
        .from(githubAccounts)
        .where(eq(githubAccounts.isActive, true))
        .limit(1),
      db
        .select({
          status: githubSyncRuns.status,
          trigger: githubSyncRuns.trigger,
          startedAt: githubSyncRuns.startedAt,
          completedAt: githubSyncRuns.completedAt,
          itemsObserved: githubSyncRuns.itemsObserved,
          errorCode: githubSyncRuns.errorCode,
        })
        .from(githubSyncRuns)
        .orderBy(desc(githubSyncRuns.startedAt))
        .limit(1),
      db
        .select({
          id: projects.id,
          slug: projects.slug,
          customTitle: projects.customTitle,
          publicationState: projects.publicationState,
          visibilityOverride: projects.visibilityOverride,
          isFeatured: projects.isFeatured,
          repositoryName: githubRepositories.name,
          repositoryUrl: githubRepositories.htmlUrl,
          availability: githubRepositories.availability,
          isArchived: githubRepositories.isArchived,
        })
        .from(projects)
        .leftJoin(githubRepositories, eq(projects.githubRepositoryId, githubRepositories.id))
        .orderBy(projects.sortOrder, projects.slug),
    ]);

  return {
    projectCount: projectCountRows[0]?.value ?? 0,
    publicRepositoryCount: repositoryCountRows[0]?.value ?? 0,
    account: accountRows[0] ?? null,
    latestSync: syncRows[0] ?? null,
    projects: projectRows,
  };
}
