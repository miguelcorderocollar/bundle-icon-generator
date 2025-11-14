/**
 * Utilities for working with icon packs
 */

import type { IconPack } from "../types/icon";

/**
 * Format pack name for display
 */
export function formatPackName(pack: IconPack | string): string {
  const packMap: Record<string, string> = {
    "zendesk-garden": "Garden",
    "feather": "Feather",
    "emoji": "Emoji",
  };
  return packMap[pack] || pack;
}

