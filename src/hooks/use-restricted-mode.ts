/**
 * Hook for managing restricted mode state
 *
 * This hook handles:
 * - Reading restriction config from URL parameters
 * - Storing restriction config in localStorage
 * - Maintaining URL state for sharing
 * - Providing filtered style and icon pack options
 */

import * as React from "react";
import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useSyncExternalStore,
} from "react";
import type {
  RestrictionConfig,
  RestrictedStyle,
  RestrictedExportPreset,
} from "@/src/types/restriction";
import type { ExportPreset } from "@/src/types/preset";
import { BUILTIN_EXPORT_PRESETS } from "@/src/utils/builtin-presets";
import { isRestrictionConfig } from "@/src/types/restriction";
import { ICON_PACKS, type IconPack } from "@/src/constants/app";
import {
  getRestrictionFromUrl,
  updateUrlWithRestriction,
  encodeRestrictionConfig,
  RESTRICTION_URL_PARAM,
} from "@/src/utils/restriction-codec";

/**
 * localStorage key for restriction config
 */
const RESTRICTION_STORAGE_KEY = "zdk-icon-generator:restriction-config";

/**
 * All available icon packs
 */
const ALL_ICON_PACKS: IconPack[] = Object.values(ICON_PACKS) as IconPack[];

/**
 * Return type for the useRestrictedMode hook
 */
export interface UseRestrictedModeReturn {
  /** Whether the app is currently in restricted mode */
  isRestricted: boolean;
  /** The current restriction config (null if not restricted) */
  config: RestrictionConfig | null;
  /** Allowed style presets when restricted */
  allowedStyles: RestrictedStyle[];
  /** Allowed icon packs when restricted (all packs if not restricted) */
  allowedIconPacks: IconPack[];
  /** Default icon pack to select on initial load in restricted mode */
  defaultIconPack: IconPack | null;
  /** Check if a specific icon pack is allowed */
  isIconPackAllowed: (pack: IconPack) => boolean;
  /** Allowed export presets when restricted (resolved to full ExportPreset objects) */
  allowedExportPresets: ExportPreset[] | null;
  /** Check if a specific export preset is allowed (by id) */
  isExportPresetAllowed: (presetId: string) => boolean;
  /** Get the shareable URL with restriction config */
  getShareableUrl: () => string | null;
  /** Whether the hook has finished loading */
  isLoading: boolean;
}

/**
 * Load restriction config from localStorage
 */
function loadRestrictionFromStorage(): RestrictionConfig | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = localStorage.getItem(RESTRICTION_STORAGE_KEY);
    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored);
    if (!isRestrictionConfig(parsed)) {
      console.warn("Invalid restriction config in localStorage, removing");
      localStorage.removeItem(RESTRICTION_STORAGE_KEY);
      return null;
    }

    return parsed;
  } catch (error) {
    console.warn("Failed to load restriction config from localStorage:", error);
    return null;
  }
}

/**
 * Save restriction config to localStorage
 */
function saveRestrictionToStorage(config: RestrictionConfig): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(RESTRICTION_STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.warn("Failed to save restriction config to localStorage:", error);
  }
}

/**
 * Initialize restriction config from URL or localStorage
 * This runs synchronously during initial render
 */
function getInitialConfig(): RestrictionConfig | null {
  if (typeof window === "undefined") {
    return null;
  }

  // 1. Check URL for restriction param
  const urlConfig = getRestrictionFromUrl();
  if (urlConfig) {
    // URL has a valid restriction config - store it
    saveRestrictionToStorage(urlConfig);
    return urlConfig;
  }

  // 2. No URL param - check localStorage
  return loadRestrictionFromStorage();
}

/**
 * Subscribe function for useSyncExternalStore (no-op since mounted state never changes after initial)
 */
function subscribeMounted(_callback: () => void): () => void {
  // No subscription needed - mounted state is determined once
  return () => {};
}

/**
 * Hook for managing restricted mode
 */
