import { and, count, eq, gte } from "drizzle-orm";

import type { Database } from "@/db/client";
import { contactMessages } from "@/db/schema";

export async function isContactRateLimited(
  db: Database,
  ipHash: string,
  now = new Date(),
): Promise<boolean> {
  const [recent] = await db
    .select({ value: count() })
    .from(contactMessages)
    .where(
      and(
        eq(contactMessages.ipHash, ipHash),
        gte(contactMessages.createdAt, new Date(now.getTime() - 3_600_000)),
      ),
    );
  return (recent?.value ?? 0) >= 5;
}
