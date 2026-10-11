import { z } from "zod";

type Fetcher = typeof fetch;

const webhookSchema = z.string().url().startsWith("https://");

/** Sends a deliberately generic alert so repository data and credentials never leave the app. */
export async function sendGitHubSyncFailureAlert(
  configuredUrl: string | undefined,
  fetcher: Fetcher = fetch,
): Promise<"sent" | "not_configured" | "failed"> {
  const parsed = webhookSchema.safeParse(configuredUrl);
  if (!parsed.success) return "not_configured";

  try {
    const response = await fetcher(parsed.data, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: "Portfolio GitHub synchronization failed. Review the redacted sync history and Worker logs.",
        event: "github_sync_failed",
      }),
      signal: AbortSignal.timeout(8_000),
    });
    return response.ok ? "sent" : "failed";
  } catch {
    return "failed";
  }
}
