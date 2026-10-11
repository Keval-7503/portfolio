import { revalidatePath } from "next/cache";

import { getAuthorizedAdmin } from "@/lib/auth/policy";
import { getAuthEnvironment } from "@/lib/env";
import { homepageSectionsInputSchema } from "@/lib/homepage/input";
import { saveHomepageSections } from "@/lib/homepage/sections";
import { hasTrustedMutationOrigin } from "@/lib/security/request";

export const dynamic = "force-dynamic";

function json(body: unknown, status: number) {
  return Response.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}

export async function PUT(request: Request) {
  const environment = getAuthEnvironment();
  if (!hasTrustedMutationOrigin(request, environment.APP_ORIGIN)) {
    return json({ error: "untrusted_origin" }, 403);
  }
  const authorization = await getAuthorizedAdmin(request.headers);
  if (!authorization) return json({ error: "unauthorized" }, 401);

  const parsed = homepageSectionsInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return json(
      {
        error: "invalid_sections",
        message: issue
          ? `Could not save ${issue.path.join(" → ") || "homepage settings"}: ${issue.message}`
          : "Homepage settings are invalid.",
      },
      400,
    );
  }

  await saveHomepageSections(parsed.data);
  revalidatePath("/");
  revalidatePath("/admin");
  return json({ status: "saved" }, 200);
}
