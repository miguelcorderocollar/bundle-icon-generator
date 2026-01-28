/**
 * Codec utilities for encoding and decoding restriction configurations
 * to/from URL-safe base64 strings.
 */

import type { RestrictionConfig } from "@/src/types/restriction";
import { isRestrictionConfig } from "@/src/types/restriction";

/**
 * URL parameter name for restriction config
 */
export const RESTRICTION_URL_PARAM = "restrict";

/**
 * Encode a restriction config to a URL-safe base64 string
 */
export function encodeRestrictionConfig(config: RestrictionConfig): string {
  try {
    const json = JSON.stringify(config);
    // Use base64url encoding (URL-safe)
    const base64 = btoa(json);
    // Make it URL-safe by replacing + with - and / with _
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  } catch {
    throw new Error("Failed to encode restriction config");
  }
}

/**
 * Decode a URL-safe base64 string to a restriction config
 * Returns null if decoding or validation fails
 */
export function decodeRestrictionConfig(
  encoded: string
): RestrictionConfig | null {
  try {
    // Restore standard base64 from URL-safe format
    let base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    // Add padding if needed
    while (base64.length % 4) {
      base64 += "=";
    }

    const json = atob(base64);
    const parsed = JSON.parse(json);

    if (!isRestrictionConfig(parsed)) {
      console.warn("Invalid restriction config structure");
      return null;
    }

    return parsed;
  } catch (error) {
    console.warn("Failed to decode restriction config:", error);
    return null;
  }
}

/**
 * Build a full URL with the restriction parameter
 */
export function buildRestrictedUrl(
  config: RestrictionConfig,
  baseUrl?: string
): string {
  const base = baseUrl || window.location.origin + window.location.pathname;
  const encoded = encodeRestrictionConfig(config);
  const url = new URL(base);
  url.searchParams.set(RESTRICTION_URL_PARAM, encoded);
  return url.toString();
}

/**
 * Extract restriction config from current URL
 * Returns null if no restriction param is present or if decoding fails
 */
export function getRestrictionFromUrl(): RestrictionConfig | null {
  if (typeof window === "undefined") {
    return null;
  }

  const params = new URLSearchParams(window.location.search);
  const encoded = params.get(RESTRICTION_URL_PARAM);

  if (!encoded) {
    return null;
  }

  return decodeRestrictionConfig(encoded);
}

/**
 * Update the URL with the restriction parameter without triggering navigation
 */
export function updateUrlWithRestriction(config: RestrictionConfig): void {
  if (typeof window === "undefined") {
    return;
  }

  const url = new URL(window.location.href);
  const encoded = encodeRestrictionConfig(config);
  url.searchParams.set(RESTRICTION_URL_PARAM, encoded);

  window.history.replaceState({}, "", url.toString());
}

/**
 * Remove the restriction parameter from the URL without triggering navigation
 */
export function removeRestrictionFromUrl(): void {
  if (typeof window === "undefined") {
    return;
  }

  const url = new URL(window.location.href);
  url.searchParams.delete(RESTRICTION_URL_PARAM);

  window.history.replaceState({}, "", url.toString());
}