export function useRestrictedMode(): UseRestrictedModeReturn {
  // Use lazy initialization to avoid effect-based setState
  const [config] = useState<RestrictionConfig | null>(getInitialConfig);
  // Track if component has mounted on client (to prevent hydration mismatches)
  // Using useSyncExternalStore to avoid the setState-in-effect pattern
  const mounted = useSyncExternalStore(
    subscribeMounted,
    () => true, // Client: always mounted
    () => false // Server: never mounted
  );
  // Track if we've synced the URL (to avoid running effect multiple times)
  const urlSyncedRef = React.useRef(false);

  // Handle URL synchronization after mount (only external system update)
  useEffect(() => {
    if (!urlSyncedRef.current) {
      urlSyncedRef.current = true;
      // If we have a stored config but no URL param, update the URL
      if (config && !getRestrictionFromUrl()) {
        updateUrlWithRestriction(config);
      }
    }
  }, [config]);

  // isLoading is true until component mounts on client
  // This prevents hydration mismatches by ensuring server and client render the same initially
  const isLoading = !mounted;

  // Computed values
  const isRestricted = config !== null;

  const allowedStyles = useMemo(() => {
    return config?.styles ?? [];
  }, [config]);

  const allowedIconPacks = useMemo(() => {
    if (!config) {
      return ALL_ICON_PACKS;
    }
    // If allowedIconPacks is undefined or empty, all packs are allowed
    if (!config.allowedIconPacks || config.allowedIconPacks.length === 0) {
      return ALL_ICON_PACKS;
    }
    return config.allowedIconPacks;
  }, [config]);

  // Get the default icon pack for restricted mode
  const defaultIconPack = useMemo((): IconPack | null => {
    if (!config) {
      return null;
    }
    // If explicitly set, use it
    if (config.defaultIconPack) {
      return config.defaultIconPack;
    }
    // Otherwise, use the first allowed pack
    if (config.allowedIconPacks && config.allowedIconPacks.length > 0) {
      return config.allowedIconPacks[0];
    }
    // If all packs allowed, use the first one from the full list
    return ALL_ICON_PACKS[0];
  }, [config]);

  const isIconPackAllowed = useCallback(
    (pack: IconPack): boolean => {
      if (!config) {
        return true;
      }
      if (!config.allowedIconPacks || config.allowedIconPacks.length === 0) {
        return true;
      }
      return config.allowedIconPacks.includes(pack);
    },
    [config]
  );

  // Resolve restricted export presets to full ExportPreset objects
  const allowedExportPresets = useMemo((): ExportPreset[] | null => {
    if (!config) {
      return null; // null means all presets allowed
    }
    if (
      !config.allowedExportPresets ||
      config.allowedExportPresets.length === 0
    ) {
      return null; // null means all presets allowed
    }

    // Resolve each restricted preset to a full ExportPreset
    return config.allowedExportPresets.map(
      (restrictedPreset: RestrictedExportPreset): ExportPreset => {
        // If variants are provided, use them (custom preset)
        if (restrictedPreset.variants && restrictedPreset.variants.length > 0) {
          return {
            id: restrictedPreset.id,
            name: restrictedPreset.name,
            description: restrictedPreset.description || "",
            variants: restrictedPreset.variants,
            isBuiltIn: false,
          };
        }

        // Otherwise, look up built-in preset by id
        const builtIn = BUILTIN_EXPORT_PRESETS.find(
          (p) => p.id === restrictedPreset.id
        );
        if (builtIn) {
          return {
            ...builtIn,
            // Allow overriding name/description
            name: restrictedPreset.name || builtIn.name,
            description: restrictedPreset.description || builtIn.description,
          };
        }

        // Fallback: return a minimal preset
        return {
          id: restrictedPreset.id,
          name: restrictedPreset.name,
          description: restrictedPreset.description || "Unknown preset",
          variants: [],
          isBuiltIn: false,
        };
      }
    );
  }, [config]);

  const isExportPresetAllowed = useCallback(
    (presetId: string): boolean => {
      if (!config) {
        return true;
      }
      if (
        !config.allowedExportPresets ||
        config.allowedExportPresets.length === 0
      ) {
        return true;
      }
      return config.allowedExportPresets.some((p) => p.id === presetId);
    },
    [config]
  );

  const getShareableUrl = useCallback((): string | null => {
    if (!config) {
      return null;
    }

    const encoded = encodeRestrictionConfig(config);
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set(RESTRICTION_URL_PARAM, encoded);
    return url.toString();
  }, [config]);

  return {
    isRestricted,
    config,
    allowedStyles,
    allowedIconPacks,
    defaultIconPack,
    isIconPackAllowed,
    allowedExportPresets,
    isExportPresetAllowed,
    getShareableUrl,
    isLoading,
  };
}

/**
 * Export the storage key for testing/admin purposes
 */
export { RESTRICTION_STORAGE_KEY };
