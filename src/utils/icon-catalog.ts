/**
 * Icon Catalog Utilities
 * 
 * Client-side utilities for accessing and querying the icon catalog.
 * The catalog is loaded from /icon-catalog.json at runtime.
 */

import type { IconCatalog, IconMetadata, IconPack } from "../types/icon";

let catalogCache: IconCatalog | null = null;
let searchIndexCache: Array<{ icon: IconMetadata; searchText: string }> | null = null;

function buildSearchIndex(catalog: IconCatalog) {
  if (searchIndexCache) {
    return searchIndexCache;
  }

  searchIndexCache = Object.values(catalog.icons).map((icon) => {
    const keywordsText = icon.keywords.join(" ");
    const searchText = `${icon.name} ${icon.id} ${keywordsText}`.toLowerCase();

    return {
      icon,
      searchText,
    };
  });

  return searchIndexCache;
}

/**
 * Load the icon catalog from the public directory
 */
export async function loadIconCatalog(): Promise<IconCatalog> {
  if (catalogCache) {
    return catalogCache;
  }

  try {
    const response = await fetch('/icon-catalog.json');
    if (!response.ok) {
      throw new Error(`Failed to load icon catalog: ${response.statusText}`);
    }
    const catalog = await response.json() as IconCatalog;
    catalogCache = catalog;
    // Reset derived caches whenever we reload the catalog
    searchIndexCache = null;
    return catalog;
  } catch (error) {
    console.error("Error loading icon catalog:", error);
    throw error;
  }
}

/**
 * Get all icons from the catalog
 */
export async function getAllIcons(): Promise<Record<string, IconMetadata>> {
  const catalog = await loadIconCatalog();
  return catalog.icons;
}

/**
 * Get icons by pack
 */
export async function getIconsByPack(pack: IconPack): Promise<IconMetadata[]> {
  const catalog = await loadIconCatalog();
  // Map UI pack names to catalog pack names
  const packMap: Record<string, string> = {
    "garden": "zendesk-garden",
    "feather": "feather",
  };
  
  const catalogPackName = packMap[pack] || pack;
  const iconIds = catalog.byPack[catalogPackName as IconPack] || [];
  return iconIds.map((id) => catalog.icons[id]).filter(Boolean);
}

/**
 * Get a single icon by ID
 */
export async function getIconById(id: string): Promise<IconMetadata | null> {
  // Check if it's an emoji first (emojis are stored in localStorage, not catalog)
  if (id.startsWith("emoji-")) {
    if (typeof window !== "undefined") {
      const { getEmojiById } = await import("./emoji-catalog");
      return getEmojiById(id);
    }
    return null;
  }
  
  // Check if it's a custom SVG (stored in sessionStorage)
  // The id is already the full key (e.g., "custom-svg-1234567890")
  if (id.startsWith("custom-svg-")) {
    if (typeof window !== "undefined") {
      const svg = sessionStorage.getItem(id);
      if (svg) {
        const allowColorOverrideStr = sessionStorage.getItem(`${id}-allowColorOverride`);
        const allowColorOverride = allowColorOverrideStr !== null ? allowColorOverrideStr === "true" : false;
        return {
          id,
          name: "Custom SVG",
          pack: "custom-svg" as IconPack,
          svg,
          keywords: ["custom", "svg", "user"],
          allowColorOverride,
        };
      }
    }
    return null;
  }
  
  const catalog = await loadIconCatalog();
  return catalog.icons[id] || null;
}

/**
 * Search icons by keyword
 */
export async function searchIcons(query: string): Promise<IconMetadata[]> {
  const catalog = await loadIconCatalog();
  const searchTerm = query.toLowerCase().trim();

  if (!searchTerm) {
    return Object.values(catalog.icons);
  }

  const index = buildSearchIndex(catalog);
  return index
    .filter(({ searchText }) => searchText.includes(searchTerm))
    .map(({ icon }) => icon);
}

/**
 * Filter icons by pack
 */
export async function filterIconsByPack(
  icons: IconMetadata[],
  pack: IconPack | string
): Promise<IconMetadata[]> {
  // Map UI pack names to catalog pack names
  const packMap: Record<string, string> = {
    "garden": "zendesk-garden",
    "feather": "feather",
    "emoji": "emoji",
    "custom-svg": "custom-svg",
    "all": "all", // This won't match any icon.pack, but that's fine
  };
  
  const catalogPackName = packMap[pack] || pack;
  if (catalogPackName === "all") {
    return icons; // Return all icons if "all" is selected
  }
  return icons.filter((icon) => icon.pack === catalogPackName);
}

/**
 * Get icon pack license information
 */
export async function getPackLicense(pack: IconPack) {
  const catalog = await loadIconCatalog();
  return catalog.licenses[pack];
}

/**
 * Clear the catalog cache (useful for development/hot reloading)
 */
export function clearCatalogCache(): void {
  catalogCache = null;
  searchIndexCache = null;
}

