type LogLevel = "info" | "warn" | "error";

const REDACTED = "[REDACTED]";
const SENSITIVE_KEY =
  /authorization|cookie|password|passwd|token|secret|totp|mfa|backup.?code|prompt|contact.?body|document.?text|request.?body/i;
const CREDENTIAL_URL = /\b(postgres(?:ql)?|https?):\/\/([^\s:/]+):([^\s@/]+)@/gi;
const BEARER = /\bBearer\s+[A-Za-z0-9._~+/-]+=*/gi;

function sanitizeString(value: string) {
  return value.replace(CREDENTIAL_URL, "$1://[REDACTED]@").replace(BEARER, "Bearer [REDACTED]");
}

function redact(value: unknown, depth: number, seen: WeakSet<object>): unknown {
  if (depth > 5) return "[TRUNCATED]";
  if (typeof value === "string") return sanitizeString(value).slice(0, 2_000);
  if (typeof value === "number" || typeof value === "boolean" || value === null) return value;
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Error) {
    return { name: value.name, message: sanitizeString(value.message).slice(0, 500) };
  }
  if (Array.isArray(value)) return value.slice(0, 20).map((item) => redact(item, depth + 1, seen));
  if (typeof value !== "object" || !value) return String(value);
  if (seen.has(value)) return "[CIRCULAR]";
  seen.add(value);

  const safe: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value).slice(0, 50)) {
    safe[key] = SENSITIVE_KEY.test(key) ? REDACTED : redact(entry, depth + 1, seen);
  }
  return safe;
}

export function redactLogContext(context: Record<string, unknown>) {
  return redact(context, 0, new WeakSet()) as Record<string, unknown>;
}

export function logEvent(level: LogLevel, event: string, context: Record<string, unknown> = {}) {
  const record = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    service: "portfolio",
    event,
    ...redactLogContext(context),
  });
  if (level === "error") console.error(record);
  else if (level === "warn") console.warn(record);
  else console.info(record);
}
