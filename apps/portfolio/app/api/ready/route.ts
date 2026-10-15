import { sql } from "drizzle-orm";

import { getDb } from "@/db";
import { logEvent } from "@/lib/observability/logger";
import { getRequestId, responseHeaders } from "@/lib/observability/request-id";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const startedAt = Date.now();
  const requestId = getRequestId(request.headers);
  try {
    await getDb().execute(sql`select 1`);
    logEvent("info", "readiness.check", {
      requestId,
      outcome: "ready",
      latencyMs: Date.now() - startedAt,
    });
    return Response.json(
      { status: "ready", checks: { database: "ready" } },
      { status: 200, headers: responseHeaders(requestId) },
    );
  } catch (error) {
    logEvent("error", "readiness.check", {
      requestId,
      outcome: "unavailable",
      errorCode: "DATABASE_UNAVAILABLE",
      error,
      latencyMs: Date.now() - startedAt,
    });
    return Response.json(
      { status: "unavailable", checks: { database: "unavailable" } },
      { status: 503, headers: responseHeaders(requestId) },
    );
  }
}
