import assert from "node:assert/strict";

import { and, desc, eq, inArray } from "drizzle-orm";

import { createDb } from "../db/client";
import { adminUsers, auditEvents, projectRevisions, projects } from "../db/schema";
import {
  createAdminProject,
  deleteManualProject,
  restoreProjectRevision,
  updateAdminProject,
} from "../lib/admin/projects";
import { getPublicProjectBySlug } from "../lib/projects/detail";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required.");
const db = createDb(databaseUrl);
const [owner] = await db.select({ authUserId: adminUsers.authUserId }).from(adminUsers).limit(1);
if (!owner) throw new Error("An administrator is required for the lifecycle test.");

const created = await createAdminProject(
  {
    title: "Lifecycle verification fixture",
    category: "Test",
    summaryMarkdown: "Private draft summary.",
    bodyMarkdown: "## Draft\n\nNot public.",
  },
  owner.authUserId,
  db,
);

const publishedInput = {
  customTitle: "Lifecycle verification fixture",
  category: "Test",
  summaryMarkdown: "Published summary.",
  bodyMarkdown: "## Published\n\nVisible only during this reversible test.",
  isFeatured: false,
  sortOrder: 9999,
  publicationState: "published" as const,
  visibilityOverride: "inherit" as const,
};

try {
  assert.equal(await getPublicProjectBySlug(created.slug, db), null);
  await updateAdminProject(created.id, publishedInput, owner.authUserId, {}, db);
  assert.equal((await getPublicProjectBySlug(created.slug, db))?.title, publishedInput.customTitle);

  await updateAdminProject(
    created.id,
    { ...publishedInput, publicationState: "archived" },
    owner.authUserId,
    {},
    db,
  );
  assert.equal(await getPublicProjectBySlug(created.slug, db), null);

  const [publishedRevision] = await db
    .select({ id: projectRevisions.id })
    .from(projectRevisions)
    .where(eq(projectRevisions.projectId, created.id))
    .orderBy(desc(projectRevisions.createdAt))
    .limit(1);
  assert.ok(publishedRevision);
  await restoreProjectRevision(created.id, publishedRevision.id, owner.authUserId, db);
  assert.ok(await getPublicProjectBySlug(created.slug, db));

  const events = await db
    .select({ action: auditEvents.action })
    .from(auditEvents)
    .where(eq(auditEvents.targetId, created.id));
  assert.ok(events.some((event) => event.action === "project.create"));
  assert.ok(events.some((event) => event.action === "project.update"));
  assert.ok(events.some((event) => event.action === "project.restore"));
  const deletion = await deleteManualProject(created.id, owner.authUserId, db);
  assert.equal(typeof deletion === "object" ? deletion.status : deletion, "deleted");
  assert.equal(await getPublicProjectBySlug(created.slug, db), null);
  const [deleteEvent] = await db
    .select({ action: auditEvents.action })
    .from(auditEvents)
    .where(and(eq(auditEvents.targetId, created.id), eq(auditEvents.action, "project.delete")))
    .limit(1);
  assert.equal(deleteEvent?.action, "project.delete");
} finally {
  await db
    .delete(auditEvents)
    .where(
      and(
        eq(auditEvents.targetId, created.id),
        inArray(auditEvents.action, [
          "project.create",
          "project.update",
          "project.restore",
          "project.delete",
        ]),
      ),
    );
  await db.delete(projects).where(eq(projects.id, created.id));
}

assert.equal(await getPublicProjectBySlug(created.slug, db), null);
console.log("Create, draft, publish, archive, restore, delete, audit, and cleanup passed.");
