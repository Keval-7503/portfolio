import { env } from "cloudflare:workers";

import { getCurrentPublicResume } from "@/lib/documents/access";
import { getRequestId } from "@/lib/observability/request-id";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request.headers);
  if (!env.BUCKET) return new Response(null, { status: 404 });
  const [resume] = await getCurrentPublicResume();
  if (!resume) return new Response(null, { status: 404 });
  const object = await env.BUCKET.get(resume.objectKey);
  if (!object) return new Response(null, { status: 404 });
  const download = new URL(request.url).searchParams.get("download") === "1";

  return new Response(object.body, {
    status: 200,
    headers: {
      "Cache-Control": "public, max-age=0, must-revalidate",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${resume.safeFilename}"`,
      "Content-Length": String(object.size),
      "Content-Type": "application/pdf",
      ETag: `"${resume.sha256}"`,
      "X-Content-Type-Options": "nosniff",
      "X-Request-Id": requestId,
    },
  });
}
