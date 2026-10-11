import assert from "node:assert/strict";
import { sendContactNotification, verifyTurnstile } from "../lib/contact/integrations";

assert.equal(
  await verifyTurnstile({ secret: undefined, token: undefined, remoteIp: "127.0.0.1" }),
  true,
);
assert.equal(
  await verifyTurnstile({ secret: "secret", token: undefined, remoteIp: "127.0.0.1" }),
  false,
);
assert.equal(
  await verifyTurnstile({
    secret: "secret",
    token: "valid",
    remoteIp: "127.0.0.1",
    fetcher: async () => Response.json({ success: true }),
  }),
  true,
);
assert.equal(
  await verifyTurnstile({
    secret: "secret",
    token: "invalid",
    remoteIp: "127.0.0.1",
    fetcher: async () => Response.json({ success: false }),
  }),
  false,
);

assert.equal(
  await sendContactNotification({
    apiKey: undefined,
    from: undefined,
    ownerEmail: "owner@example.test",
  }),
  "not_configured",
);
let notificationBody = "";
assert.equal(
  await sendContactNotification({
    apiKey: "test-key",
    from: "Portfolio <portfolio@example.test>",
    ownerEmail: "owner@example.test",
    fetcher: async (_url, init) => {
      notificationBody = String(init?.body);
      return new Response(null, { status: 202 });
    },
  }),
  "sent",
);
assert.match(notificationBody, /owner@example\.test/);
assert.doesNotMatch(notificationBody, /message body|reply-to|visitor/i);

console.log("Turnstile fail-closed behavior and private generic owner notification passed.");
