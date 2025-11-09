/**
 * Main hook for icon generator state management
 */

import * as React from "react";
import type { AppLocation } from "@/src/types/app-location";
import { ICON_PACKS, type IconPack } from "@/src/constants/app";
import {
  EFFECT_TYPES,
  type EffectType,
  DEFAULT_DARKENING_3D,
  DEFAULT_WIP_GUIDELINES,
  type Darkening3DSettings,
  type WipGuidelinesSettings,
} from "@/src/constants/effects";

export interface IconGeneratorState {
  selectedLocations: AppLocation[];
  selectedIconId?: string;
  backgroundColor: string;
  iconColor: string;
  searchQuery: string;
  selectedPack: IconPack;
  selectedEffect: EffectType;
  darkening3dSettings: Darkening3DSettings;
  wipGuidelinesSettings: WipGuidelinesSettings;
  iconSize: number;
}

export interface IconGeneratorActions {
  setSelectedLocations: (locations: AppLocation[]) => void;
  setSelectedIconId: (id: string | undefined) => void;
  setBackgroundColor: (color: string) => void;
  setIconColor: (color: string) => void;
  setSearchQuery: (query: string) => void;
  setSelectedPack: (pack: IconPack) => void;
  setSelectedEffect: (effect: EffectType) => void;
  setDarkening3dSettings: (settings: Darkening3DSettings) => void;
  setWipGuidelinesSettings: (settings: WipGuidelinesSettings) => void;
  setIconSize: (size: number) => void;
}

const DEFAULT_STATE: IconGeneratorState = {
  selectedLocations: [],
  selectedIconId: undefined,
  backgroundColor: "#ffffff",
  iconColor: "#000000",
  searchQuery: "",
  selectedPack: ICON_PACKS.ALL,
  selectedEffect: EFFECT_TYPES.NONE,
  darkening3dSettings: DEFAULT_DARKENING_3D,
  wipGuidelinesSettings: DEFAULT_WIP_GUIDELINES,
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
      setSelectedEffect: (effect) =>
        setState((prev) => ({ ...prev, selectedEffect: effect })),
      setDarkening3dSettings: (settings) =>
        setState((prev) => ({ ...prev, darkening3dSettings: settings })),
      setWipGuidelinesSettings: (settings) =>
        setState((prev) => ({ ...prev, wipGuidelinesSettings: settings })),
      setIconSize: (size) =>
        setState((prev) => ({ ...prev, iconSize: size })),
    }),
    []
  );

  return { state, actions };
}

