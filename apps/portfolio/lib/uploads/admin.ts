import { desc, eq } from "drizzle-orm";

import { getDb } from "@/db";
import { mediaAssets, privateDocuments, resumeVersions } from "@/db/schema";

export function listActiveUploads() {
  return getDb()
    .select({
      id: mediaAssets.id,
      safeFilename: mediaAssets.safeFilename,
      byteSize: mediaAssets.byteSize,
      storageClass: mediaAssets.storageClass,
      scanStatus: mediaAssets.scanStatus,
      createdAt: mediaAssets.createdAt,
      resumeLabel: resumeVersions.label,
      resumeVersionId: resumeVersions.id,
      privateLabel: privateDocuments.ownerLabel,
      privateDocumentId: privateDocuments.id,
      documentType: privateDocuments.documentType,
    })
    .from(mediaAssets)
    .leftJoin(resumeVersions, eq(resumeVersions.mediaAssetId, mediaAssets.id))
    .leftJoin(privateDocuments, eq(privateDocuments.mediaAssetId, mediaAssets.id))
    .where(eq(mediaAssets.lifecycleState, "active"))
    .orderBy(desc(mediaAssets.createdAt));
}
