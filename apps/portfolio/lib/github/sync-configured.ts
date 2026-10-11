import { getDb } from "@/db";
import { getGitHubEnvironment } from "@/lib/env";
import { synchronizeGitHubAccount } from "./sync";

type SyncTrigger = "manual" | "scheduled" | "bootstrap";

export async function synchronizeConfiguredGitHubAccount(trigger: SyncTrigger) {
  const environment = getGitHubEnvironment();
  return synchronizeGitHubAccount(getDb(), {
    username: environment.GITHUB_USERNAME,
    expectedAccountId: environment.GITHUB_ACCOUNT_ID,
    trigger,
    token: environment.GITHUB_TOKEN,
  });
}
