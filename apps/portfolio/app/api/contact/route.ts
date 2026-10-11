import { getDb } from "@/db";
import { contactMessages } from "@/db/schema";
import { contactInputSchema } from "@/lib/contact/input";
import { sendContactNotification, verifyTurnstile } from "@/lib/contact/integrations";
import { isContactRateLimited } from "@/lib/contact/rate-limit";
import { getAuthEnvironment, getContactIntegrationEnvironment } from "@/lib/env";
import { hasTrustedMutationOrigin } from "@/lib/security/request";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const environment = getAuthEnvironment();
  if (!hasTrustedMutationOrigin(request, environment.APP_ORIGIN))
    return Response.json({ error: "untrusted_origin" }, { status: 403 });
  const parsed = contactInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid_message" }, { status: 400 });
  const ip =
    request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for") ?? "local";
  const userAgent = request.headers.get("user-agent") ?? "unknown";
  const integrations = getContactIntegrationEnvironment();
  const turnstileValid = await verifyTurnstile({
    secret: integrations.turnstileSecret,
    token: parsed.data["cf-turnstile-response"],
    remoteIp: ip.split(",")[0]!.trim(),
  });
  if (!turnstileValid) return Response.json({ error: "challenge_failed" }, { status: 400 });
  const hash = async (value: string) => {
    const bytes = new TextEncoder().encode(`${environment.BETTER_AUTH_SECRET}:${value}`);
    return [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))]
      .map((part) => part.toString(16).padStart(2, "0"))
      .join("");
  };
  const ipHash = await hash(ip.split(",")[0]!.trim());
  const db = getDb();
  if (await isContactRateLimited(db, ipHash))
    return Response.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": "3600" } },
    );
  await db.insert(contactMessages).values({
    name: parsed.data.name,
    email: parsed.data.email.toLowerCase(),
    subject: parsed.data.subject,
    body: parsed.data.message,
    ipHash,
    userAgentHash: await hash(userAgent),
  });
  const notification = await sendContactNotification({
    apiKey: integrations.resendApiKey,
    from: integrations.notificationFrom,
    ownerEmail: environment.ADMIN_EMAIL_ALLOWLIST[0]!,
  });
  return Response.json(
    { status: "received", notification },
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );
}
