"use client";

import * as React from "react";
import { IconSearchPane } from "@/components/IconSearchPane";
import { CustomizationControlsPane } from "@/components/CustomizationControlsPane";
import { PreviewPane } from "@/components/PreviewPane";
import { useIconGenerator } from "@/src/hooks/use-icon-generator";
import { useCanvasEditor } from "@/src/hooks/use-canvas-editor";
import { APP_NAME, APP_DESCRIPTION, ICON_PACKS } from "@/src/constants/app";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Info, Github, Globe, Moon, Sun, Lock } from "lucide-react";
import { useTheme } from "@/src/components/ThemeProvider";
import { WelcomeModal } from "@/src/components/WelcomeModal";
import { hasSeenWelcome } from "@/src/utils/local-storage";
import { CanvasControlsPane } from "@/src/components/CanvasControlsPane";
import { useRestriction } from "@/src/contexts/RestrictionContext";

export default function Home() {
  const { state, actions } = useIconGenerator();
  const [isInfoOpen, setIsInfoOpen] = React.useState(false);
  const [isWelcomeOpen, setIsWelcomeOpen] = React.useState(false);
  const { theme, mounted, toggleTheme } = useTheme();
  const {
    isRestricted,
    isLoading: isRestrictionLoading,
    defaultIconPack,
    isIconPackAllowed,
  } = useRestriction();

  // Canvas editor state - lifted to page level for sharing between components
  const { state: canvasState, actions: canvasActions } = useCanvasEditor();

  // Check if canvas mode is active
  const isCanvasMode = state.selectedPack === ICON_PACKS.CANVAS;

  // Show welcome modal on first visit
  React.useEffect(() => {
    if (!hasSeenWelcome()) {
      setIsWelcomeOpen(true);
    }
  }, []);

  // Track if we've already set the initial pack in restricted mode
  const hasSetRestrictedPackRef = React.useRef(false);

  // Auto-select the default icon pack in restricted mode
  // This ensures users start with the configured default, not whatever was persisted
  React.useEffect(() => {
    if (isRestrictionLoading) return;

    // Check if current pack is allowed
    if (!isIconPackAllowed(state.selectedPack)) {
      // Current pack not allowed - switch to default
      if (defaultIconPack) {
        actions.setSelectedPack(defaultIconPack);
        hasSetRestrictedPackRef.current = true;
      }
    } else if (isRestricted && !hasSetRestrictedPackRef.current) {
      // In restricted mode, use the configured default pack on initial load
      if (defaultIconPack && state.selectedPack !== defaultIconPack) {
        actions.setSelectedPack(defaultIconPack);
      }
      hasSetRestrictedPackRef.current = true;
    }
  }, [
    isRestrictionLoading,
    isRestricted,
    state.selectedPack,
    defaultIconPack,
    isIconPackAllowed,
    actions,
  ]);

  // Handler to apply icon color to all colorable layers in canvas
  const handleApplyIconColorToLayers = React.useCallback(
    (color: string) => {
      canvasState.layers.forEach((layer) => {
        if (layer.type === "icon" || layer.type === "text") {
          canvasActions.updateLayer(layer.id, { color });
        }
      });
    },
    [canvasState.layers, canvasActions]
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b bg-background px-6 py-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold">{APP_NAME}</h1>
              {!isRestrictionLoading && isRestricted ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                  <Lock className="h-3 w-3" />
                  Restricted Mode
                </span>
              ) : null}
            </div>
            <p className="text-sm text-muted-foreground">{APP_DESCRIPTION}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon-lg"
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
                <Button variant="ghost" size="icon-lg" className="shrink-0">
                  <Info className="h-5 w-5" />
                  <span className="sr-only">About this app</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>About {APP_NAME}</DialogTitle>
                  <DialogDescription>{APP_DESCRIPTION}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <p className="text-sm text-muted-foreground">
                    App Icon Generator is a local-first tool for crafting icon
                    bundles for any platform. It streamlines choosing icons from
                    vetted packs, customizing colors and effects, and exporting
                    the required asset set with correct naming and sizing.
                  </p>
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">Key Features</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      <li>
                        Multiple icon packs (Zendesk Garden, Feather, RemixIcon,
                        and more)
                      </li>
                      <li>
                        Flexible export presets for different platforms
                        (Zendesk, Raycast, macOS, PWA, etc.)
                      </li>
                      <li>
                        Real-time previews with configurable styling presets
                      </li>
                      <li>
                        One-click ZIP export with customizable formats and sizes
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">Open Source</h3>
                    <p className="text-sm text-muted-foreground">
                      This project is open source and available on GitHub.
                      Contributions and feedback are welcome!
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
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">Need Help?</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsInfoOpen(false);
                        setIsWelcomeOpen(true);
                      }}
                      className="w-full"
                    >
                      Show Welcome Guide
                    </Button>
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
            <WelcomeModal
              open={isWelcomeOpen}
              onOpenChange={setIsWelcomeOpen}
            />
          </div>
        </div>
      </header>

      {/* Main layout - different for canvas mode */}
      <main className="flex flex-1 overflow-hidden">
        <div className="flex h-full w-full flex-col gap-4 overflow-y-auto p-4 md:flex-row md:overflow-hidden">
          {isCanvasMode ? (
            <>
              {/* Canvas mode: 1/3 controls + 2/3 canvas editor */}
              {/* Left: Source selector + Background controls */}
              <div className="flex flex-shrink-0 flex-col overflow-hidden md:h-full md:w-80">
                <CanvasControlsPane
                  selectedPack={state.selectedPack}
                  onPackChange={actions.setSelectedPack}
                  backgroundColor={state.backgroundColor}
                  onBackgroundColorChange={actions.setBackgroundColor}
                  onApplyIconColor={handleApplyIconColorToLayers}
                />
              </div>

              {/* Right: Preview Pane (canvas editor) */}
              <div className="flex min-h-[400px] flex-1 flex-col overflow-hidden md:h-full md:min-h-0">
                <PreviewPane
                  selectedLocations={state.selectedLocations}
                  selectedIconId={state.selectedIconId}
                  state={state}
                  canvasState={canvasState}
                  canvasActions={canvasActions}
                />
              </div>
            </>
          ) : (
            <>
              {/* Standard mode: three equal panes */}
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

              <div className="flex min-h-[400px] flex-shrink-0 flex-col overflow-hidden md:h-full md:min-h-0 md:flex-1">
                <CustomizationControlsPane
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

              <div className="flex min-h-[400px] flex-shrink-0 flex-col overflow-hidden md:h-full md:min-h-0 md:flex-1">
                <PreviewPane
                  selectedLocations={state.selectedLocations}
                  selectedIconId={state.selectedIconId}
                  state={state}
                />
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
