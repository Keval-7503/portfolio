import { eq } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db";
import { contactMessages } from "@/db/schema";
import { getAuthorizedAdmin } from "@/lib/auth/policy";
import { getAuthEnvironment } from "@/lib/env";
import { hasTrustedMutationOrigin } from "@/lib/security/request";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const environment = getAuthEnvironment();
  if (!hasTrustedMutationOrigin(request, environment.APP_ORIGIN))
    return Response.json({ error: "untrusted_origin" }, { status: 403 });
  const authorization = await getAuthorizedAdmin(request.headers);
  if (!authorization) return Response.json({ error: "unauthorized" }, { status: 401 });
  const parsed = z
    .object({ status: z.enum(["new", "read", "archived"]) })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid_status" }, { status: 400 });
  const { id } = await context.params;
  const [updated] = await getDb()
    .update(contactMessages)
    .set({ status: parsed.data.status, updatedAt: new Date() })
    .where(eq(contactMessages.id, id))
    .returning({ id: contactMessages.id });
  return updated
    ? Response.json({ status: "updated" }, { headers: { "Cache-Control": "private, no-store" } })
    : Response.json({ error: "not_found" }, { status: 404 });
}
