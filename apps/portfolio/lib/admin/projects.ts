import { and, desc, eq } from "drizzle-orm";

import type { Database } from "@/db/client";
import { auditEvents, githubRepositories, projectRevisions, projects } from "@/db/schema";
import {
  projectUpdateSchema,
  type ProjectCreateInput,
  type ProjectUpdateInput,
} from "./project-input";

function projectSlug(title: string, id: string) {
  const base = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
  return `${base || "project"}-${id.slice(0, 8)}`;
}

async function resolveDb(database?: Database) {
  return database ?? (await import("@/db")).getDb();
}

export async function createAdminProject(
  input: ProjectCreateInput,
  actorAuthUserId: string,
  database?: Database,
) {
  const id = crypto.randomUUID();
  const slug = projectSlug(input.title, id);
  const db = await resolveDb(database);
  await db.batch([
    db.insert(projects).values({
      id,
      slug,
      customTitle: input.title,
      summaryMarkdown: input.summaryMarkdown,
      bodyMarkdown: input.bodyMarkdown,
      category: input.category,
      publicationState: "draft",
      visibilityOverride: "inherit",
    }),
    db.insert(auditEvents).values({
      actorAuthUserId,
      action: "project.create",
      targetType: "project",
      targetId: id,
      correlationId: crypto.randomUUID(),
      metadata: { changedFields: ["title", "summaryMarkdown", "bodyMarkdown", "category"] },
    }),
  ]);
  return { id, slug };
}

export async function getAdminProject(id: string, database?: Database) {
  const db = await resolveDb(database);
  const [project] = await db
    .select({
      id: projects.id,
      githubRepositoryId: projects.githubRepositoryId,
      slug: projects.slug,
      customTitle: projects.customTitle,
      summaryMarkdown: projects.summaryMarkdown,
      bodyMarkdown: projects.bodyMarkdown,
      category: projects.category,
      isFeatured: projects.isFeatured,
      sortOrder: projects.sortOrder,
      publicationState: projects.publicationState,
      visibilityOverride: projects.visibilityOverride,
      repositoryName: githubRepositories.name,
      repositoryUrl: githubRepositories.htmlUrl,
    })
    .from(projects)
    .leftJoin(githubRepositories, eq(projects.githubRepositoryId, githubRepositories.id))
    .where(eq(projects.id, id))
    .limit(1);
  return project ?? null;
}

export async function deleteManualProject(
  id: string,
  actorAuthUserId: string,
  database?: Database,
) {
  const db = await resolveDb(database);
  const [project] = await db
    .select({ slug: projects.slug, githubRepositoryId: projects.githubRepositoryId })
    .from(projects)
    .where(eq(projects.id, id))
    .limit(1);
  if (!project) return "not_found" as const;
  if (project.githubRepositoryId) return "source_managed" as const;
  await db.batch([
    db.delete(projects).where(eq(projects.id, id)),
    db.insert(auditEvents).values({
      actorAuthUserId,
      action: "project.delete",
      targetType: "project",
      targetId: id,
      correlationId: crypto.randomUUID(),
      metadata: { changedFields: ["project", "revisions", "redirects"] },
    }),
  ]);
  return { status: "deleted" as const, slug: project.slug };
}

export async function updateAdminProject(
  id: string,
  input: ProjectUpdateInput,
  actorAuthUserId: string,
  context: { action?: "project.update" | "project.restore"; sourceRevisionId?: string } = {},
  database?: Database,
) {
  const now = new Date();
  const current = await getAdminProject(id, database);
  if (!current) return null;
  const snapshot: ProjectUpdateInput = {
    customTitle: current.customTitle,
    summaryMarkdown: current.summaryMarkdown,
    bodyMarkdown: current.bodyMarkdown,
    category: current.category,
    isFeatured: current.isFeatured,
    sortOrder: current.sortOrder,
    publicationState: current.publicationState,
    visibilityOverride: current.visibilityOverride,
  };
  const changedFields = Object.keys(input).filter(
    (field) =>
      input[field as keyof ProjectUpdateInput] !== snapshot[field as keyof ProjectUpdateInput],
  );
  const action = context.action ?? "project.update";
  const db = await resolveDb(database);
  await db.batch([
    db.insert(projectRevisions).values({
      projectId: id,
      createdByAuthUserId: actorAuthUserId,
      reason: action === "project.restore" ? "before_restore" : "before_update",
      snapshot,
    }),
    db
      .update(projects)
      .set({
        ...input,
        publishedAt: input.publicationState === "published" ? now : null,
        archivedAt: input.publicationState === "archived" ? now : null,
        updatedAt: now,
      })
      .where(eq(projects.id, id)),
    db.insert(auditEvents).values({
      actorAuthUserId,
      action,
      targetType: "project",
      targetId: id,
      correlationId: crypto.randomUUID(),
      metadata: {
        changedFields,
        ...(context.sourceRevisionId ? { sourceRevisionId: context.sourceRevisionId } : {}),
      },
    }),
  ]);
  return { id, slug: current.slug };
}

export async function getProjectRevisions(projectId: string) {
  const db = await resolveDb();
  return db
    .select({
      id: projectRevisions.id,
      reason: projectRevisions.reason,
      createdAt: projectRevisions.createdAt,
    })
    .from(projectRevisions)
    .where(eq(projectRevisions.projectId, projectId))
    .orderBy(desc(projectRevisions.createdAt))
    .limit(25);
}

export async function restoreProjectRevision(
  projectId: string,
  revisionId: string,
  actorAuthUserId: string,
  database?: Database,
) {
  const db = await resolveDb(database);
  const [revision] = await db
    .select({ snapshot: projectRevisions.snapshot })
    .from(projectRevisions)
    .where(and(eq(projectRevisions.id, revisionId), eq(projectRevisions.projectId, projectId)))
    .limit(1);
  if (!revision) return null;
  const parsed = projectUpdateSchema.safeParse(revision.snapshot);
  if (!parsed.success) return null;
  return updateAdminProject(
    projectId,
    parsed.data,
    actorAuthUserId,
    {
      action: "project.restore",
      sourceRevisionId: revisionId,
    },
    database,
  );
}
