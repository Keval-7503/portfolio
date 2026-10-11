import { z } from "zod";

type Fetcher = typeof fetch;

const turnstileResponseSchema = z.object({ success: z.boolean() });

export async function verifyTurnstile(input: {
  secret: string | undefined;
  token: string | undefined;
  remoteIp: string;
  fetcher?: Fetcher;
}): Promise<boolean> {
  if (!input.secret) return true;
  if (!input.token) return false;
  const response = await (input.fetcher ?? fetch)(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: input.secret,
        response: input.token,
        remoteip: input.remoteIp,
      }),
      signal: AbortSignal.timeout(8_000),
    },
  ).catch(() => null);
  if (!response?.ok) return false;
  const parsed = turnstileResponseSchema.safeParse(await response.json().catch(() => null));
  return parsed.success && parsed.data.success;
}

export async function sendContactNotification(input: {
  apiKey: string | undefined;
  from: string | undefined;
  ownerEmail: string;
  fetcher?: Fetcher;
}): Promise<"sent" | "not_configured" | "failed"> {
  if (!input.apiKey || !input.from) return "not_configured";
  const response = await (input.fetcher ?? fetch)("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: input.from,
      to: [input.ownerEmail],
      subject: "New portfolio inbox message",
      text: "A new message is stored in your private portfolio inbox. Sign in to review it.",
    }),
    signal: AbortSignal.timeout(8_000),
  }).catch(() => null);
  return response?.ok ? "sent" : "failed";
}
