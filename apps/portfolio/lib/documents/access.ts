import { and, eq, isNull } from "drizzle-orm";

import type { Database } from "@/db/client";
import { mediaAssets, privateDocuments, resumeVersions } from "@/db/schema";

async function resolveDb(db?: Database) {
  if (db) return db;
  return (await import("@/db")).getDb();
}

export async function getReadablePrivateDocument(id: string, db?: Database) {
  const database = await resolveDb(db);
  return database
    .select({ objectKey: mediaAssets.objectKey, safeFilename: mediaAssets.safeFilename })
    .from(privateDocuments)
    .innerJoin(mediaAssets, eq(privateDocuments.mediaAssetId, mediaAssets.id))
    .where(
      and(
        eq(privateDocuments.id, id),
        eq(privateDocuments.retentionState, "active"),
        isNull(privateDocuments.deletedAt),
        eq(mediaAssets.storageClass, "private"),
        eq(mediaAssets.scanStatus, "clean"),
        eq(mediaAssets.lifecycleState, "active"),
      ),
    )
    .limit(1);
}

export async function getCurrentPublicResume(db?: Database) {
  const database = await resolveDb(db);
  return database
    .select({
      id: resumeVersions.id,
      objectKey: mediaAssets.objectKey,
      safeFilename: resumeVersions.safeFilename,
      sha256: mediaAssets.sha256,
      updatedAt: resumeVersions.updatedAt,
    })
    .from(resumeVersions)
    .innerJoin(mediaAssets, eq(resumeVersions.mediaAssetId, mediaAssets.id))
    .where(
      and(
        eq(resumeVersions.isCurrent, true),
        eq(resumeVersions.isPublic, true),
        isNull(resumeVersions.archivedAt),
        eq(mediaAssets.storageClass, "public"),
        eq(mediaAssets.scanStatus, "clean"),
        eq(mediaAssets.lifecycleState, "active"),
      ),
    )
    .limit(1);
}
