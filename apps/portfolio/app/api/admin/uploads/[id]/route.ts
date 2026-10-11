import { getAuthorizedAdmin } from "@/lib/auth/policy";
import { getAuthEnvironment } from "@/lib/env";
import { getRequestId, responseHeaders } from "@/lib/observability/request-id";
import { hasTrustedMutationOrigin } from "@/lib/security/request";
import { deleteManagedAsset } from "@/lib/uploads/storage";

export const dynamic = "force-dynamic";
type RouteContext = { params: Promise<{ id: string }> };

function json(body: unknown, status: number, requestId: string) {
  return Response.json(body, {
    status,
    headers: { ...responseHeaders(requestId), "Cache-Control": "private, no-store" },
  });
}

export async function DELETE(request: Request, context: RouteContext) {
  const requestId = getRequestId(request.headers);
  const environment = getAuthEnvironment();
  if (!hasTrustedMutationOrigin(request, environment.APP_ORIGIN))
    return json({ error: "untrusted_origin" }, 403, requestId);
  const authorization = await getAuthorizedAdmin(request.headers, { requireFresh: true });
  if (!authorization) return json({ error: "reauthentication_required" }, 401, requestId);
  const { id } = await context.params;
  const deleted = await deleteManagedAsset({
    id,
    actorAuthUserId: authorization.session.user.id,
    correlationId: requestId,
  });
  return deleted
    ? json({ status: "deleted" }, 200, requestId)
    : json({ error: "not_found" }, 404, requestId);
}
