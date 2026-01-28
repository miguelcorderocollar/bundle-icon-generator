/**
 * Context for providing restriction mode state to the component tree
 */

"use client";

import * as React from "react";
import { useRestrictedMode } from "@/src/hooks/use-restricted-mode";
import type { UseRestrictedModeReturn } from "@/src/hooks/use-restricted-mode";

/**
 * Context value type
 */
type RestrictionContextValue = UseRestrictedModeReturn;

/**
 * Default context value (unrestricted)
 */
const defaultValue: RestrictionContextValue = {
  isRestricted: false,
  config: null,
  allowedStyles: [],
  allowedIconPacks: [
    "all",
    "garden",
    "feather",
    "remixicon",
    "emoji",
    "custom-svg",
    "custom-image",
    "canvas",
  ],
  defaultIconPack: null,
  isIconPackAllowed: () => true,
  allowedExportPresets: null,
  isExportPresetAllowed: () => true,
  getShareableUrl: () => null,
  isLoading: true,
};

/**
 * Restriction context
 */
const RestrictionContext =
  React.createContext<RestrictionContextValue>(defaultValue);

/**
 * Provider component for restriction mode
 */
export function RestrictionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const restrictionState = useRestrictedMode();

  return (
    <RestrictionContext.Provider value={restrictionState}>
      {children}
    </RestrictionContext.Provider>
  );
}

/**
 * Hook to access restriction context
 */
export function useRestriction(): RestrictionContextValue {
  const context = React.useContext(RestrictionContext);
  if (context === undefined) {
    throw new Error("useRestriction must be used within a RestrictionProvider");
  }
  return context;
}

/**
 * Export the context for advanced use cases
 */
export { RestrictionContext };
