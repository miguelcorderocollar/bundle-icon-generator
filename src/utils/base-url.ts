/**
 * Shared application base URL resolution for server and client usage.
 */

const DEFAULT_BASE_URL = "http://localhost:3000";

function trimTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function normalizeUrl(value: string): string | null {
  try {
    const parsed = new URL(value);
    return trimTrailingSlash(parsed.toString());
  } catch {
    return null;
  }
}

function inferProtocol(
  host: string,
  forwardedProto?: string | null
): "http" | "https" {
  if (forwardedProto === "http" || forwardedProto === "https") {
    return forwardedProto;
  }

  const lowerHost = host.toLowerCase();
  if (
    lowerHost.startsWith("localhost") ||
    lowerHost.startsWith("127.0.0.1") ||
    lowerHost.endsWith(".local")
  ) {
    return "http";
  }

  return "https";
}

function resolveEnvBaseUrl(): string | null {
  const candidates = [
    process.env.NEXT_PUBLIC_BASE_URL,
    process.env.API_BASE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined,
    process.env.VERCEL_BRANCH_URL
      ? `https://${process.env.VERCEL_BRANCH_URL}`
      : undefined,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  ];

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    const normalized = normalizeUrl(candidate);
    if (normalized) {
      return normalized;
    }
  }

  return null;
}

export function resolveBaseUrl(options?: {
  host?: string | null;
  forwardedProto?: string | null;
}): string {
  if (typeof window !== "undefined") {
    return trimTrailingSlash(window.location.origin);
  }

  const envUrl = resolveEnvBaseUrl();
  if (envUrl) {
    return envUrl;
  }

  const host = options?.host?.trim();
  if (host) {
    const protocol = inferProtocol(host, options?.forwardedProto);
    return `${protocol}://${host}`;
  }

  return DEFAULT_BASE_URL;
}
