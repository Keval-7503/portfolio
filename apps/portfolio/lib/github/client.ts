import { z } from "zod";

const githubProfileSchema = z.object({
  id: z.number().int().nonnegative(),
  login: z.string().min(1).max(39),
  html_url: z.string().url(),
  name: z.string().nullable(),
  bio: z.string().nullable(),
  location: z.string().nullable(),
  avatar_url: z.string().url(),
  type: z.literal("User"),
});

const githubRepositorySchema = z.object({
  id: z.number().int().nonnegative(),
  name: z.string().min(1),
  full_name: z.string().min(1),
  html_url: z.string().url(),
  url: z.string().url(),
  description: z.string().nullable(),
  homepage: z.string().nullable(),
  fork: z.boolean(),
  archived: z.boolean(),
  disabled: z.boolean(),
  visibility: z.literal("public"),
  language: z.string().nullable(),
  stargazers_count: z.number().int().nonnegative(),
  forks_count: z.number().int().nonnegative(),
  open_issues_count: z.number().int().nonnegative(),
  topics: z.array(z.string()),
  default_branch: z.string().min(1),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  pushed_at: z.string().datetime().nullable(),
  owner: z.object({
    id: z.number().int().nonnegative(),
    login: z.string().min(1).max(39),
  }),
  license: z.object({ spdx_id: z.string().nullable() }).nullable(),
});

export type GitHubProfile = z.infer<typeof githubProfileSchema>;
export type GitHubRepository = z.infer<typeof githubRepositorySchema>;

export type GitHubSnapshot = {
  profile: GitHubProfile;
  repositories: GitHubRepository[];
  pagesObserved: number;
  etag: string | null;
  rateLimitRemaining: number | null;
  rateLimitResetAt: Date | null;
  notModified: boolean;
};

const MAX_README_BYTES = 500_000;

type GitHubClientOptions = {
  token?: string;
  fetchImpl?: typeof fetch;
  signal?: AbortSignal;
  maxRetries?: number;
  retryBaseDelayMs?: number;
  sleep?: (milliseconds: number) => Promise<void>;
};

export class GitHubApiError extends Error {
  readonly code: string;
  readonly status: number | null;

  constructor(code: string, status: number | null) {
    super(`GitHub API request failed (${code}).`);
    this.name = "GitHubApiError";
    this.code = code;
    this.status = status;
  }
}

function parseIntegerHeader(value: string | null): number | null {
  if (value === null) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function requestHeaders(token?: string, etag?: string | null): HeadersInit {
  return {
    Accept: "application/vnd.github+json",
    "User-Agent": "verified-portfolio-sync",
    "X-GitHub-Api-Version": "2022-11-28",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(etag ? { "If-None-Match": etag } : {}),
  };
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new GitHubApiError("invalid_json", response.status);
  }
}

const retryableStatuses = new Set([408, 429, 502, 503, 504]);

function retryDelay(response: Response | null, attempt: number, baseDelayMs: number): number {
  const retryAfter = response?.headers.get("retry-after");
  if (retryAfter) {
    const seconds = Number.parseFloat(retryAfter);
    if (Number.isFinite(seconds)) return Math.min(Math.max(seconds * 1000, 0), 5_000);

    const retryAt = Date.parse(retryAfter);
    if (Number.isFinite(retryAt)) return Math.min(Math.max(retryAt - Date.now(), 0), 5_000);
  }

  return Math.min(baseDelayMs * 2 ** attempt, 2_000);
}

async function requestWithRetry(
  input: string,
  init: RequestInit,
  options: GitHubClientOptions,
): Promise<Response> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const maxRetries = Math.min(Math.max(options.maxRetries ?? 2, 0), 3);
  const baseDelayMs = Math.min(Math.max(options.retryBaseDelayMs ?? 250, 0), 2_000);
  const sleep =
    options.sleep ??
    ((milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)));

  for (let attempt = 0; ; attempt += 1) {
    try {
      const response = await fetchImpl(input, init);
      if (!retryableStatuses.has(response.status) || attempt >= maxRetries) return response;
      await sleep(retryDelay(response, attempt, baseDelayMs));
    } catch (error) {
      if (options.signal?.aborted || attempt >= maxRetries) {
        if (error instanceof DOMException && error.name === "AbortError") throw error;
        throw new GitHubApiError("network_error", null);
      }
      await sleep(retryDelay(null, attempt, baseDelayMs));
    }
  }
}

