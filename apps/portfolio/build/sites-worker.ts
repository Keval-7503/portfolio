import handler from "vinext/server/fetch-handler";
import { runWithConnectorBinding } from "../lib/connector-context";
import type { ConnectorBinding } from "../lib/connector-contract.mjs";
import { sendGitHubSyncFailureAlert } from "../lib/github/sync-alert";
import { synchronizeConfiguredGitHubAccount } from "../lib/github/sync-configured";

async function runScheduledGitHubSync(env: Cloudflare.Env): Promise<void> {
  try {
    const result = await synchronizeConfiguredGitHubAccount("scheduled");
    console.info(
      JSON.stringify({
        event: "github_sync_scheduled",
        status: result.status,
        observed: result.observed,
        created: result.created,
        missing: result.missing,
      }),
    );
  } catch {
    console.error(JSON.stringify({ event: "github_sync_scheduled", status: "failed" }));
    await sendGitHubSyncFailureAlert(env.GITHUB_SYNC_ALERT_WEBHOOK_URL);
    throw new Error("Scheduled GitHub synchronization failed.");
  }
}

export default {
  fetch(
    request: Request,
    env: Cloudflare.Env,
    ctx: ExecutionContext<{ CONNECTORS?: ConnectorBinding }>,
  ) {
    let binding = ctx.props?.CONNECTORS;
    // Local preview emulates the same request-scoped capability. This branch and
    // the auxiliary service binding are absent from production builds.
    if (import.meta.env.DEV && !binding && env.CONNECTORS) {
      const preview = env.CONNECTORS;
      const expiresAt = Date.now() + 60_000;
      binding = {
        async getContext() {
          if (Date.now() >= expiresAt) return { status: "request_context_expired" };
          return preview.getContext?.() ?? { status: "binding_unavailable" };
        },
        async invoke(connectorId, actionName, args) {
          if (Date.now() >= expiresAt) {
            return {
              status: "request_context_expired",
              message: "This request has expired. Please try again.",
            };
          }
          return preview.invoke(connectorId, actionName, args);
        },
      };
    }
    return runWithConnectorBinding(binding, () => handler.fetch(request, env, ctx));
  },
  scheduled(_controller: ScheduledController, env: Cloudflare.Env, ctx: ExecutionContext) {
    ctx.waitUntil(runScheduledGitHubSync(env));
  },
};
