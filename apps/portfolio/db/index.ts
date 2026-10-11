import { getServerEnvironment } from "@/lib/env";
import { createDb } from "./client";

export { createDb } from "./client";
export type { Database } from "./client";

export function getDb() {
  const { DATABASE_URL } = getServerEnvironment();
  return createDb(DATABASE_URL);
}