export async function fetchGitHubSnapshot(
  username: string,
  etag: string | null,
  options: GitHubClientOptions = {},
): Promise<GitHubSnapshot> {
  const encodedUsername = encodeURIComponent(username);
  const profileResponse = await requestWithRetry(
    `https://api.github.com/users/${encodedUsername}`,
    { headers: requestHeaders(options.token), signal: options.signal },
    options,
  );

  if (!profileResponse.ok) {
    throw new GitHubApiError(`profile_${profileResponse.status}`, profileResponse.status);
  }

  const profile = githubProfileSchema.parse(await readJson(profileResponse));
  if (profile.login.toLowerCase() !== username.toLowerCase()) {
    throw new GitHubApiError("profile_identity_mismatch", profileResponse.status);
  }

  const repositories: GitHubRepository[] = [];
  let page = 1;
  let collectionEtag: string | null = null;
  let rateLimitRemaining: number | null = null;
  let rateLimitResetAt: Date | null = null;

  while (page <= 20) {
    const response = await requestWithRetry(
      `https://api.github.com/users/${encodedUsername}/repos?type=owner&sort=updated&direction=desc&per_page=100&page=${page}`,
      {
        headers: requestHeaders(options.token, page === 1 ? etag : null),
        signal: options.signal,
      },
      options,
    );

    if (page === 1 && response.status === 304) {
      return {
        profile,
        repositories: [],
        pagesObserved: 1,
        etag,
        rateLimitRemaining: parseIntegerHeader(response.headers.get("x-ratelimit-remaining")),
        rateLimitResetAt: null,
        notModified: true,
      };
    }

    if (!response.ok) {
      throw new GitHubApiError(`repositories_${response.status}`, response.status);
    }

    if (page === 1) collectionEtag = response.headers.get("etag");
    rateLimitRemaining = parseIntegerHeader(response.headers.get("x-ratelimit-remaining"));
    const resetSeconds = parseIntegerHeader(response.headers.get("x-ratelimit-reset"));
    rateLimitResetAt = resetSeconds === null ? null : new Date(resetSeconds * 1000);

    const parsed = z.array(githubRepositorySchema).parse(await readJson(response));
    for (const repository of parsed) {
      if (repository.owner.id !== profile.id) {
        throw new GitHubApiError("repository_owner_mismatch", response.status);
      }
      repositories.push(repository);
    }

    if (parsed.length < 100) break;
    page += 1;
  }

  if (page > 20) throw new GitHubApiError("pagination_limit_exceeded", null);

  return {
    profile,
    repositories,
    pagesObserved: page,
    etag: collectionEtag,
    rateLimitRemaining,
    rateLimitResetAt,
    notModified: false,
  };
}

export async function fetchRepositoryReadme(
  fullName: string,
  options: GitHubClientOptions = {},
): Promise<string | null> {
  const path = fullName.split("/").map(encodeURIComponent).join("/");
  const response = await requestWithRetry(
    `https://api.github.com/repos/${path}/readme`,
    {
      headers: {
        ...requestHeaders(options.token),
        Accept: "application/vnd.github.raw+json",
      },
      signal: options.signal,
    },
    options,
  );

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new GitHubApiError(`readme_${response.status}`, response.status);
  }

  const reportedLength = Number.parseInt(response.headers.get("content-length") ?? "0", 10);
  if (reportedLength > MAX_README_BYTES) {
    throw new GitHubApiError("readme_too_large", response.status);
  }
  const markdown = await response.text();
  if (new TextEncoder().encode(markdown).byteLength > MAX_README_BYTES) {
    throw new GitHubApiError("readme_too_large", response.status);
  }
  return markdown;
}
