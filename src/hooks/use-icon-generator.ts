/**
 * Main hook for icon generator state management
 */

import * as React from "react";
import type { AppLocation } from "@/src/types/app-location";
import { ICON_PACKS, type IconPack } from "@/src/constants/app";

export interface IconGeneratorState {
  selectedLocations: AppLocation[];
  selectedIconId?: string;
  backgroundColor: string;
  iconColor: string;
  searchQuery: string;
  selectedPack: IconPack;
  iconSize: number;
}

export interface IconGeneratorActions {
  setSelectedLocations: (locations: AppLocation[]) => void;
  setSelectedIconId: (id: string | undefined) => void;
  setBackgroundColor: (color: string) => void;
  setIconColor: (color: string) => void;
  setSearchQuery: (query: string) => void;
  setSelectedPack: (pack: IconPack) => void;
  setIconSize: (size: number) => void;
}

const DEFAULT_STATE: IconGeneratorState = {
  selectedLocations: [],
  selectedIconId: undefined,
  backgroundColor: "#063940",
  iconColor: "#ffffff",
  searchQuery: "",
  selectedPack: ICON_PACKS.ALL,
  iconSize: 64,
};

export function useIconGenerator() {
  const [state, setState] = React.useState<IconGeneratorState>(DEFAULT_STATE);

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
      setIconSize: (size) =>
        setState((prev) => ({ ...prev, iconSize: size })),
    }),
    []
  );

  return { state, actions };
}

