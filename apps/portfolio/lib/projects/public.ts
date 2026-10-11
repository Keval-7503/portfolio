import { and, asc, desc, eq, isNull, ne, or } from "drizzle-orm";

import { getDb } from "@/db";
import { githubRepositories, projects } from "@/db/schema";
import { githubRepositories as verifiedSnapshot } from "@/data/github-snapshot";
import { logEvent } from "@/lib/observability/logger";

export type PublicRepositoryCard = {
  id: number | string;
  slug: string;
  name: string;
  url: string;
  description: string | null;
  language: string | null;
  topics: readonly string[];
  license: string | null;
  fork: boolean;
  archived: boolean;
  updatedAt: string;
};

export type PublicRepositoryResult = {
  repositories: PublicRepositoryCard[];
  source: "database" | "verified-snapshot";
};

function snapshotSlug(name: string, id: number) {
  const normalized = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${normalized}-${id}`;
}

export async function getPublicRepositoryCards(): Promise<PublicRepositoryResult> {
  try {
    const rows = await getDb()
      .select({
        projectId: projects.id,
        githubId: githubRepositories.githubId,
        slug: projects.slug,
        name: githubRepositories.name,
        customTitle: projects.customTitle,
        htmlUrl: githubRepositories.htmlUrl,
        description: githubRepositories.description,
        primaryLanguage: githubRepositories.primaryLanguage,
        topics: githubRepositories.topics,
        licenseSpdxId: githubRepositories.licenseSpdxId,
        isFork: githubRepositories.isFork,
        isArchived: githubRepositories.isArchived,
        githubUpdatedAt: githubRepositories.githubUpdatedAt,
        projectUpdatedAt: projects.updatedAt,
      })
      .from(projects)
      .leftJoin(githubRepositories, eq(projects.githubRepositoryId, githubRepositories.id))
      .where(
        and(
          eq(projects.publicationState, "published"),
          ne(projects.visibilityOverride, "force_hidden"),
          or(isNull(projects.githubRepositoryId), eq(githubRepositories.availability, "public")),
        ),
      )
      .orderBy(asc(projects.sortOrder), desc(projects.updatedAt));

    return {
      source: "database",
      repositories: rows.map((row) => ({
        id: row.githubId ?? row.projectId,
        slug: row.slug,
        name: row.customTitle ?? row.name ?? row.slug,
        url: row.htmlUrl ?? `/projects/${row.slug}`,
        description: row.description,
        language: row.primaryLanguage,
        topics: row.topics ?? [],
        license: row.licenseSpdxId,
        fork: row.isFork ?? false,
        archived: row.isArchived ?? false,
        updatedAt: (row.githubUpdatedAt ?? row.projectUpdatedAt).toISOString(),
      })),
    };
  } catch (error) {
    const category =
      error instanceof Error && error.message.startsWith("Server configuration")
        ? "configuration"
        : "query";
    logEvent("error", "projects.snapshot_fallback", {
      outcome: "degraded",
      errorCode: category === "configuration" ? "DATABASE_NOT_CONFIGURED" : "DATABASE_QUERY_FAILED",
    });
    return {
      source: "verified-snapshot",
      repositories: verifiedSnapshot.map((repository) => ({
        ...repository,
        slug: snapshotSlug(repository.name, repository.id),
      })),
    };
  }
}
