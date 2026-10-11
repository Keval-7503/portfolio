import { env } from "cloudflare:workers";
import { z } from "zod";

import { getAuthorizedAdmin } from "@/lib/auth/policy";
import { getReadablePrivateDocument } from "@/lib/documents/access";
import { getRequestId } from "@/lib/observability/request-id";

export const dynamic = "force-dynamic";
type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const requestId = getRequestId(request.headers);
  if (!(await getAuthorizedAdmin(request.headers))) {
    return Response.json(
      { error: "unauthorized" },
      { status: 401, headers: { "Cache-Control": "private, no-store", "X-Request-Id": requestId } },
    );
  }
  const parsedId = z
    .string()
    .uuid()
    .safeParse((await context.params).id);
  if (!parsedId.success || !env.BUCKET) return new Response(null, { status: 404 });
  const [document] = await getReadablePrivateDocument(parsedId.data);
  if (!document) return new Response(null, { status: 404 });
  const object = await env.BUCKET.get(document.objectKey);
  if (!object) return new Response(null, { status: 404 });

  return new Response(object.body, {
    status: 200,
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="${document.safeFilename}"`,
      "Content-Length": String(object.size),
      "Content-Type": "application/pdf",
      "X-Content-Type-Options": "nosniff",
      "X-Request-Id": requestId,
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}
