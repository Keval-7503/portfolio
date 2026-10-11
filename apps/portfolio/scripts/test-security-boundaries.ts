import { hasTrustedMutationOrigin } from "../lib/security/request";
import { allowedProviderUrl, safeExternalUrl } from "../lib/security/urls";
import { safeAdminReturnPath } from "../lib/auth/return-path";
import { buildContentSecurityPolicy } from "../proxy";

const origin = "http://127.0.0.1:8787";
const sameOrigin = new Request(`${origin}/admin/projects`, {
  method: "POST",
  headers: { origin, "sec-fetch-site": "same-origin" },
});
const crossOrigin = new Request(`${origin}/admin/projects`, {
  method: "POST",
  headers: { origin: "https://attacker.example", "sec-fetch-site": "cross-site" },
});
const missingOrigin = new Request(`${origin}/admin/projects`, { method: "POST" });

if (!hasTrustedMutationOrigin(sameOrigin, origin))
  throw new Error("Same-origin mutation rejected.");
if (hasTrustedMutationOrigin(crossOrigin, origin))
  throw new Error("Cross-origin mutation accepted.");
if (hasTrustedMutationOrigin(missingOrigin, origin))
  throw new Error("Originless mutation accepted.");
if (safeExternalUrl("javascript:alert(1)") !== null)
  throw new Error("Unsafe display URL accepted.");
if (safeExternalUrl("https://user:pass@example.com") !== null)
  throw new Error("Credential URL accepted.");
if (!safeExternalUrl("https://example.com/project")) throw new Error("Safe display URL rejected.");
if (safeAdminReturnPath("/admin/documents?tab=private") !== "/admin/documents?tab=private")
  throw new Error("Safe admin return path rejected.");
for (const blockedReturnPath of [
  "https://attacker.example/admin",
  "//attacker.example/admin",
  "/projects",
  "/administrator",
  "/admin/login",
]) {
  if (safeAdminReturnPath(blockedReturnPath) !== "/admin")
    throw new Error("Unsafe admin return path accepted.");
}
allowedProviderUrl("https://api.github.com/repos/example/project");
for (const blocked of [
  "http://api.github.com/repos/example/project",
  "https://127.0.0.1/internal",
  "https://api.github.com.evil.example/",
]) {
  try {
    allowedProviderUrl(blocked);
    throw new Error("Unsafe provider URL accepted.");
  } catch (error) {
    if (error instanceof Error && error.message === "Unsafe provider URL accepted.") throw error;
  }
}

const csp = buildContentSecurityPolicy("test-nonce");
if (!csp.includes("'nonce-test-nonce'") || !csp.includes("'strict-dynamic'"))
  throw new Error("Nonce CSP is missing.");
if (csp.includes("script-src 'self' 'unsafe-inline'"))
  throw new Error("Unsafe inline script policy remains.");

console.log(JSON.stringify({ status: "ready", csrf: "deny-by-default", urls: "restricted" }));
