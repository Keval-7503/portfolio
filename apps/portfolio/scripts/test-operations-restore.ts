import assert from "node:assert/strict";
import { eq } from "drizzle-orm";

import { createDb } from "../db/client";
import { homepageSections } from "../db/schema";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required.");
const db = createDb(databaseUrl);
const [original] = await db
  .select()
  .from(homepageSections)
  .where(eq(homepageSections.key, "about"))
  .limit(1);
if (!original) throw new Error("About section is required for the restore drill.");

const snapshot = structuredClone(original.configuration);
try {
  await db
    .update(homepageSections)
    .set({ configuration: { restoreDrill: crypto.randomUUID() }, updatedAt: new Date() })
    .where(eq(homepageSections.key, "about"));
  const [changed] = await db
    .select({ configuration: homepageSections.configuration })
    .from(homepageSections)
    .where(eq(homepageSections.key, "about"));
  assert.notDeepEqual(changed.configuration, snapshot);
} finally {
  await db
    .update(homepageSections)
    .set({ configuration: original.configuration, updatedAt: original.updatedAt })
    .where(eq(homepageSections.key, "about"));
}

const [restored] = await db
  .select()
  .from(homepageSections)
  .where(eq(homepageSections.key, "about"));
assert.deepEqual(restored.configuration, snapshot);
assert.equal(restored.updatedAt.getTime(), original.updatedAt.getTime());
console.log("Owner-content snapshot mutation and exact restoration passed.");
