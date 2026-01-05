/**
 * Main hook for icon generator state management
 */

import * as React from "react";
import type { AppLocation } from "@/src/types/app-location";
import { ICON_PACKS, type IconPack } from "@/src/constants/app";
import { loadIconCatalog } from "@/src/utils/icon-catalog";
import { getUserEmojis } from "@/src/utils/emoji-catalog";
import {
  loadGeneratorState,
  saveGeneratorState,
} from "@/src/utils/local-storage";
import type { BackgroundValue } from "@/src/utils/gradients";

export interface IconGeneratorState {
  selectedLocations: AppLocation[];
  selectedIconId?: string;
  backgroundColor: BackgroundValue;
  iconColor: string;
  searchQuery: string;
  selectedPack: IconPack;
  /** Icon size for PNG exports */
  iconSize: number;
  /** Icon size for SVG exports (top_bar, ticket_editor, nav_bar) */
  svgIconSize: number;
}

export interface IconGeneratorActions {
  setSelectedLocations: (locations: AppLocation[]) => void;
  setSelectedIconId: (id: string | undefined) => void;
  setBackgroundColor: (color: BackgroundValue) => void;
  setIconColor: (color: string) => void;
  setSearchQuery: (query: string) => void;
  setSelectedPack: (pack: IconPack) => void;
  setIconSize: (size: number) => void;
  setSvgIconSize: (size: number) => void;
}

const DEFAULT_STATE: IconGeneratorState = {
  selectedLocations: [],
  selectedIconId: undefined,
  backgroundColor: "#063940",
  iconColor: "#ffffff",
  searchQuery: "",
  selectedPack: ICON_PACKS.ALL,
  iconSize: 123,
  svgIconSize: 123,
};

export function useIconGenerator() {
  const [state, setState] = React.useState<IconGeneratorState>(DEFAULT_STATE);
  const [hasInitialized, setHasInitialized] = React.useState(false);
  const [isInitialLoad, setIsInitialLoad] = React.useState(true);

  // Load persisted state on mount and initialize random icon if needed
  React.useEffect(() => {
    if (hasInitialized || typeof window === "undefined") return;

    async function initialize() {
      const persistedState = loadGeneratorState();
      let hasPersistedIcon = false;

      if (persistedState) {
        // Validate and restore persisted state
        const restoredState: IconGeneratorState = {
          selectedLocations: Array.isArray(persistedState.selectedLocations)
            ? (persistedState.selectedLocations as AppLocation[])
            : DEFAULT_STATE.selectedLocations,
          selectedIconId: persistedState.selectedIconId || undefined,
          backgroundColor:
            typeof persistedState.backgroundColor === "string"
              ? persistedState.backgroundColor
              : typeof persistedState.backgroundColor === "object" &&
                  persistedState.backgroundColor !== null
                ? (persistedState.backgroundColor as BackgroundValue)
                : DEFAULT_STATE.backgroundColor,
          iconColor:
            typeof persistedState.iconColor === "string"
              ? persistedState.iconColor
              : DEFAULT_STATE.iconColor,
          searchQuery: DEFAULT_STATE.searchQuery, // Don't persist search query
          selectedPack: Object.values(ICON_PACKS).includes(
            persistedState.selectedPack as IconPack
          )
            ? (persistedState.selectedPack as IconPack)
            : DEFAULT_STATE.selectedPack,
          iconSize:
            typeof persistedState.iconSize === "number" &&
            persistedState.iconSize > 0
              ? persistedState.iconSize
              : DEFAULT_STATE.iconSize,
          svgIconSize:
            typeof persistedState.svgIconSize === "number" &&
            persistedState.svgIconSize > 0
              ? persistedState.svgIconSize
              : DEFAULT_STATE.svgIconSize,
        };
        hasPersistedIcon = !!restoredState.selectedIconId;
        setState(restoredState);
      }

      // Initialize with a random icon if no persisted icon exists
      if (!hasPersistedIcon) {
        try {
          const catalog = await loadIconCatalog();
          const allIcons = Object.values(catalog.icons);
          const userEmojis = getUserEmojis();
          const combinedIcons = [...allIcons, ...userEmojis];

          if (combinedIcons.length > 0) {
            const randomIndex = Math.floor(
              Math.random() * combinedIcons.length
            );
            const randomIcon = combinedIcons[randomIndex];
            setState((prev) => ({ ...prev, selectedIconId: randomIcon.id }));
          }
        } catch (error) {
          console.error("Failed to initialize random icon:", error);
        }
      }

      setHasInitialized(true);
      setIsInitialLoad(false);
    }

    initialize();
  }, [hasInitialized]);

  // Save state to localStorage whenever it changes (but not during initial load)
  React.useEffect(() => {
    if (!hasInitialized || isInitialLoad || typeof window === "undefined")
      return;

    saveGeneratorState({
      selectedLocations: state.selectedLocations,
      selectedIconId: state.selectedIconId,
      backgroundColor: state.backgroundColor,
      iconColor: state.iconColor,
      selectedPack: state.selectedPack,
      iconSize: state.iconSize,
      svgIconSize: state.svgIconSize,
    });
  }, [
    hasInitialized,
    isInitialLoad,
    state.selectedLocations,
    state.selectedIconId,
    state.backgroundColor,
    state.iconColor,
    state.selectedPack,
    state.iconSize,
    state.svgIconSize,
  ]);

  const actions: IconGeneratorActions = React.useMemo(
    () => ({
      setSelectedLocations: (locations) =>
        setState((prev) => ({ ...prev, selectedLocations: locations })),
      setSelectedIconId: (id) =>
        setState((prev) => ({ ...prev, selectedIconId: id })),
      setBackgroundColor: (color) =>
        setState((prev) => ({ ...prev, backgroundColor: color })),
      setIconColor: (color) =>
        setState((prev) => ({ ...prev, iconColor: color })),
      setSearchQuery: (query) =>
        setState((prev) => ({ ...prev, searchQuery: query })),
      setSelectedPack: (pack) =>
        setState((prev) => ({ ...prev, selectedPack: pack })),
      setIconSize: (size) => setState((prev) => ({ ...prev, iconSize: size })),
      setSvgIconSize: (size) =>
        setState((prev) => ({ ...prev, svgIconSize: size })),
    }),
    []
  );

  return { state, actions };
}
