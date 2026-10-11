import { desc } from "drizzle-orm";

import { getDb } from "@/db";
import { contactMessages } from "@/db/schema";

export function listContactMessages() {
  return getDb()
    .select({
      id: contactMessages.id,
      name: contactMessages.name,
      email: contactMessages.email,
      subject: contactMessages.subject,
      body: contactMessages.body,
      status: contactMessages.status,
      createdAt: contactMessages.createdAt,
    })
    .from(contactMessages)
    .orderBy(desc(contactMessages.createdAt))
    .limit(100);
}
