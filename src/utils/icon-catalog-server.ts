/**
 * Server-side icon catalog utilities.
 *
 * Reads the generated catalog from disk so API routes can query icon data
 * without relying on browser `fetch("/icon-catalog.json")`.
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import type { IconCatalog, IconMetadata, IconPack } from "@/src/types/icon";

export type ApiIconPack = IconPack | "all" | "garden";

export interface SearchIconsOptions {
  query?: string;
  pack?: ApiIconPack;
  category?: string | null;
  limit?: number;
  offset?: number;
}

let catalogCache: IconCatalog | null = null;
let searchIndexCache: Array<{ icon: IconMetadata; searchText: string }> | null =
  null;

const UI_PACK_MAP: Record<string, IconPack> = {
  garden: "zendesk-garden",
  feather: "feather",
  remixicon: "remixicon",
  emoji: "emoji",
  "custom-svg": "custom-svg",
  "custom-image": "custom-image",
};

function getCatalogPath(): string {
  return path.join(process.cwd(), "public", "icon-catalog.json");
}

function normalizePack(pack?: ApiIconPack): IconPack | "all" {
  if (!pack || pack === "all") {
    return "all";
  }

  return UI_PACK_MAP[pack] ?? pack;
}

function buildSearchIndex(catalog: IconCatalog) {
  if (searchIndexCache) {
    return searchIndexCache;
  }

  searchIndexCache = Object.values(catalog.icons).map((icon) => {
    const searchText = `${icon.name} ${icon.id} ${icon.keywords.join(" ")} ${
      icon.category ?? ""
    }`.toLowerCase();

    return {
      icon,
      searchText,
    };
  });

  return searchIndexCache;
}

export async function loadIconCatalogServer(): Promise<IconCatalog> {
  if (catalogCache) {
    return catalogCache;
  }

  const filePath = getCatalogPath();
  const raw = await readFile(filePath, "utf-8");
  const catalog = JSON.parse(raw) as IconCatalog;
  catalogCache = catalog;
  searchIndexCache = null;
  return catalog;
}

export async function getIconByIdServer(
  id: string
): Promise<IconMetadata | null> {
  const catalog = await loadIconCatalogServer();
  return catalog.icons[id] ?? null;
}

export async function searchIconsServer(
  options: SearchIconsOptions
): Promise<IconMetadata[]> {
  const catalog = await loadIconCatalogServer();
  const {
    query = "",
    pack = "all",
    category = null,
    limit = 50,
    offset = 0,
  } = options;

  const trimmedQuery = query.trim().toLowerCase();
  const normalizedPack = normalizePack(pack);
  const normalizedCategory = category?.trim() || null;

  const searched =
    trimmedQuery.length === 0
      ? Object.values(catalog.icons)
      : buildSearchIndex(catalog)
          .filter(({ searchText }) => searchText.includes(trimmedQuery))
          .map(({ icon }) => icon);

  const byPack =
    normalizedPack === "all"
      ? searched
      : searched.filter((icon) => icon.pack === normalizedPack);

  const byCategory = normalizedCategory
    ? byPack.filter((icon) => icon.category === normalizedCategory)
    : byPack;

  const safeOffset = Math.max(0, offset);
  const safeLimit = Math.min(Math.max(1, limit), 250);
  return byCategory.slice(safeOffset, safeOffset + safeLimit);
}

export async function getRemixIconCategoriesServer(): Promise<string[]> {
  const catalog = await loadIconCatalogServer();
  const remixIds = catalog.byPack.remixicon ?? [];
  const categories = new Set<string>();

  for (const id of remixIds) {
    const icon = catalog.icons[id];
    if (icon?.category) {
      categories.add(icon.category);
    }
  }

  return Array.from(categories).sort();
}

export async function getIconPacksServer(): Promise<
  Array<{
    id: IconPack;
    count: number;
    license: IconCatalog["licenses"][IconPack];
  }>
> {
  const catalog = await loadIconCatalogServer();

  return (Object.keys(catalog.byPack) as IconPack[])
    .sort()
    .map((pack) => ({
      id: pack,
      count: catalog.byPack[pack]?.length ?? 0,
      license: catalog.licenses[pack],
    }));
}

export function clearIconCatalogServerCache(): void {
  catalogCache = null;
  searchIndexCache = null;
}
