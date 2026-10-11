import assert from "node:assert/strict";

import { fetchGitHubSnapshot, GitHubApiError } from "../lib/github/client";

const profile = {
  id: 80451128,
  login: "Keval-7503",
  html_url: "https://github.com/Keval-7503",
  name: "Keval Patel",
  bio: null,
  location: null,
  avatar_url: "https://avatars.githubusercontent.com/u/80451128?v=4",
  type: "User",
};

const repository = {
  id: 123,
  name: "portfolio",
  full_name: "Keval-7503/portfolio",
  html_url: "https://github.com/Keval-7503/portfolio",
  url: "https://api.github.com/repos/Keval-7503/portfolio",
  description: null,
  homepage: null,
  fork: false,
  archived: false,
  disabled: false,
  visibility: "public",
  language: "TypeScript",
  stargazers_count: 0,
  forks_count: 0,
  open_issues_count: 0,
  topics: [],
  default_branch: "main",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-02T00:00:00Z",
  pushed_at: "2026-01-02T00:00:00Z",
  owner: { id: 80451128, login: "Keval-7503" },
  license: null,
};

const responses = [
  new Response(null, { status: 503 }),
  Response.json(profile),
  Response.json([repository], { headers: { etag: '"fixture"' } }),
];
const delays: number[] = [];
let requests = 0;
const snapshot = await fetchGitHubSnapshot("Keval-7503", null, {
  fetchImpl: async () => {
    requests += 1;
    const response = responses.shift();
    assert.ok(response);
    return response;
  },
  retryBaseDelayMs: 0,
  sleep: async (milliseconds) => {
    delays.push(milliseconds);
  },
});

assert.equal(requests, 3);
assert.deepEqual(delays, [0]);
assert.equal(snapshot.repositories.length, 1);
assert.equal(snapshot.etag, '"fixture"');

let unauthorizedRequests = 0;
await assert.rejects(
  fetchGitHubSnapshot("Keval-7503", null, {
    fetchImpl: async () => {
      unauthorizedRequests += 1;
      return new Response(null, { status: 401 });
    },
    retryBaseDelayMs: 0,
  }),
  (error: unknown) => error instanceof GitHubApiError && error.code === "profile_401",
);
assert.equal(unauthorizedRequests, 1);

console.log("GitHub client retry and non-retry checks passed.");
