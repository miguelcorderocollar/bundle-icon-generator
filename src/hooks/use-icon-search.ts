/**
 * Hook for icon search, filtering, and sorting
 */

import * as React from "react";
import type { IconMetadata } from "@/src/types/icon";
import { loadIconCatalog, searchIcons, filterIconsByPack } from "@/src/utils/icon-catalog";
import { getFavorites, getRecentIcons } from "@/src/utils/local-storage";
import { getUserEmojis } from "@/src/utils/emoji-catalog";
import { ICON_PACKS, type IconPack } from "@/src/constants/app";
import { useDebouncedValue } from "./use-debounced-value";

export type SortOption = "name" | "recent" | "favorites" | "pack";

export interface UseIconSearchOptions {
  searchQuery: string;
  selectedPack: IconPack;
  sortBy?: SortOption;
}

export interface UseIconSearchResult {
  icons: IconMetadata[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Sort icons based on the selected option
 * Reads favorites and recent fresh from localStorage to ensure up-to-date sorting
 */
function sortIcons(
  icons: IconMetadata[],
  sortBy: SortOption
): IconMetadata[] {
  const sorted = [...icons];

  // Read fresh from localStorage each time to ensure we have latest data
  const favorites = typeof window !== 'undefined' ? getFavorites() : [];
  const recent = typeof window !== 'undefined' ? getRecentIcons() : [];

  switch (sortBy) {
    case "name":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));

    case "recent":
      return sorted.sort((a, b) => {
        const aIndex = recent.indexOf(a.id);
        const bIndex = recent.indexOf(b.id);
        // Recent icons first (lower index = more recent)
        if (aIndex === -1 && bIndex === -1) return 0;
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      });

    case "favorites":
      return sorted.sort((a, b) => {
        const aIsFavorite = favorites.includes(a.id);
        const bIsFavorite = favorites.includes(b.id);
        if (aIsFavorite && !bIsFavorite) return -1;
        if (!aIsFavorite && bIsFavorite) return 1;
        return a.name.localeCompare(b.name);
      });

    case "pack":
      return sorted.sort((a, b) => {
        const packCompare = a.pack.localeCompare(b.pack);
        if (packCompare !== 0) return packCompare;
        return a.name.localeCompare(b.name);
      });

    default:
      return sorted;
  }
}

/**
 * Hook for searching and filtering icons
 */
export function useIconSearch({
  searchQuery,
  selectedPack,
  sortBy = "name",
}: UseIconSearchOptions): UseIconSearchResult {
  const [icons, setIcons] = React.useState<IconMetadata[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [cachedResults, setCachedResults] = React.useState<IconMetadata[]>([]);
  const cacheRef = React.useRef<Map<string, IconMetadata[]>>(new Map());
  const requestIdRef = React.useRef(0);
  const debouncedQuery = useDebouncedValue(searchQuery);

  React.useEffect(() => {
    if (refreshKey > 0) {
      cacheRef.current.clear();
    }
  }, [refreshKey]);

  // Trigger refresh when localStorage might have changed
  // This can be called from parent components when favorites change or emojis are added
  React.useEffect(() => {
    const handleStorageChange = () => {
      // For emoji pack or when emojis might have been added, always do a full refresh
      // to ensure new emojis appear in the list
      if (selectedPack === ICON_PACKS.EMOJI || selectedPack === ICON_PACKS.ALL) {
        // Clear cache and trigger full refresh to include new emojis
        cacheRef.current.clear();
        setRefreshKey((prev) => prev + 1);
      } else if (cachedResults.length > 0) {
        // For other packs, just re-sort existing results (favorites might have changed)
        const sorted = sortIcons(cachedResults, sortBy);
        setIcons(sorted);
      } else {
        // If no cached results, trigger full refresh
        setRefreshKey((prev) => prev + 1);
      }
    };

    // Listen for storage events (from other tabs/windows)
    window.addEventListener("storage", handleStorageChange);

    // Also listen for custom event we can dispatch when favorites change or emojis added
    window.addEventListener("icon-favorites-changed", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("icon-favorites-changed", handleStorageChange);
    };
  }, [cachedResults, sortBy, selectedPack]);

  // Search and filter icons
  React.useEffect(() => {
    let cancelled = false;
    const normalizedQuery = debouncedQuery.trim();
    const cacheKey = `${normalizedQuery.toLowerCase()}::${selectedPack}`;
    const cached = cacheRef.current.get(cacheKey);

    if (cached) {
      setCachedResults(cached);
      setIcons(sortIcons(cached, sortBy));
      setIsLoading(false);
      return;
    }

    async function performSearch(currentRequestId: number) {
      setIsLoading(true);
      setError(null);

      try {
        // Load catalog if needed
        await loadIconCatalog();

        // Perform search
        let results: IconMetadata[];
        if (normalizedQuery) {
          results = await searchIcons(normalizedQuery);
        } else {
          // If no search query, get all icons
          const catalog = await loadIconCatalog();
          results = Object.values(catalog.icons);
        }

        // Get user emojis and merge with catalog results
        const userEmojis = getUserEmojis();
        
        // Filter by pack if not "all"
        if (selectedPack !== ICON_PACKS.ALL) {
          results = await filterIconsByPack(results, selectedPack);
          
          // If emoji pack is selected, include user emojis
          if (selectedPack === ICON_PACKS.EMOJI) {
            // Filter emojis by search query if present
            let filteredEmojis = userEmojis;
            if (normalizedQuery) {
              const queryLower = normalizedQuery.toLowerCase();
              filteredEmojis = userEmojis.filter((emoji) => {
                const searchText = `${emoji.name} ${emoji.id} ${emoji.keywords.join(" ")}`.toLowerCase();
                return searchText.includes(queryLower);
              });
            }
            results = [...results, ...filteredEmojis];
          }
        } else {
          // If "all" pack is selected, include all user emojis
          // Filter emojis by search query if present
          let filteredEmojis = userEmojis;
          if (normalizedQuery) {
            const queryLower = normalizedQuery.toLowerCase();
            filteredEmojis = userEmojis.filter((emoji) => {
              const searchText = `${emoji.name} ${emoji.id} ${emoji.keywords.join(" ")}`.toLowerCase();
              return searchText.includes(queryLower);
            });
          }
          results = [...results, ...filteredEmojis];
        }

        // Cache the filtered results (before sorting)
        if (!cancelled && currentRequestId === requestIdRef.current) {
          cacheRef.current.set(cacheKey, results);
          setCachedResults(results);
        }

        // Sort results (reads favorites/recent fresh from localStorage)
        const sorted = sortIcons(results, sortBy);

        if (!cancelled && currentRequestId === requestIdRef.current) {
          setIcons(sorted);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled && currentRequestId === requestIdRef.current) {
          setError(err instanceof Error ? err : new Error("Failed to search icons"));
          setIsLoading(false);
        }
      }
    }

    const currentRequestId = requestIdRef.current + 1;
    requestIdRef.current = currentRequestId;
    performSearch(currentRequestId);

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, selectedPack, sortBy, refreshKey]);

  // Re-sort when sortBy changes but results are already cached
  React.useEffect(() => {
    if (cachedResults.length > 0 && !isLoading) {
      const sorted = sortIcons(cachedResults, sortBy);
      setIcons(sorted);
    }
  }, [sortBy, cachedResults, isLoading]);

  return { icons, isLoading, error };
}

