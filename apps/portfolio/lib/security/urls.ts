const PROVIDER_HOSTS = new Set(["api.github.com"]);

export function safeExternalUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function allowedProviderUrl(value: string): URL {
  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.port ||
    !PROVIDER_HOSTS.has(url.hostname.toLowerCase())
  ) {
    throw new Error("External provider URL is not allowed.");
  }
  return url;
}
