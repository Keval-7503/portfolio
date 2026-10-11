import { getGitHubSyncSecret } from "@/lib/env";
import { synchronizeConfiguredGitHubAccount } from "@/lib/github/sync-configured";
import { isValidBearerCredential } from "@/lib/service-auth";

export const dynamic = "force-dynamic";

function json(body: unknown, status: number): Response {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request): Promise<Response> {
  let secret: string;
  try {
    secret = getGitHubSyncSecret();
  } catch {
    return json({ error: "sync_unavailable" }, 503);
  }

  if (!(await isValidBearerCredential(request.headers.get("authorization"), secret))) {
    return json({ error: "unauthorized" }, 401);
  }

  try {
    const result = await synchronizeConfiguredGitHubAccount("scheduled");
    return json(result, result.status === "busy" ? 409 : 200);
  } catch {
    return json({ error: "sync_failed" }, 502);
  }
}
