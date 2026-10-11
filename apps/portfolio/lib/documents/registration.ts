import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { mediaAssets, privateDocuments, resumeVersions } from "@/db/schema";

export type DocumentRegistration =
  | { kind: "resume"; label: string }
  | { kind: "private_document"; label: string; documentType: "transcript" | "reference" | "other" };

export async function registerQuarantinedDocument(
  assetId: string,
  safeFilename: string,
  registration: DocumentRegistration,
) {
  if (registration.kind === "resume") {
    const [record] = await getDb()
      .insert(resumeVersions)
      .values({ mediaAssetId: assetId, label: registration.label, safeFilename })
      .returning({ id: resumeVersions.id });
    return { kind: registration.kind, id: record.id } as const;
  }

  const [record] = await getDb()
    .insert(privateDocuments)
    .values({
      mediaAssetId: assetId,
      ownerLabel: registration.label,
      documentType: registration.documentType,
    })
    .returning({ id: privateDocuments.id });
  return { kind: registration.kind, id: record.id } as const;
}

export async function deleteDocumentRegistration(assetId: string) {
  await getDb().delete(resumeVersions).where(eq(resumeVersions.mediaAssetId, assetId));
  await getDb().delete(privateDocuments).where(eq(privateDocuments.mediaAssetId, assetId));
}
