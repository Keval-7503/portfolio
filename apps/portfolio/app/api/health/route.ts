import { getRequestId, responseHeaders } from "@/lib/observability/request-id";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const requestId = getRequestId(request.headers);
  return Response.json(
    { status: "ok", service: "portfolio" },
    { status: 200, headers: responseHeaders(requestId) },
  );
}
