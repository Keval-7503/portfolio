import { env } from "cloudflare:workers";
import { and, eq } from "drizzle-orm";

import { getDb } from "@/db";
import { mediaAssets } from "@/db/schema";
import { deleteDocumentRegistration } from "@/lib/documents/registration";
import { deleteManagedDocument, promoteManagedDocument } from "@/lib/documents/lifecycle";
import type { ValidatedPdf } from "./pdf-policy";

export async function quarantinePdf(input: {
  file: ValidatedPdf;
  originalFilename: string;
  declaredMediaType: string;
  actorAuthUserId: string;
}) {
  if (!env.BUCKET) throw new Error("UPLOAD_STORAGE_UNAVAILABLE");
  const objectKey = `quarantine/${crypto.randomUUID()}`;
  await env.BUCKET.put(objectKey, input.file.bytes, {
    httpMetadata: { contentType: "application/octet-stream" },
    customMetadata: { classification: "quarantine", scanStatus: "pending" },
  });

  try {
    const [asset] = await getDb()
      .insert(mediaAssets)
      .values({
        objectKey,
        originalFilename: input.originalFilename.slice(0, 255),
        safeFilename: input.file.safeFilename,
        declaredMediaType: input.declaredMediaType,
        detectedMediaType: input.file.detectedMediaType,
        byteSize: input.file.bytes.byteLength,
        sha256: input.file.sha256,
        storageClass: "quarantine",
        scanStatus: "pending",
        uploadedByAuthUserId: input.actorAuthUserId,
      })
      .returning({
        id: mediaAssets.id,
        safeFilename: mediaAssets.safeFilename,
        scanStatus: mediaAssets.scanStatus,
      });
    return asset;
  } catch (error) {
    await env.BUCKET.delete(objectKey).catch(() => undefined);
    throw error;
  }
}

export async function deleteQuarantinedAsset(id: string) {
  if (!env.BUCKET) throw new Error("UPLOAD_STORAGE_UNAVAILABLE");
  const [asset] = await getDb()
    .select({ objectKey: mediaAssets.objectKey })
    .from(mediaAssets)
    .where(and(eq(mediaAssets.id, id), eq(mediaAssets.storageClass, "quarantine")))
    .limit(1);
  if (!asset) return false;
  await env.BUCKET.delete(asset.objectKey);
  await deleteDocumentRegistration(id);
  await getDb().delete(mediaAssets).where(eq(mediaAssets.id, id));
  return true;
}

export async function deleteManagedAsset(input: {
  id: string;
  actorAuthUserId: string;
  correlationId: string;
}) {
  if (!env.BUCKET) throw new Error("UPLOAD_STORAGE_UNAVAILABLE");
  return deleteManagedDocument(getDb(), env.BUCKET, input);
}

export async function promoteCleanAsset(input: {
  id: string;
  action: "accept_private" | "publish_resume";
  actorAuthUserId: string;
  correlationId: string;
}) {
  if (!env.BUCKET) throw new Error("UPLOAD_STORAGE_UNAVAILABLE");
  return promoteManagedDocument(getDb(), env.BUCKET, input);
}
