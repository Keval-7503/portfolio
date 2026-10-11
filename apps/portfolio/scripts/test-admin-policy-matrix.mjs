import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";

async function filesBelow(directory, filename) {
  const found = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) found.push(...(await filesBelow(path, filename)));
    else if (entry.name === filename) found.push(path);
  }
  return found;
}

const apiRoot = join(process.cwd(), "app", "api", "admin");
const routes = await filesBelow(apiRoot, "route.ts");
assert.ok(routes.length >= 9, "Expected every protected admin API route in the matrix.");
for (const route of routes) {
  const source = await readFile(route, "utf8");
  assert.match(source, /getAuthorizedAdmin\s*\(/, `${relative(apiRoot, route)} lacks central auth`);
  if (/export async function (POST|PUT|PATCH|DELETE)/.test(source)) {
    assert.match(
      source,
      /hasTrustedMutationOrigin\s*\(/,
      `${relative(apiRoot, route)} lacks same-origin enforcement`,
    );
  }
}

const pageRoot = join(process.cwd(), "app", "admin");
const publicFlowPages = new Set([
  join(pageRoot, "login", "page.tsx"),
  join(pageRoot, "two-factor", "page.tsx"),
  join(pageRoot, "reauthenticate", "page.tsx"),
  join(pageRoot, "forbidden", "page.tsx"),
]);
const pages = await filesBelow(pageRoot, "page.tsx");
for (const page of pages) {
  if (publicFlowPages.has(page)) continue;
  const source = await readFile(page, "utf8");
  assert.match(source, /requireAdmin\s*\(/, `${relative(pageRoot, page)} lacks page policy`);
}

console.log(
  `Admin policy matrix passed for ${routes.length} API routes and ${pages.length - publicFlowPages.size} protected pages.`,
);
