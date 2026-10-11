import assert from "node:assert/strict";

import { redactLogContext } from "../lib/observability/logger";
import { getRequestId } from "../lib/observability/request-id";

const suppliedRequestId = "3d4eae89-90f7-4ee2-9ccd-63c32f81b714";
assert.equal(getRequestId(new Headers({ "x-request-id": suppliedRequestId })), suppliedRequestId);
assert.match(getRequestId(new Headers({ "x-request-id": "not-a-uuid" })), /^[0-9a-f-]{36}$/);

const redacted = redactLogContext({
  requestId: suppliedRequestId,
  authorization: "Bearer must-not-appear",
  nested: {
    password: "must-not-appear",
    database: ["postgresql://owner", ":must-not-appear", "@example.invalid/db"].join(""),
    safeErrorCode: "EXPECTED_FAILURE",
  },
});
const serialized = JSON.stringify(redacted);
assert.equal(serialized.includes("must-not-appear"), false);
assert.equal(serialized.includes("EXPECTED_FAILURE"), true);
assert.equal(redacted.authorization, "[REDACTED]");

console.log("Request ID validation and recursive log redaction checks passed.");
