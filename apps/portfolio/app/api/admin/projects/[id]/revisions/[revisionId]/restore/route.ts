import { revalidatePath } from "next/cache";

import { restoreProjectRevision } from "@/lib/admin/projects";
import { getAuthorizedAdmin } from "@/lib/auth/policy";
import { getAuthEnvironment } from "@/lib/env";
import { hasTrustedMutationOrigin } from "@/lib/security/request";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string; revisionId: string }> };

function json(body: unknown, status: number) {
  return Response.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request, context: RouteContext) {
  const environment = getAuthEnvironment();
  if (!hasTrustedMutationOrigin(request, environment.APP_ORIGIN))
    return json({ error: "untrusted_origin" }, 403);
  const authorization = await getAuthorizedAdmin(request.headers);
  if (!authorization) return json({ error: "unauthorized" }, 401);
  const { id, revisionId } = await context.params;
  const restored = await restoreProjectRevision(id, revisionId, authorization.session.user.id);
  if (!restored) return json({ error: "not_found" }, 404);
  revalidatePath("/");
  revalidatePath(`/projects/${restored.slug}`);
  revalidatePath(`/admin/projects/${id}`);
  return json({ status: "restored" }, 200);
}
