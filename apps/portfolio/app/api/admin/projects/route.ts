import { revalidatePath } from "next/cache";

import { projectCreateSchema } from "@/lib/admin/project-input";
import { createAdminProject } from "@/lib/admin/projects";
import { getAuthorizedAdmin } from "@/lib/auth/policy";
import { getAuthEnvironment } from "@/lib/env";
import { hasTrustedMutationOrigin } from "@/lib/security/request";

export const dynamic = "force-dynamic";

function json(body: unknown, status: number) {
  return Response.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  const environment = getAuthEnvironment();
  if (!hasTrustedMutationOrigin(request, environment.APP_ORIGIN))
    return json({ error: "untrusted_origin" }, 403);
  const authorization = await getAuthorizedAdmin(request.headers);
  if (!authorization) return json({ error: "unauthorized" }, 401);
  const parsed = projectCreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "invalid_project" }, 400);
  const created = await createAdminProject(parsed.data, authorization.session.user.id);
  revalidatePath("/admin");
  return json({ status: "created", ...created }, 201);
}
