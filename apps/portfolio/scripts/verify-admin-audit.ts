import { desc, inArray, isNotNull } from "drizzle-orm";

import { createDb } from "../db/client";
import { auditEvents, projectRevisions } from "../db/schema";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required.");
const db = createDb(databaseUrl);
const events = await db
  .select({
    action: auditEvents.action,
    actorAuthUserId: auditEvents.actorAuthUserId,
    targetId: auditEvents.targetId,
    metadata: auditEvents.metadata,
    createdAt: auditEvents.createdAt,
  })
  .from(auditEvents)
  .where(inArray(auditEvents.action, ["project.update", "project.restore"]))
  .orderBy(desc(auditEvents.createdAt));

const revisions = await db
  .select({ id: projectRevisions.id })
  .from(projectRevisions)
  .where(isNotNull(projectRevisions.createdByAuthUserId));

const updates = events.filter((event) => event.action === "project.update");
const restores = events.filter((event) => event.action === "project.restore");
const attributable = events.every((event) => Boolean(event.actorAuthUserId));
const redacted = events.every((event) => {
  const keys = Object.keys(event.metadata);
  return keys.every((key) => key === "changedFields" || key === "sourceRevisionId");
});

if (
  updates.length === 0 ||
  restores.length === 0 ||
  revisions.length < 2 ||
  !attributable ||
  !redacted
) {
  console.error(
    JSON.stringify({
      status: "incomplete",
      updates: updates.length,
      restores: restores.length,
      revisions: revisions.length,
      attributable,
      redacted,
    }),
  );
  process.exitCode = 1;
} else {
  console.log(
    JSON.stringify({
      status: "verified",
      updates: updates.length,
      restores: restores.length,
      revisions: revisions.length,
      attributable,
      redacted,
      lastEventAt: events[0]?.createdAt.toISOString(),
    }),
  );
}
