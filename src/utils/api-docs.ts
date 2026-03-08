/**
 * Utilities for API docs rendering and URL injection.
 */

const DEFAULT_BASE_URL = "http://localhost:3000";
const BASE_URL_PLACEHOLDER = "{{BASE_URL}}";

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

export function resolveDocsBaseUrl(options?: {
  host?: string | null;
  forwardedProto?: string | null;
}): string {
  const envUrl =
    process.env.NEXT_PUBLIC_BASE_URL ?? process.env.API_BASE_URL ?? "";
  const normalizedEnvUrl = envUrl ? normalizeUrl(envUrl) : null;
  if (normalizedEnvUrl) {
    return normalizedEnvUrl;
  }

  const host = options?.host?.trim();
  if (host) {
    const protocol = inferProtocol(host, options?.forwardedProto);
    return `${protocol}://${host}`;
  }

  return DEFAULT_BASE_URL;
}

export function injectDocsBaseUrl(markdown: string, baseUrl: string): string {
  return markdown.replaceAll(BASE_URL_PLACEHOLDER, trimTrailingSlash(baseUrl));
}
