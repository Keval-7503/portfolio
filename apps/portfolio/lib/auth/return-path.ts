const blockedAuthPaths = new Set([
  "/admin/login",
  "/admin/mfa-setup",
  "/admin/reauthenticate",
  "/admin/two-factor",
]);

export function safeAdminReturnPath(value: string | null | undefined, fallback = "/admin") {
  if (!value || value.startsWith("//")) return fallback;

  try {
    const url = new URL(value, "https://portfolio.local");
    const isAdminPath = url.pathname === "/admin" || url.pathname.startsWith("/admin/");
    if (
      url.origin !== "https://portfolio.local" ||
      !isAdminPath ||
      blockedAuthPaths.has(url.pathname)
    ) {
      return fallback;
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
