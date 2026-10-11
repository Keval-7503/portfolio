const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function hasTrustedMutationOrigin(request: Request, expectedOrigin: string): boolean {
  if (!MUTATION_METHODS.has(request.method.toUpperCase())) return true;

  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if (!origin || fetchSite === "cross-site") return false;

  try {
    return new URL(origin).origin === new URL(expectedOrigin).origin;
  } catch {
    return false;
  }
}
