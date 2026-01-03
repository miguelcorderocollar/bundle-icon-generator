"use client";

import * as React from "react";
import { IconSearchPane } from "@/components/IconSearchPane";
import { CustomizationControlsPane } from "@/components/CustomizationControlsPane";
import { PreviewPane } from "@/components/PreviewPane";
import { useIconGenerator } from "@/src/hooks/use-icon-generator";
import { APP_NAME, APP_DESCRIPTION } from "@/src/constants/app";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Info, Github, Globe, Moon, Sun } from "lucide-react";
import { useTheme } from "@/src/components/ThemeProvider";

export default function Home() {
  const { state, actions } = useIconGenerator();
  const [isInfoOpen, setIsInfoOpen] = React.useState(false);
  const { theme, mounted, toggleTheme } = useTheme();

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b bg-background px-6 py-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{APP_NAME}</h1>
            <p className="text-sm text-muted-foreground">{APP_DESCRIPTION}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {mounted && theme === "light" ? (
                <Moon className="h-5 w-5" />
              ) : mounted && theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
            <Dialog open={isInfoOpen} onOpenChange={setIsInfoOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0">
                  <Info className="h-5 w-5" />
                  <span className="sr-only">About this app</span>
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>About {APP_NAME}</DialogTitle>
                <DialogDescription>
                  {APP_DESCRIPTION}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <p className="text-sm text-muted-foreground">
                  Zendesk App Icon Generator is a local-first tool for crafting compliant Zendesk app icon bundles. 
                  It streamlines choosing icons from vetted packs, customizing colors and effects, and exporting 
                  the required asset set with correct naming and sizing.
                </p>
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Key Features</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Centralized Apache-2.0 friendly icon packs (Zendesk Garden, Feather, and more)</li>
                    <li>Intuitive search and selection experience tailored to Zendesk app locations</li>
                    <li>Real-time previews with configurable styling presets</li>
                    <li>One-click ZIP export with correct naming and sizing</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Open Source</h3>
                  <p className="text-sm text-muted-foreground">
                    This project is open source and available on GitHub. Contributions and feedback are welcome!
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="text-sm"
                    >
                      <a
                        href="https://github.com/miguelcorderocollar/zdk.icon-generator"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View on GitHub
                      </a>
                    </Button>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground">
                    Made by{" "}
                    <a
                      href="https://github.com/miguelcorderocollar"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-foreground hover:underline"
                    >
                      <Github className="h-3.5 w-3.5" />
                      Miguel Cordero Collar
                    </a>
                    {" · "}
                    <a
                      href="https://miguelcorderocollar.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-foreground hover:underline"
                    >
                      <Globe className="h-3.5 w-3.5" />
                      miguelcorderocollar.com
                    </a>
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        </div>
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
              selectedLocations={state.selectedLocations}
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
              svgIconSize={state.svgIconSize}
              onSvgIconSizeChange={actions.setSvgIconSize}
              selectedIconId={state.selectedIconId}
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
