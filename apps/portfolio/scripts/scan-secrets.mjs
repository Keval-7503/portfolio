import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const ignoredDirectories = new Set([
  ".git",
  ".next",
  ".vinext",
  ".wrangler",
  ".sites-runtime",
  "coverage",
  "dist",
  "node_modules",
]);
const ignoredNames = new Set(["package-lock.json"]);
const textExtensions = new Set([
  ".css",
  ".html",
  ".js",
  ".json",
  ".md",
  ".mjs",
  ".sql",
  ".ts",
  ".tsx",
  ".txt",
  ".yaml",
  ".yml",
]);
const signatures = [
  ["private key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ["GitHub token", /gh[opusr]_[A-Za-z0-9_]{20,}/],
  ["OpenAI key", /sk-(?:proj-)?[A-Za-z0-9_-]{20,}/],
  ["AWS access key", /AKIA[0-9A-Z]{16}/],
  ["credential-bearing PostgreSQL URL", /postgres(?:ql)?:\/\/[^\s:@/]+:[^\s@/]+@/i],
];

async function filesUnder(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    if (entry.name === ".env" || entry.name.startsWith(".env.")) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await filesUnder(absolute)));
    else if (!ignoredNames.has(entry.name) && textExtensions.has(path.extname(entry.name)))
      files.push(absolute);
  }
  return files;
}

const findings = [];
for (const file of await filesUnder(root)) {
  const contents = await readFile(file, "utf8");
  for (const [label, signature] of signatures) {
    if (signature.test(contents)) findings.push(`${path.relative(root, file)}: ${label}`);
  }
}

if (findings.length > 0) {
  console.error("Potential committed secrets detected:\n" + findings.join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    "Secret scan passed; no high-confidence credential signatures found in source files.",
  );
}
