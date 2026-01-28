"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Search,
  X,
  Shuffle,
  Library,
  Upload,
  Smile,
  Image as ImageIcon,
  Layers,
  PenTool,
} from "lucide-react";
import { IconGrid } from "@/src/components/IconGrid";
import { useKeyboardShortcuts } from "@/src/hooks/use-keyboard-shortcuts";
import { useIconSearch, type SortOption } from "@/src/hooks/use-icon-search";
import { ICON_PACKS, type IconPack } from "@/src/constants/app";
import { addRecentIcon } from "@/src/utils/local-storage";
import { getFavorites } from "@/src/utils/local-storage";
import { EmojiInput } from "@/src/components/EmojiInput";
import { CustomSvgInput } from "@/src/components/CustomSvgInput";
import { CustomImageInput } from "@/src/components/CustomImageInput";
import { getRemixIconCategories } from "@/src/utils/icon-catalog";
import type { AppLocation } from "@/src/types/app-location";
import { useRestriction } from "@/src/contexts/RestrictionContext";

export interface IconSearchPaneProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  selectedPack?: IconPack;
  onPackChange?: (pack: IconPack) => void;
  selectedIconId?: string;
  onIconSelect?: (iconId: string) => void;
  /** Selected app locations - kept for backwards compatibility */
  selectedLocations?: AppLocation[];
  /** When true, shows minimal UI (just pack selector) for canvas mode */
  isCanvasMode?: boolean;
}

