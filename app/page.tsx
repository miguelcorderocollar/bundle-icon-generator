"use client";

import * as React from "react";
import { IconSearchPane } from "@/components/IconSearchPane";
import { CustomizationControlsPane } from "@/components/CustomizationControlsPane";
import { PreviewPane } from "@/components/PreviewPane";
import { useIconGenerator } from "@/src/hooks/use-icon-generator";
import { APP_NAME, APP_DESCRIPTION } from "@/src/constants/app";

export default function Home() {
  const { state, actions } = useIconGenerator();

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b bg-background px-6 py-4">
        <h1 className="text-2xl font-semibold">{APP_NAME}</h1>
        <p className="text-sm text-muted-foreground">{APP_DESCRIPTION}</p>
      </header>

      {/* Main three-pane layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop: side-by-side, Mobile/Tablet: stacked */}
        <div className="flex h-full w-full flex-col gap-4 overflow-y-auto p-4 md:flex-row md:overflow-hidden">
          {/* Icon Search Pane */}
          <div className="flex min-h-[400px] flex-shrink-0 flex-col overflow-hidden md:h-full md:min-h-0 md:flex-1">
            <IconSearchPane
              searchQuery={state.searchQuery}
              onSearchChange={actions.setSearchQuery}
              selectedPack={state.selectedPack}
              onPackChange={actions.setSelectedPack}
              selectedIconId={state.selectedIconId}
              onIconSelect={actions.setSelectedIconId}
            />
          </div>

          {/* Customization Controls Pane */}
          <div className="flex min-h-[400px] flex-shrink-0 flex-col overflow-hidden md:h-full md:min-h-0 md:flex-1">
            <CustomizationControlsPane
              selectedLocations={state.selectedLocations}
              onLocationsChange={actions.setSelectedLocations}
              backgroundColor={state.backgroundColor}
              onBackgroundColorChange={actions.setBackgroundColor}
              iconColor={state.iconColor}
              onIconColorChange={actions.setIconColor}
              iconSize={state.iconSize}
              onIconSizeChange={actions.setIconSize}
            />
          </div>

          {/* Preview Pane */}
          <div className="flex min-h-[400px] flex-shrink-0 flex-col overflow-hidden md:h-full md:min-h-0 md:flex-1">
            <PreviewPane
              selectedLocations={state.selectedLocations}
              selectedIconId={state.selectedIconId}
              state={state}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
