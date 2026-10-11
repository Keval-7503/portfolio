import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const environmentPath = path.join(projectRoot, ".env");
const ownerEmail = process.env.LOCAL_ADMIN_EMAIL?.trim().toLowerCase();
if (!ownerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail)) {
  throw new Error("A valid owner email is required.");
}

const source = readFileSync(environmentPath, "utf8");
const lines = source.split(/\r?\n/);
const values = new Map();
for (const line of lines) {
  const match = /^([A-Z][A-Z0-9_]*)=(.*)$/.exec(line);
  if (match) values.set(match[1], match[2]);
}

values.set("APP_ORIGIN", values.get("APP_ORIGIN") || "http://127.0.0.1:8787");
values.set("ADMIN_EMAIL_ALLOWLIST", ownerEmail);
values.set(
  "BETTER_AUTH_SECRET",
  values.get("BETTER_AUTH_SECRET") || randomBytes(48).toString("base64url"),
);

const updated = lines.map((line) => {
  const match = /^([A-Z][A-Z0-9_]*)=/.exec(line);
  return match && values.has(match[1]) ? `${match[1]}=${values.get(match[1])}` : line;
});
for (const key of ["APP_ORIGIN", "ADMIN_EMAIL_ALLOWLIST", "BETTER_AUTH_SECRET"]) {
  if (!lines.some((line) => line.startsWith(`${key}=`))) updated.push(`${key}=${values.get(key)}`);
}
writeFileSync(environmentPath, `${updated.join("\n").replace(/\n+$/, "")}\n`, {
  encoding: "utf8",
  mode: 0o600,
});
console.log("Local owner authentication settings are configured.");
