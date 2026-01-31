/**
 * Hook for share page configuration state management
 *
 * Manages the core restriction config, share mode, and URL generation.
 */

import * as React from "react";
import type { RestrictionConfig } from "@/src/types/restriction";
import {
  createDefaultRestrictionConfig,
  isRestrictionConfig,
} from "@/src/types/restriction";
import { saveAdminConfig, loadAdminConfig } from "@/src/utils/local-storage";
import {
  encodeRestrictionConfig,
  encodePresetConfig,
  RESTRICTION_URL_PARAM,
  CONFIG_URL_PARAM,
} from "@/src/utils/restriction-codec";
import type { StylePreset, ExportPreset } from "@/src/types/preset";

export type ShareMode = "restricted" | "import";

export interface UseShareConfigReturn {
  /** Current restriction configuration */
  config: RestrictionConfig;
  /** Current share mode (restricted or import) */
  shareMode: ShareMode;
  /** Generated shareable URL */
  generatedUrl: string;
  /** Whether initial load from localStorage is complete */
  isInitialized: boolean;
  /** Update the entire config */
  setConfig: (config: RestrictionConfig) => void;
  /** Update share mode */
  setShareMode: (mode: ShareMode) => void;
  /** Reset editing state (used after imports) */
  resetEditingState: () => void;
}

/**
 * Generate the shareable URL from config and mode
 */
function generateShareUrl(config: RestrictionConfig, mode: ShareMode): string {
  try {
    const baseUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:3000";
    const url = new URL(baseUrl);

    if (mode === "restricted") {
      // Restricted mode: encode full restriction config
      const encoded = encodeRestrictionConfig(config);
      url.searchParams.set(RESTRICTION_URL_PARAM, encoded);
    } else {
      // Import mode: convert to PresetExportData format
      const stylePresets: StylePreset[] = config.styles.map((style, index) => ({
        id: `shared-style-${Date.now()}-${index}`,
        name: style.name,
        backgroundColor: style.backgroundColor,
        iconColor: style.iconColor,
        isBuiltIn: false,
        colorPalette: style.colorPalette?.map((c, i) => ({
          id: `color-${i}`,
          name: c.name,
          color: c.color,
        })),
        createdAt: new Date().toISOString(),
      }));

      const exportPresets: ExportPreset[] = (config.allowedExportPresets || [])
        .filter((p) => p.variants && p.variants.length > 0)
        .map((preset, index) => ({
          id: `shared-export-${Date.now()}-${index}`,
          name: preset.name,
          description: preset.description || "",
          variants: preset.variants || [],
          isBuiltIn: false,
          createdAt: new Date().toISOString(),
        }));

      const presetData = {
        version: 2,
        exportPresets,
        stylePresets,
        exportedAt: new Date().toISOString(),
      };

      const encoded = encodePresetConfig(presetData);
      url.searchParams.set(CONFIG_URL_PARAM, encoded);
    }

    return url.toString();
  } catch (error) {
    console.error("Failed to generate URL:", error);
    return "";
  }
}

export function useShareConfig(): UseShareConfigReturn {
  const [shareMode, setShareMode] = React.useState<ShareMode>("restricted");
  const [config, setConfig] = React.useState<RestrictionConfig>(
    createDefaultRestrictionConfig()
  );
  const [isInitialized, setIsInitialized] = React.useState(false);

  // Callback for resetting editing state (used by child hooks)
  const resetEditingStateRef = React.useRef<(() => void) | null>(null);

  // Load config from localStorage on mount
  React.useEffect(() => {
    const stored = loadAdminConfig();
    if (stored && isRestrictionConfig(stored)) {
      setConfig(stored);
    }
    setIsInitialized(true);
  }, []);

  // Save config to localStorage whenever it changes (after initial load)
  React.useEffect(() => {
    if (isInitialized) {
      saveAdminConfig(config);
    }
  }, [config, isInitialized]);

  // Generate URL whenever config or mode changes
  const generatedUrl = React.useMemo(
    () => generateShareUrl(config, shareMode),
    [config, shareMode]
  );

  const resetEditingState = React.useCallback(() => {
    resetEditingStateRef.current?.();
  }, []);

  return {
    config,
    shareMode,
    generatedUrl,
    isInitialized,
    setConfig,
    setShareMode,
    resetEditingState,
  };
}
