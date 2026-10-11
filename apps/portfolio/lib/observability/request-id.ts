const REQUEST_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function getRequestId(headers: Headers): string {
  const supplied = headers.get("x-request-id")?.trim();
  return supplied && REQUEST_ID_PATTERN.test(supplied) ? supplied : crypto.randomUUID();
}

export function responseHeaders(requestId: string): HeadersInit {
  return {
    "Cache-Control": "no-store",
    "X-Request-Id": requestId,
  };
}
