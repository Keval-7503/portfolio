import assert from "node:assert/strict";

import { createDb } from "../db/client";
import {
  getHomepageSections,
  HOMEPAGE_SECTION_KEYS,
  saveHomepageSections,
} from "../lib/homepage/sections";
import { homepageSectionsInputSchema } from "../lib/homepage/input";
import { resolveSiteCopy } from "../lib/homepage/site-copy";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required.");
const db = createDb(databaseUrl);
const original = await getHomepageSections(db);

assert.equal(original.length, HOMEPAGE_SECTION_KEYS.length);
assert.equal(homepageSectionsInputSchema.safeParse(original).success, true);
assert.equal(
  homepageSectionsInputSchema.safeParse(original.map((entry) => ({ ...entry, sortOrder: 0 })))
    .success,
  false,
);

const changed = [...original].reverse().map((entry, sortOrder) => ({
  ...entry,
  enabled: entry.key !== "research",
  sortOrder,
  configuration:
    entry.key === "about"
      ? {
          ...entry.configuration,
          copy: {
            ...entry.configuration.copy,
            "home.heroIntro": "Reversible public copy verification.",
          },
        }
      : entry.key === "research"
        ? {
            ...entry.configuration,
            researchEntries: [
              {
                title: "Research manager verification",
                category: "Test",
                period: "2026",
                summary: "Reversible published research fixture.",
                url: "https://example.com/research-verification",
                isPublished: true,
              },
              {
                title: "Private research draft",
                category: "Test",
                period: "",
                summary: "This draft must remain private.",
                url: "",
                isPublished: false,
              },
            ],
          }
        : entry.configuration,
}));

try {
  await saveHomepageSections(changed, db);
  const observed = await getHomepageSections(db);
  assert.deepEqual(observed, changed);
  assert.equal(resolveSiteCopy(observed)["home.heroIntro"], "Reversible public copy verification.");
  assert.equal(
    observed
      .find((entry) => entry.key === "research")
      ?.configuration.researchEntries?.filter((entry) => entry.isPublished).length,
    1,
  );
} finally {
  await saveHomepageSections(original, db);
}

assert.deepEqual(await getHomepageSections(db), original);
console.log("Homepage ordering, visibility, validation, persistence, and restoration passed.");
