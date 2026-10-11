import assert from "node:assert/strict";
import { sendGitHubSyncFailureAlert } from "../lib/github/sync-alert";

assert.equal(await sendGitHubSyncFailureAlert(undefined), "not_configured");
assert.equal(await sendGitHubSyncFailureAlert("http://unsafe.example.test/hook"), "not_configured");

let capturedBody = "";
const sent = await sendGitHubSyncFailureAlert(
  "https://alerts.example.test/hook",
  async (_input, init) => {
    capturedBody = String(init?.body ?? "");
    return new Response(null, { status: 204 });
  },
);
assert.equal(sent, "sent");
assert.match(capturedBody, /github_sync_failed/);
assert.doesNotMatch(capturedBody, /token|secret|authorization|repository/i);

const failed = await sendGitHubSyncFailureAlert(
  "https://alerts.example.test/hook",
  async () => new Response(null, { status: 500 }),
);
assert.equal(failed, "failed");

console.log("GitHub sync alert validation, redaction, delivery, and failure handling passed.");
