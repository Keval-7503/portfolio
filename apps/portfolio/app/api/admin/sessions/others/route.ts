import { getDb } from "@/db";
import { getAuthorizedAdmin } from "@/lib/auth/policy";
import { revokeOtherAdminSessions } from "@/lib/auth/session-security";
import { getAuthEnvironment } from "@/lib/env";
import { hasTrustedMutationOrigin } from "@/lib/security/request";

export const dynamic = "force-dynamic";

function json(body: unknown, status: number) {
  return Response.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}

export async function DELETE(request: Request) {
  const environment = getAuthEnvironment();
  if (!hasTrustedMutationOrigin(request, environment.APP_ORIGIN)) {
    return json({ error: "untrusted_origin" }, 403);
  }

  const authorization = await getAuthorizedAdmin(request.headers, { requireFresh: true });
  if (!authorization) return json({ error: "reauthentication_required" }, 401);

  const revoked = await revokeOtherAdminSessions(
    getDb(),
    authorization.session.user.id,
    authorization.session.session.id,
  );
  return json({ status: "revoked", revoked }, 200);
}
