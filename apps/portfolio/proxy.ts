import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getRequestId } from "@/lib/observability/request-id";

export function buildContentSecurityPolicy(nonce: string) {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "connect-src 'self' https://challenges.cloudflare.com",
    "font-src 'self' data:",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "frame-src https://challenges.cloudflare.com",
    "img-src 'self' data:",
    "object-src 'none'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://challenges.cloudflare.com`,
    "style-src 'self' 'unsafe-inline'",
  ].join("; ");
}

export function proxy(request: NextRequest) {
  const requestId = getRequestId(request.headers);
  const nonce = crypto.randomUUID();
  const forwardedHeaders = new Headers(request.headers);
  forwardedHeaders.set("x-request-id", requestId);
  forwardedHeaders.set("x-nonce", nonce);
  const response = NextResponse.next({ request: { headers: forwardedHeaders } });
  response.headers.set("X-Request-Id", requestId);
  response.headers.set("Content-Security-Policy", buildContentSecurityPolicy(nonce));
  response.headers.set(
    "Permissions-Policy",
    "camera=(), geolocation=(), microphone=(), payment=(), usb=()",
  );
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");

  if (
    request.nextUrl.pathname.startsWith("/admin") ||
    request.nextUrl.pathname.startsWith("/api/auth")
  ) {
    response.headers.set("Cache-Control", "private, no-store");
  }

  if (
    request.nextUrl.pathname.startsWith("/admin") ||
    request.nextUrl.pathname.startsWith("/api/")
  ) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.svg).*)"],
};
