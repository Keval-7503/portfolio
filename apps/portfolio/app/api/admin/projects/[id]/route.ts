import { revalidatePath } from "next/cache";

import { projectUpdateSchema } from "@/lib/admin/project-input";
import { deleteManualProject, updateAdminProject } from "@/lib/admin/projects";
import { getAuthorizedAdmin } from "@/lib/auth/policy";
import { getAuthEnvironment } from "@/lib/env";
import { hasTrustedMutationOrigin } from "@/lib/security/request";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

function json(body: unknown, status: number) {
  return Response.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}

export async function PATCH(request: Request, context: RouteContext) {
  const environment = getAuthEnvironment();
  if (!hasTrustedMutationOrigin(request, environment.APP_ORIGIN)) {
    return json({ error: "untrusted_origin" }, 403);
  }

  const authorization = await getAuthorizedAdmin(request.headers);
  if (!authorization) return json({ error: "unauthorized" }, 401);

  const parsed = projectUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "invalid_project" }, 400);

  const { id } = await context.params;
  const updated = await updateAdminProject(id, parsed.data, authorization.session.user.id);
  if (!updated) return json({ error: "not_found" }, 404);

  revalidatePath("/");
  revalidatePath(`/projects/${updated.slug}`);
  revalidatePath("/admin");
  return json({ status: "saved", id: updated.id }, 200);
}

export async function DELETE(request: Request, context: RouteContext) {
  const environment = getAuthEnvironment();
  if (!hasTrustedMutationOrigin(request, environment.APP_ORIGIN))
    return json({ error: "untrusted_origin" }, 403);
  const authorization = await getAuthorizedAdmin(request.headers, { requireFresh: true });
  if (!authorization) return json({ error: "reauthentication_required" }, 401);
  const { id } = await context.params;
  const result = await deleteManualProject(id, authorization.session.user.id);
  if (result === "not_found") return json({ error: "not_found" }, 404);
  if (result === "source_managed") return json({ error: "source_managed" }, 409);
  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath(`/projects/${result.slug}`);
  revalidatePath("/admin");
  return json({ status: "deleted" }, 200);
}
