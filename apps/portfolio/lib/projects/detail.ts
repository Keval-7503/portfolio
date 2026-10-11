import { and, eq, isNull, ne, or } from "drizzle-orm";

import type { Database } from "@/db/client";
import { githubRepositories, projectSlugRedirects, projects } from "@/db/schema";

export async function getPublicProjectBySlug(slug: string, database?: Database) {
  const db = database ?? (await import("@/db")).getDb();
  const [project] = await db
    .select({
      id: projects.id,
      slug: projects.slug,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
      title: projects.customTitle,
      summary: projects.summaryMarkdown,
      body: projects.bodyMarkdown,
      category: projects.category,
      isFeatured: projects.isFeatured,
      repositoryName: githubRepositories.name,
      repositoryUrl: githubRepositories.htmlUrl,
      description: githubRepositories.description,
      homepageUrl: githubRepositories.homepageUrl,
      readme: githubRepositories.readmeMarkdown,
      language: githubRepositories.primaryLanguage,
      topics: githubRepositories.topics,
      license: githubRepositories.licenseSpdxId,
      stars: githubRepositories.stars,
      forks: githubRepositories.forks,
      openIssues: githubRepositories.openIssues,
      isFork: githubRepositories.isFork,
      isArchived: githubRepositories.isArchived,
      githubCreatedAt: githubRepositories.githubCreatedAt,
      githubUpdatedAt: githubRepositories.githubUpdatedAt,
      githubPushedAt: githubRepositories.githubPushedAt,
    })
    .from(projects)
    .leftJoin(githubRepositories, eq(projects.githubRepositoryId, githubRepositories.id))
    .where(
      and(
        eq(projects.slug, slug),
        eq(projects.publicationState, "published"),
        ne(projects.visibilityOverride, "force_hidden"),
        or(isNull(projects.githubRepositoryId), eq(githubRepositories.availability, "public")),
      ),
    )
    .limit(1);

  return project ? { ...project, topics: project.topics ?? [] } : null;
}

export async function getPublicProjectRedirect(slug: string) {
  const db = (await import("@/db")).getDb();
  const [match] = await db
    .select({ slug: projects.slug })
    .from(projectSlugRedirects)
    .innerJoin(projects, eq(projectSlugRedirects.projectId, projects.id))
    .leftJoin(githubRepositories, eq(projects.githubRepositoryId, githubRepositories.id))
    .where(
      and(
        eq(projectSlugRedirects.oldSlug, slug),
        eq(projects.publicationState, "published"),
        ne(projects.visibilityOverride, "force_hidden"),
        or(isNull(projects.githubRepositoryId), eq(githubRepositories.availability, "public")),
      ),
    )
    .limit(1);

  return match?.slug ?? null;
}
