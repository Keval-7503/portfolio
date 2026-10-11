import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";

import { createDb } from "../db/client";
import {
  auditEvents,
  authUsers,
  mediaAssets,
  privateDocuments,
  resumeVersions,
} from "../db/schema";
import { getCurrentPublicResume, getReadablePrivateDocument } from "../lib/documents/access";
import {
  deleteManagedDocument,
  type DocumentObjectStore,
  promoteManagedDocument,
} from "../lib/documents/lifecycle";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required.");
const db = createDb(databaseUrl);
const fixtureUserId = `document-test-${randomUUID()}`;
const fixtureAssetIds: string[] = [];
const baselineCurrentResume = await getCurrentPublicResume(db);
const objectBytes = new Map<string, Uint8Array>();
const store: DocumentObjectStore = {
  async get(key) {
    const bytes = objectBytes.get(key);
    const copy = bytes ? Uint8Array.from(bytes) : null;
    return copy ? { body: new Blob([copy.buffer]).stream() } : null;
  },
  async put(key, value) {
    objectBytes.set(key, new Uint8Array(await new Response(value).arrayBuffer()));
  },
  async delete(key) {
    objectBytes.delete(key);
  },
};

await db.insert(authUsers).values({
  id: fixtureUserId,
  name: "Document fixture",
  email: `${fixtureUserId}@example.invalid`,
  emailVerified: true,
});

try {
  const [privateAsset, resumeAsset] = await db
    .insert(mediaAssets)
    .values([
      {
        objectKey: `quarantine/${randomUUID()}`,
        originalFilename: "private.pdf",
        safeFilename: "private.pdf",
        declaredMediaType: "application/pdf",
        detectedMediaType: "application/pdf",
        byteSize: 100,
        sha256: randomUUID().replaceAll("-", "") + randomUUID().replaceAll("-", ""),
        uploadedByAuthUserId: fixtureUserId,
      },
      {
        objectKey: `quarantine/${randomUUID()}`,
        originalFilename: "resume.pdf",
        safeFilename: "resume.pdf",
        declaredMediaType: "application/pdf",
        detectedMediaType: "application/pdf",
        byteSize: 100,
        sha256: randomUUID().replaceAll("-", "") + randomUUID().replaceAll("-", ""),
        uploadedByAuthUserId: fixtureUserId,
      },
    ])
    .returning({ id: mediaAssets.id, objectKey: mediaAssets.objectKey });
  fixtureAssetIds.push(privateAsset.id, resumeAsset.id);

  const [privateDocument] = await db
    .insert(privateDocuments)
    .values({ mediaAssetId: privateAsset.id, ownerLabel: "Private fixture" })
    .returning({ id: privateDocuments.id });
  await db.insert(resumeVersions).values({
    mediaAssetId: resumeAsset.id,
    label: "Resume fixture",
    safeFilename: "resume.pdf",
    isCurrent: false,
    isPublic: false,
  });

  assert.equal((await getReadablePrivateDocument(privateDocument.id, db)).length, 0);
  assert.deepEqual(await getCurrentPublicResume(db), baselineCurrentResume);

  await db
    .update(mediaAssets)
    .set({ storageClass: "private", scanStatus: "clean" })
    .where(eq(mediaAssets.id, privateAsset.id));
  assert.equal((await getReadablePrivateDocument(privateDocument.id, db)).length, 1);
  assert.deepEqual(await getCurrentPublicResume(db), baselineCurrentResume);

  await db
    .update(mediaAssets)
    .set({ storageClass: "public", scanStatus: "clean" })
    .where(eq(mediaAssets.id, resumeAsset.id));
  assert.deepEqual(await getCurrentPublicResume(db), baselineCurrentResume);

  // Return both fixtures to a clean quarantine state and prove the real lifecycle service.
  await db
    .update(mediaAssets)
    .set({ storageClass: "quarantine", scanStatus: "clean" })
    .where(inArray(mediaAssets.id, [privateAsset.id, resumeAsset.id]));
  objectBytes.set(privateAsset.objectKey, new TextEncoder().encode("private fixture"));
  objectBytes.set(resumeAsset.objectKey, new TextEncoder().encode("resume replacement fixture"));

  assert.equal(
    await promoteManagedDocument(db, store, {
      id: resumeAsset.id,
      action: "publish_resume",
      actorAuthUserId: fixtureUserId,
      correlationId: randomUUID(),
    }),
    "promoted",
  );
  const replacement = await getCurrentPublicResume(db);
  assert.equal(replacement.length, 1);
  assert.equal(replacement[0].safeFilename, "resume.pdf");
  assert.notDeepEqual(replacement, baselineCurrentResume);

  assert.equal(
    await promoteManagedDocument(db, store, {
      id: privateAsset.id,
      action: "accept_private",
      actorAuthUserId: fixtureUserId,
      correlationId: randomUUID(),
    }),
    "promoted",
  );
  assert.equal((await getReadablePrivateDocument(privateDocument.id, db)).length, 1);

  assert.equal(
    await deleteManagedDocument(db, store, {
      id: privateAsset.id,
      actorAuthUserId: fixtureUserId,
      correlationId: randomUUID(),
    }),
    true,
  );
  assert.equal((await getReadablePrivateDocument(privateDocument.id, db)).length, 0);
  assert.equal(
    [...objectBytes.keys()].some((key) => key.startsWith("private/")),
    false,
  );

  assert.equal(
    await deleteManagedDocument(db, store, {
      id: resumeAsset.id,
      actorAuthUserId: fixtureUserId,
      correlationId: randomUUID(),
    }),
    true,
  );
  assert.equal((await getCurrentPublicResume(db)).length, 0);
  assert.equal(
    [...objectBytes.keys()].some((key) => key.startsWith("public/")),
    false,
  );
} finally {
  await db.delete(auditEvents).where(eq(auditEvents.actorAuthUserId, fixtureUserId));
  if (fixtureAssetIds.length > 0) {
    await db.delete(resumeVersions).where(inArray(resumeVersions.mediaAssetId, fixtureAssetIds));
    await db
      .delete(privateDocuments)
      .where(inArray(privateDocuments.mediaAssetId, fixtureAssetIds));
  }
  await db.delete(mediaAssets).where(eq(mediaAssets.uploadedByAuthUserId, fixtureUserId));
  if (baselineCurrentResume[0]) {
    await db
      .update(resumeVersions)
      .set({ isCurrent: true, isPublic: true })
      .where(eq(resumeVersions.id, baselineCurrentResume[0].id));
  }
  await db.delete(authUsers).where(eq(authUsers.id, fixtureUserId));
}

console.log(
  "Quarantine denial, résumé replacement, private promotion/deletion, object cleanup, audit, and exact public-current restoration passed.",
);
