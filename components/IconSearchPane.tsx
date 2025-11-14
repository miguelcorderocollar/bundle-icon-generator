"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Search, X, Shuffle } from "lucide-react";
import { IconGrid } from "@/src/components/IconGrid";
import { useKeyboardShortcuts } from "@/src/hooks/use-keyboard-shortcuts";
import { useIconSearch, type SortOption } from "@/src/hooks/use-icon-search";
import { ICON_PACKS, type IconPack } from "@/src/constants/app";
import { addRecentIcon } from "@/src/utils/local-storage";
import { getFavorites } from "@/src/utils/local-storage";
import { EmojiInput } from "@/src/components/EmojiInput";
import { CustomSvgInput } from "@/src/components/CustomSvgInput";

export interface IconSearchPaneProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  selectedPack?: IconPack;
  onPackChange?: (pack: IconPack) => void;
  selectedIconId?: string;
  onIconSelect?: (iconId: string) => void;
}

export function IconSearchPane({
  searchQuery = "",
  onSearchChange,
  selectedPack = ICON_PACKS.ALL,
  onPackChange,
  selectedIconId,
  onIconSelect,
}: IconSearchPaneProps) {
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const [isMac, setIsMac] = React.useState<boolean>(false); // Default to false to avoid hydration mismatch
  const [sortBy, setSortBy] = React.useState<SortOption>("name");
  const [favorites, setFavorites] = React.useState<string[]>([]);

  React.useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf("MAC") >= 0);
    setFavorites(getFavorites());
  }, []);

  // Use the icon search hook
  const { icons, isLoading, error } = useIconSearch({
    searchQuery,
    selectedPack,
    sortBy,
  });

  // Refresh favorites when they change (triggered by favorite toggle)
  const handleFavoriteToggle = React.useCallback((iconId: string, isFavorite: boolean) => {
    setFavorites(getFavorites());
    // Dispatch custom event to trigger refresh in useIconSearch hook
    window.dispatchEvent(new Event("icon-favorites-changed"));
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange?.(e.target.value);
  };

  const handleClearSearch = () => {
    onSearchChange?.("");
    searchInputRef.current?.focus();
  };

  const handlePackChange = (value: string) => {
    onPackChange?.(value as IconPack);
  };

  const handleFocusSearch = () => {
    searchInputRef.current?.focus();
  };

  const handleIconSelect = (iconId: string) => {
    // Add to recent icons
    addRecentIcon(iconId);
    onIconSelect?.(iconId);
  };

  const handleRandomIcon = () => {
    if (icons.length === 0) return;
    const randomIndex = Math.floor(Math.random() * icons.length);
    const randomIcon = icons[randomIndex];
    handleIconSelect(randomIcon.id);
  };

  useKeyboardShortcuts({
    onSearchFocus: handleFocusSearch,
    onEscape: handleClearSearch,
  });

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>Icon Search</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 min-h-0 flex-col gap-4 overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              ref={searchInputRef}
              placeholder={`Search icons... (Press ${isMac ? "⌘K" : "Ctrl+K"} to focus)`}
              className="pl-9 pr-9"
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  handleClearSearch();
                }
              }}
            />
            {searchQuery && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label="Clear search"
                    >
                      <X className="size-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Clear search (Esc)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleRandomIcon}
                  disabled={icons.length === 0 || isLoading}
                  aria-label="Random icon"
                  className="cursor-pointer"
                >
                  <Shuffle className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Pick a random icon</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Sort Control */}
        <div className="flex items-center gap-2">
          <label htmlFor="sort-select" className="text-sm text-muted-foreground whitespace-nowrap">
            Sort by:
          </label>
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <SelectTrigger id="sort-select" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="recent">Recently Used</SelectItem>
              <SelectItem value="favorites">Favorites First</SelectItem>
              <SelectItem value="pack">Pack</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Icon Pack Selector */}
        <div className="space-y-2">
          <Label htmlFor="icon-pack-select">Icon Pack</Label>
          <Select value={selectedPack} onValueChange={handlePackChange}>
            <SelectTrigger id="icon-pack-select" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ICON_PACKS.ALL}>All</SelectItem>
              <SelectItem value={ICON_PACKS.GARDEN}>Garden</SelectItem>
              <SelectItem value={ICON_PACKS.FEATHER}>Feather</SelectItem>
              <SelectItem value={ICON_PACKS.EMOJI}>Emoji</SelectItem>
              <SelectItem value={ICON_PACKS.CUSTOM_SVG}>Custom SVG</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Content based on selected pack */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {selectedPack === ICON_PACKS.CUSTOM_SVG ? (
            <CustomSvgInput
              onSelect={(svg, allowColorOverride = false) => {
                // Create a custom icon ID and select it
                const customIconId = `custom-svg-${Date.now()}`;
                // Store custom SVG and color override preference
                if (typeof window !== "undefined") {
                  sessionStorage.setItem(customIconId, svg);
                  sessionStorage.setItem(`${customIconId}-allowColorOverride`, String(allowColorOverride));
                }
                handleIconSelect(customIconId);
              }}
            />
          ) : selectedPack === ICON_PACKS.EMOJI ? (
            <div className="flex flex-col gap-4 h-full min-h-0">
              <EmojiInput
                onEmojiAdded={(emojiId) => {
                  // Trigger refresh of icon search to show new emoji
                  // Use a small delay to ensure the refresh completes before selecting
                  window.dispatchEvent(new Event("icon-favorites-changed"));
                  
                  // Auto-select the newly added emoji so it appears in preview
                  // Small delay ensures the icon list is refreshed first
                  if (emojiId) {
                    setTimeout(() => {
                      handleIconSelect(emojiId);
                    }, 100);
                  }
                }}
              />
              {error ? (
                <div className="flex items-center justify-center h-full text-destructive">
                  <p>Error loading icons: {error.message}</p>
                </div>
              ) : (
                <div className="flex-1 min-h-0 overflow-hidden">
                  <IconGrid
                    icons={icons}
                    selectedIconId={selectedIconId}
                    onIconSelect={handleIconSelect}
                    onFavoriteToggle={handleFavoriteToggle}
                    onRemove={selectedPack === ICON_PACKS.EMOJI ? () => {} : undefined}
                    searchQuery={searchQuery}
                    isLoading={isLoading}
                  />
                </div>
              )}
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full text-destructive">
              <p>Error loading icons: {error.message}</p>
            </div>
          ) : (
            <IconGrid
              icons={icons}
              selectedIconId={selectedIconId}
              onIconSelect={handleIconSelect}
              onFavoriteToggle={handleFavoriteToggle}
              searchQuery={searchQuery}
              isLoading={isLoading}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
