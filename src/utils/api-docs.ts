/**
 * Utilities for API docs rendering and URL injection.
 */

import { resolveBaseUrl } from "@/src/utils/base-url";

const BASE_URL_PLACEHOLDER = "{{BASE_URL}}";

function trimTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export function resolveDocsBaseUrl(options?: {
  host?: string | null;
  forwardedProto?: string | null;
}): string {
  return resolveBaseUrl(options);
}

export function injectDocsBaseUrl(markdown: string, baseUrl: string): string {
  return markdown.replaceAll(BASE_URL_PLACEHOLDER, trimTrailingSlash(baseUrl));
}
