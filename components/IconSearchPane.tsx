"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Search, X } from "lucide-react";
import { IconGrid } from "@/src/components/IconGrid";
import { useKeyboardShortcuts } from "@/src/hooks/use-keyboard-shortcuts";
import { ICON_PACKS } from "@/src/constants/app";

export interface IconSearchPaneProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  selectedPack?: string;
  onPackChange?: (pack: string) => void;
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
  const [isMac, setIsMac] = React.useState(false);

  React.useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf("MAC") >= 0);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange?.(e.target.value);
  };

  const handleClearSearch = () => {
    onSearchChange?.("");
    searchInputRef.current?.focus();
  };

  const handlePackChange = (value: string) => {
    onPackChange?.(value);
  };

  const handleFocusSearch = () => {
    searchInputRef.current?.focus();
  };

  useKeyboardShortcuts({
    onSearchFocus: handleFocusSearch,
    onEscape: handleClearSearch,
  });

  // Generate icon list based on pack and search query
  const generateIcons = React.useCallback(
    (count: number, label: string, pack: string) => {
      const filteredCount = searchQuery
        ? Math.max(0, count - Math.floor(Math.random() * count * 0.3))
        : count;

      return Array.from({ length: filteredCount }).map((_, i) => ({
        id: `${pack}-${i + 1}`,
        label: `${label} ${i + 1}`,
      }));
    },
    [searchQuery]
  );

  const allIcons = React.useMemo(
    () => generateIcons(24, "Icon", ICON_PACKS.ALL),
    [generateIcons]
  );
  const gardenIcons = React.useMemo(
    () => generateIcons(12, "Garden", ICON_PACKS.GARDEN),
    [generateIcons]
  );
  const featherIcons = React.useMemo(
    () => generateIcons(12, "Feather", ICON_PACKS.FEATHER),
    [generateIcons]
  );

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>Icon Search</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 overflow-hidden">
        {/* Search Input */}
        <div className="relative">
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

        {/* Filters Tabs */}
        <Tabs
          value={selectedPack}
          onValueChange={handlePackChange}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value={ICON_PACKS.ALL}>All</TabsTrigger>
            <TabsTrigger value={ICON_PACKS.GARDEN}>Garden</TabsTrigger>
            <TabsTrigger value={ICON_PACKS.FEATHER}>Feather</TabsTrigger>
          </TabsList>

          <TabsContent
            value={ICON_PACKS.ALL}
            className="mt-4 flex-1 min-h-0 overflow-hidden data-[state=active]:flex data-[state=active]:flex-col"
          >
            <IconGrid
              icons={allIcons}
              selectedIconId={selectedIconId}
              onIconSelect={onIconSelect}
              searchQuery={searchQuery}
            />
          </TabsContent>

          <TabsContent
            value={ICON_PACKS.GARDEN}
            className="mt-4 flex-1 min-h-0 overflow-hidden data-[state=active]:flex data-[state=active]:flex-col"
          >
            <IconGrid
              icons={gardenIcons}
              selectedIconId={selectedIconId}
              onIconSelect={onIconSelect}
              searchQuery={searchQuery}
            />
          </TabsContent>

          <TabsContent
            value={ICON_PACKS.FEATHER}
            className="mt-4 flex-1 min-h-0 overflow-hidden data-[state=active]:flex data-[state=active]:flex-col"
          >
            <IconGrid
              icons={featherIcons}
              selectedIconId={selectedIconId}
              onIconSelect={onIconSelect}
              searchQuery={searchQuery}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
