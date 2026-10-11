import { z } from "zod";

import { getAuthorizedAdmin } from "@/lib/auth/policy";
import { getAuthEnvironment } from "@/lib/env";
import { getRequestId, responseHeaders } from "@/lib/observability/request-id";
import { hasTrustedMutationOrigin } from "@/lib/security/request";
import { promoteCleanAsset } from "@/lib/uploads/storage";

export const dynamic = "force-dynamic";
type RouteContext = { params: Promise<{ id: string }> };

function json(body: unknown, status: number, requestId: string) {
  return Response.json(body, {
    status,
    headers: { ...responseHeaders(requestId), "Cache-Control": "private, no-store" },
  });
}

export async function POST(request: Request, context: RouteContext) {
  const requestId = getRequestId(request.headers);
  const environment = getAuthEnvironment();
  if (!hasTrustedMutationOrigin(request, environment.APP_ORIGIN))
    return json({ error: "untrusted_origin" }, 403, requestId);
  const authorization = await getAuthorizedAdmin(request.headers, { requireFresh: true });
  if (!authorization) return json({ error: "reauthentication_required" }, 401, requestId);
  const input = z
    .object({ action: z.enum(["accept_private", "publish_resume"]) })
    .safeParse(await request.json().catch(() => null));
  if (!input.success) return json({ error: "invalid_action" }, 400, requestId);
  const { id } = await context.params;
  const result = await promoteCleanAsset({
    id,
    action: input.data.action,
    actorAuthUserId: authorization.session.user.id,
    correlationId: requestId,
  });
  if (result === "not_found") return json({ error: "not_found" }, 404, requestId);
  if (result === "invalid_action") return json({ error: "invalid_action" }, 409, requestId);
  return json({ status: "promoted" }, 200, requestId);
}
