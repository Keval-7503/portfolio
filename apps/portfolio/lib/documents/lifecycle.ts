import { and, eq } from "drizzle-orm";

import type { Database } from "@/db/client";
import { auditEvents, mediaAssets, privateDocuments, resumeVersions } from "@/db/schema";

export interface DocumentObjectStore {
  get(key: string): Promise<{ body: ReadableStream } | null>;
  put(
    key: string,
    value: ReadableStream,
    options: {
      httpMetadata: { contentType: string; contentDisposition: string };
      customMetadata: Record<string, string>;
    },
  ): Promise<unknown>;
  delete(key: string): Promise<unknown>;
}

export async function deleteManagedDocument(
  db: Database,
  store: DocumentObjectStore,
  input: { id: string; actorAuthUserId: string; correlationId: string },
) {
  const [asset] = await db
    .select({
      objectKey: mediaAssets.objectKey,
      storageClass: mediaAssets.storageClass,
      resumeId: resumeVersions.id,
      privateDocumentId: privateDocuments.id,
    })
    .from(mediaAssets)
    .leftJoin(resumeVersions, eq(resumeVersions.mediaAssetId, mediaAssets.id))
    .leftJoin(privateDocuments, eq(privateDocuments.mediaAssetId, mediaAssets.id))
    .where(eq(mediaAssets.id, input.id))
    .limit(1);
  if (!asset || (!asset.resumeId && !asset.privateDocumentId)) return false;

  await store.delete(asset.objectKey);
  await db.batch([
    db.delete(resumeVersions).where(eq(resumeVersions.mediaAssetId, input.id)),
    db.delete(privateDocuments).where(eq(privateDocuments.mediaAssetId, input.id)),
    db.delete(mediaAssets).where(eq(mediaAssets.id, input.id)),
    db.insert(auditEvents).values({
      actorAuthUserId: input.actorAuthUserId,
      action: asset.resumeId ? "resume.deleted" : "document.deleted",
      targetType: "media_asset",
      targetId: input.id,
      correlationId: input.correlationId,
      metadata: {
        changedFields: ["object", "registration", "metadata"],
        priorStorageClass: asset.storageClass,
        derivativesDeleted: "none_existed",
      },
    }),
  ]);
  return true;
}

export async function promoteManagedDocument(
  db: Database,
  store: DocumentObjectStore,
  input: {
    id: string;
    action: "accept_private" | "publish_resume";
    actorAuthUserId: string;
    correlationId: string;
  },
) {
  const [asset] = await db
    .select({
      objectKey: mediaAssets.objectKey,
      safeFilename: mediaAssets.safeFilename,
      resumeId: resumeVersions.id,
      privateDocumentId: privateDocuments.id,
    })
    .from(mediaAssets)
    .leftJoin(resumeVersions, eq(resumeVersions.mediaAssetId, mediaAssets.id))
    .leftJoin(privateDocuments, eq(privateDocuments.mediaAssetId, mediaAssets.id))
    .where(
      and(
        eq(mediaAssets.id, input.id),
        eq(mediaAssets.storageClass, "quarantine"),
        eq(mediaAssets.scanStatus, "clean"),
      ),
    )
    .limit(1);
  if (!asset) return "not_found" as const;
  if (input.action === "publish_resume" && !asset.resumeId) return "invalid_action" as const;
  if (input.action === "accept_private" && !asset.privateDocumentId)
    return "invalid_action" as const;

  const source = await store.get(asset.objectKey);
  if (!source) throw new Error("QUARANTINE_OBJECT_MISSING");
  const storageClass = input.action === "publish_resume" ? "public" : "private";
  const destination = `${storageClass}/${crypto.randomUUID()}`;
  await store.put(destination, source.body, {
    httpMetadata: {
      contentType: "application/pdf",
      contentDisposition: `attachment; filename="${asset.safeFilename}"`,
    },
    customMetadata: { classification: storageClass, scanStatus: "clean" },
  });

  try {
    const updateAsset = db
      .update(mediaAssets)
      .set({ objectKey: destination, storageClass })
      .where(eq(mediaAssets.id, input.id));
    const insertAudit = db.insert(auditEvents).values({
      actorAuthUserId: input.actorAuthUserId,
      action:
        input.action === "publish_resume"
          ? "resume.published_current"
          : "document.accepted_private",
      targetType: "media_asset",
      targetId: input.id,
      correlationId: input.correlationId,
      metadata: { changedFields: ["objectKey", "storageClass", "publicationState"] },
    });
    if (input.action === "publish_resume") {
      await db.batch([
        db
          .update(resumeVersions)
          .set({ isCurrent: false })
          .where(eq(resumeVersions.isCurrent, true)),
        updateAsset,
        db
          .update(resumeVersions)
          .set({ isCurrent: true, isPublic: true })
          .where(eq(resumeVersions.id, asset.resumeId!)),
        insertAudit,
      ]);
    } else {
      await db.batch([updateAsset, insertAudit]);
    }
  } catch (error) {
    await store.delete(destination).catch(() => undefined);
    throw error;
  }
  await store.delete(asset.objectKey).catch(() => undefined);
  return "promoted" as const;
}
