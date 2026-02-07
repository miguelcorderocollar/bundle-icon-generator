/**
 * Hook for batch generator state management
 * Manages uploaded assets, batch configurations, and persistence
 */

import * as React from "react";
import type {
  BatchState,
  BatchIconConfig,
  UploadedAsset,
  BatchIconSource,
} from "@/src/types/batch";
import { DEFAULT_BATCH_STATE } from "@/src/types/batch";
import { getStylePreset } from "@/src/utils/preset-storage";
import { DEFAULT_STYLE_PRESET_ID } from "@/src/utils/builtin-presets";

const STORAGE_KEY = "zdk-icon-generator:batch-state";
const SESSION_STORAGE_KEY = "zdk-icon-generator:batch-uploads";

/**
 * Generate a unique ID for batch items
 */
function generateId(): string {
  return `batch-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Sanitize project name for use as folder name
 */
export function sanitizeProjectName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 50);
}

/**
 * Load batch state from localStorage
 */
function loadBatchState(): Partial<BatchState> | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch (error) {
    console.error("Failed to load batch state:", error);
    return null;
  }
}

/**
 * Save batch state to localStorage
 */
function saveBatchState(state: Omit<BatchState, "uploadedAssets">): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Failed to save batch state:", error);
  }
}

/**
 * Load uploaded assets from sessionStorage
 */
function loadUploadedAssets(): UploadedAsset[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error("Failed to load uploaded assets:", error);
    return [];
  }
}

/**
 * Save uploaded assets to sessionStorage
 */
function saveUploadedAssets(assets: UploadedAsset[]): void {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(assets));
  } catch (error) {
    console.error("Failed to save uploaded assets:", error);
  }
}

export interface BatchGeneratorActions {
  // Config management
  addConfig: (config?: Partial<BatchIconConfig>) => BatchIconConfig;
  updateConfig: (id: string, updates: Partial<BatchIconConfig>) => void;
  removeConfig: (id: string) => void;
  setConfigs: (configs: BatchIconConfig[]) => void;
  clearConfigs: () => void;

  // Asset management
  addUploadedAsset: (asset: Omit<UploadedAsset, "iconId">) => UploadedAsset;
  removeUploadedAsset: (name: string) => void;
  clearUploadedAssets: () => void;

  // Global settings
  setGlobalFormatPresetId: (presetId: string) => void;

  // Bulk operations
  importConfigs: (configs: BatchIconConfig[]) => void;
  clearAll: () => void;

  // Helpers
  getUploadedAssetByName: (name: string) => UploadedAsset | undefined;
  resolveConfigColors: (config: BatchIconConfig) => BatchIconConfig;
}

export interface UseBatchGeneratorReturn {
  state: BatchState;
  actions: BatchGeneratorActions;
  hasInitialized: boolean;
}

/**
 * Create a default batch config
 */
function createDefaultConfig(
  overrides?: Partial<BatchIconConfig>
): BatchIconConfig {
  return {
    id: generateId(),
    projectName: "",
    source: "feather" as BatchIconSource,
    iconName: "",
    iconId: undefined,
    stylePresetId: DEFAULT_STYLE_PRESET_ID,
    formatPresetId: undefined,
    iconSize: 80,
    resolvedBackgroundColor: undefined,
    resolvedIconColor: undefined,
    ...overrides,
  };
}

/**
 * Hook for batch generator state management
 */
export function useBatchGenerator(): UseBatchGeneratorReturn {
  const [state, setState] = React.useState<BatchState>(DEFAULT_BATCH_STATE);
  const [hasInitialized, setHasInitialized] = React.useState(false);

  // Load persisted state on mount
  React.useEffect(() => {
    if (hasInitialized || typeof window === "undefined") return;

    const persistedState = loadBatchState();
    const uploadedAssets = loadUploadedAssets();

    setState({
      uploadedAssets,
      configs: persistedState?.configs ?? [],
      globalFormatPresetId:
        persistedState?.globalFormatPresetId ??
        DEFAULT_BATCH_STATE.globalFormatPresetId,
    });

    setHasInitialized(true);
  }, [hasInitialized]);

  // Save state to localStorage whenever configs or global preset changes
  React.useEffect(() => {
    if (!hasInitialized || typeof window === "undefined") return;

    saveBatchState({
      configs: state.configs,
      globalFormatPresetId: state.globalFormatPresetId,
    });
  }, [hasInitialized, state.configs, state.globalFormatPresetId]);

  // Save uploaded assets to sessionStorage
  React.useEffect(() => {
    if (!hasInitialized || typeof window === "undefined") return;

    saveUploadedAssets(state.uploadedAssets);
  }, [hasInitialized, state.uploadedAssets]);

  const actions: BatchGeneratorActions = React.useMemo(
    () => ({
      addConfig: (overrides) => {
        const newConfig = createDefaultConfig(overrides);
        setState((prev) => ({
          ...prev,
          configs: [...prev.configs, newConfig],
        }));
        return newConfig;
      },

      updateConfig: (id, updates) => {
        setState((prev) => ({
          ...prev,
          configs: prev.configs.map((config) =>
            config.id === id ? { ...config, ...updates } : config
          ),
        }));
      },

      removeConfig: (id) => {
        setState((prev) => ({
          ...prev,
          configs: prev.configs.filter((config) => config.id !== id),
        }));
      },

      setConfigs: (configs) => {
        setState((prev) => ({
          ...prev,
          configs,
        }));
      },

      clearConfigs: () => {
        setState((prev) => ({
          ...prev,
          configs: [],
        }));
      },

      addUploadedAsset: (asset) => {
        const iconId = `batch-upload-${asset.name}-${Date.now()}`;
        const newAsset: UploadedAsset = {
          ...asset,
          iconId,
        };
        setState((prev) => ({
          ...prev,
          uploadedAssets: [...prev.uploadedAssets, newAsset],
        }));
        return newAsset;
      },

      removeUploadedAsset: (name) => {
        setState((prev) => ({
          ...prev,
          uploadedAssets: prev.uploadedAssets.filter(
            (asset) => asset.name !== name
          ),
        }));
      },

      clearUploadedAssets: () => {
        setState((prev) => ({
          ...prev,
          uploadedAssets: [],
        }));
      },

      setGlobalFormatPresetId: (presetId) => {
        setState((prev) => ({
          ...prev,
          globalFormatPresetId: presetId,
        }));
      },

      importConfigs: (configs) => {
        // Merge with existing configs, assigning new IDs
        const newConfigs = configs.map((config) => ({
          ...config,
          id: generateId(),
        }));
        setState((prev) => ({
          ...prev,
          configs: [...prev.configs, ...newConfigs],
        }));
      },

      clearAll: () => {
        setState({
          ...DEFAULT_BATCH_STATE,
          uploadedAssets: [],
        });
      },

      getUploadedAssetByName: (name) => {
        return state.uploadedAssets.find(
          (asset) => asset.name === name || asset.filename === name
        );
      },

      resolveConfigColors: (config) => {
        const stylePreset = getStylePreset(config.stylePresetId);
        if (!stylePreset) return config;

        return {
          ...config,
          resolvedBackgroundColor: stylePreset.backgroundColor,
          resolvedIconColor: stylePreset.iconColor,
        };
      },
    }),
    [state.uploadedAssets]
  );

  return { state, actions, hasInitialized };
}