export function IconSearchPane({
  searchQuery = "",
  onSearchChange,
  selectedPack = ICON_PACKS.ALL,
  onPackChange,
  selectedIconId,
  onIconSelect,
  isCanvasMode = false,
}: IconSearchPaneProps) {
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const [isMac, setIsMac] = React.useState<boolean>(false); // Default to false to avoid hydration mismatch
  const { isRestricted, isIconPackAllowed, isLoading: isRestrictionLoading } = useRestriction();
  const [sortBy, setSortBy] = React.useState<SortOption>("name");
  const [_favorites, setFavorites] = React.useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(
    null
  );
  const [remixiconCategories, setRemixiconCategories] = React.useState<
    string[]
  >([]);

  React.useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf("MAC") >= 0);
    setFavorites(getFavorites());
  }, []);

  // Load RemixIcon categories when RemixIcon pack is selected
  React.useEffect(() => {
    if (selectedPack === ICON_PACKS.REMIXICON) {
      getRemixIconCategories()
        .then(setRemixiconCategories)
        .catch(console.error);
    } else {
      // Reset category when switching away from RemixIcon
      setSelectedCategory(null);
    }
  }, [selectedPack]);

  // Use the icon search hook
  const { icons, isLoading, error } = useIconSearch({
    searchQuery,
    selectedPack,
    selectedCategory,
    sortBy,
  });

  // Refresh favorites when they change (triggered by favorite toggle)
  const handleFavoriteToggle = React.useCallback(
    (_iconId: string, _isFavorite: boolean) => {
      setFavorites(getFavorites());
      // Dispatch custom event to trigger refresh in useIconSearch hook
      window.dispatchEvent(new Event("icon-favorites-changed"));
    },
    []
  );

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

  // Minimal mode for canvas - just show pack selector
  if (isCanvasMode) {
    return (
      <Card className="flex h-full flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Source</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Select value={selectedPack} onValueChange={handlePackChange}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {isIconPackAllowed(ICON_PACKS.ALL) && (
                <SelectItem value={ICON_PACKS.ALL}>
                  <span className="flex items-center gap-2">
                    <Layers className="size-4" />
                    All Icons
                  </span>
                </SelectItem>
              )}
              {isIconPackAllowed(ICON_PACKS.GARDEN) && (
                <SelectItem value={ICON_PACKS.GARDEN}>
                  <span className="flex items-center gap-2">
                    <Library className="size-4" />
                    Garden
                  </span>
                </SelectItem>
              )}
              {isIconPackAllowed(ICON_PACKS.FEATHER) && (
                <SelectItem value={ICON_PACKS.FEATHER}>
                  <span className="flex items-center gap-2">
                    <Library className="size-4" />
                    Feather
                  </span>
                </SelectItem>
              )}
              {isIconPackAllowed(ICON_PACKS.REMIXICON) && (
                <SelectItem value={ICON_PACKS.REMIXICON}>
                  <span className="flex items-center gap-2">
                    <Library className="size-4" />
                    RemixIcon
                  </span>
                </SelectItem>
              )}
              {isIconPackAllowed(ICON_PACKS.EMOJI) && (
                <SelectItem value={ICON_PACKS.EMOJI}>
                  <span className="flex items-center gap-2">
                    <Smile className="size-4" />
                    Emoji
                  </span>
                </SelectItem>
              )}
              {isIconPackAllowed(ICON_PACKS.CUSTOM_SVG) && (
                <SelectItem value={ICON_PACKS.CUSTOM_SVG}>
                  <span className="flex items-center gap-2">
                    <Upload className="size-4" />
                    Custom SVG
                  </span>
                </SelectItem>
              )}
              {isIconPackAllowed(ICON_PACKS.CUSTOM_IMAGE) && (
                <SelectItem value={ICON_PACKS.CUSTOM_IMAGE}>
                  <span className="flex items-center gap-2">
                    <ImageIcon className="size-4" />
                    Custom Image
                  </span>
                </SelectItem>
              )}
              {isIconPackAllowed(ICON_PACKS.CANVAS) && (
                <SelectItem value={ICON_PACKS.CANVAS}>
                  <span className="flex items-center gap-2">
                    <PenTool className="size-4" />
                    Canvas Editor
                  </span>
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Select a different source to exit canvas mode.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>Icon Search</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 min-h-0 flex-col gap-4 overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Label htmlFor="icon-search" className="sr-only">
              Search icons
            </Label>
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              id="icon-search"
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
                  size="icon-lg"
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
          <label
            htmlFor="sort-select"
            className="text-sm text-muted-foreground whitespace-nowrap"
          >
            Sort by:
          </label>
          <Select
            value={sortBy}
            onValueChange={(value) => setSortBy(value as SortOption)}
          >
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
              {isIconPackAllowed(ICON_PACKS.ALL) && (
                <SelectItem value={ICON_PACKS.ALL}>
                  <span className="flex items-center gap-2">
                    <Layers className="size-4" />
                    All
                  </span>
                </SelectItem>
              )}
              {isIconPackAllowed(ICON_PACKS.GARDEN) && (
                <SelectItem value={ICON_PACKS.GARDEN}>
                  <span className="flex items-center gap-2">
                    <Library className="size-4" />
                    Garden
                  </span>
                </SelectItem>
              )}
              {isIconPackAllowed(ICON_PACKS.FEATHER) && (
                <SelectItem value={ICON_PACKS.FEATHER}>
                  <span className="flex items-center gap-2">
                    <Library className="size-4" />
                    Feather
                  </span>
                </SelectItem>
              )}
              {isIconPackAllowed(ICON_PACKS.REMIXICON) && (
                <SelectItem value={ICON_PACKS.REMIXICON}>
                  <span className="flex items-center gap-2">
                    <Library className="size-4" />
                    RemixIcon
                  </span>
                </SelectItem>
              )}
              {isIconPackAllowed(ICON_PACKS.EMOJI) && (
                <SelectItem value={ICON_PACKS.EMOJI}>
                  <span className="flex items-center gap-2">
                    <Smile className="size-4" />
                    Emoji
                  </span>
                </SelectItem>
              )}
              {isIconPackAllowed(ICON_PACKS.CUSTOM_SVG) && (
                <SelectItem value={ICON_PACKS.CUSTOM_SVG}>
                  <span className="flex items-center gap-2">
                    <Upload className="size-4" />
                    Custom SVG
                  </span>
                </SelectItem>
              )}
              {isIconPackAllowed(ICON_PACKS.CUSTOM_IMAGE) && (
                <SelectItem value={ICON_PACKS.CUSTOM_IMAGE}>
                  <span className="flex items-center gap-2">
                    <ImageIcon className="size-4" />
                    Custom Image
                  </span>
                </SelectItem>
              )}
              {isIconPackAllowed(ICON_PACKS.CANVAS) && (
                <SelectItem value={ICON_PACKS.CANVAS}>
                  <span className="flex items-center gap-2">
                    <PenTool className="size-4" />
                    Canvas Editor
                  </span>
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          {!isRestrictionLoading && isRestricted ? (
            <p className="text-xs text-muted-foreground">
              Icon pack options are restricted in this session.
            </p>
          ) : null}
        </div>

        {/* Category Selector (only for RemixIcon) */}
        {selectedPack === ICON_PACKS.REMIXICON &&
          remixiconCategories.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="category-select">Category</Label>
              <Select
                value={selectedCategory || "all"}
                onValueChange={(value) =>
                  setSelectedCategory(value === "all" ? null : value)
                }
              >
                <SelectTrigger id="category-select" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {remixiconCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

        {/* Content based on selected pack */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {selectedPack === ICON_PACKS.CANVAS ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <PenTool className="size-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Canvas Editor</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Create custom icon compositions with multiple layers. Use the
                Canvas tab in the Preview pane to add icons, images, and text.
              </p>
            </div>
          ) : selectedPack === ICON_PACKS.CUSTOM_IMAGE ? (
            <CustomImageInput
              onSelect={(imageId) => {
                handleIconSelect(imageId);
              }}
            />
          ) : selectedPack === ICON_PACKS.CUSTOM_SVG ? (
            <CustomSvgInput
              onSelect={(svg, allowColorOverride = false) => {
                // Create a custom icon ID and select it
                const customIconId = `custom-svg-${Date.now()}`;
                // Store custom SVG and color override preference
                if (typeof window !== "undefined") {
                  sessionStorage.setItem(customIconId, svg);
                  sessionStorage.setItem(
                    `${customIconId}-allowColorOverride`,
                    String(allowColorOverride)
                  );
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
                    onRemove={
                      selectedPack === ICON_PACKS.EMOJI ? () => {} : undefined
                    }
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
