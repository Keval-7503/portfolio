import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";

import { createDb } from "../db/client";
import { contactMessages } from "../db/schema";
import { contactInputSchema } from "../lib/contact/input";
import { isContactRateLimited } from "../lib/contact/rate-limit";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required.");
const db = createDb(databaseUrl);
const ipHash = randomBytes(32).toString("hex");

assert.equal(
  contactInputSchema.safeParse({
    name: "Bot",
    email: "bot@example.test",
    subject: "Spam",
    message: "This should be rejected by the honeypot.",
    website: "https://spam.example.test",
  }).success,
  false,
);

try {
  assert.equal(await isContactRateLimited(db, ipHash), false);
  await db.insert(contactMessages).values(
    Array.from({ length: 5 }, (_, index) => ({
      name: "Rate fixture",
      email: "fixture@example.test",
      subject: `Rate fixture ${index}`,
      body: "A reversible contact rate-limit fixture.",
      ipHash,
      userAgentHash: randomBytes(32).toString("hex"),
    })),
  );
  assert.equal(await isContactRateLimited(db, ipHash), true);
} finally {
  await db.delete(contactMessages).where(eq(contactMessages.ipHash, ipHash));
}

assert.equal(await isContactRateLimited(db, ipHash), false);
console.log("Contact honeypot, five-per-hour limit, and exact fixture cleanup passed.");
