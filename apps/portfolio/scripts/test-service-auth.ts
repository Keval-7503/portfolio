import assert from "node:assert/strict";

import { isValidBearerCredential } from "../lib/service-auth";

const secret = "fixture-secret-with-at-least-32-characters";
assert.equal(await isValidBearerCredential(`Bearer ${secret}`, secret), true);
assert.equal(await isValidBearerCredential("Bearer incorrect", secret), false);
assert.equal(await isValidBearerCredential("Basic incorrect", secret), false);
assert.equal(await isValidBearerCredential(null, secret), false);

console.log("Service bearer credential checks passed.");
