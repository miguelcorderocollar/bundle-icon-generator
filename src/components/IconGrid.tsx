/**
 * Responsive icon grid component that fills width horizontally
 */

import * as React from "react";
import { IconGridItem } from "./IconGridItem";
import { EmptyState } from "./EmptyState";
import { ICON_GRID } from "@/src/constants/app";
import type { IconMetadata } from "@/src/types/icon";

export interface IconGridProps {
  icons: IconMetadata[];
  selectedIconId?: string;
  onIconSelect?: (iconId: string) => void;
  onFavoriteToggle?: (iconId: string, isFavorite: boolean) => void;
  onRemove?: (iconId: string) => void;
  searchQuery?: string;
  isLoading?: boolean;
}

const MAX_VISIBLE_ICONS = 100;

export function IconGrid({
  icons,
  selectedIconId,
  onIconSelect,
  onFavoriteToggle,
  onRemove,
  searchQuery,
  isLoading = false,
}: IconGridProps) {
  const iconSize = ICON_GRID.DEFAULT_ICON_SIZE;
  const [showAll, setShowAll] = React.useState(false);

  // Limit visible icons for performance
  const visibleIcons = React.useMemo(() => {
    if (showAll || icons.length <= MAX_VISIBLE_ICONS) {
      return icons;
    }
    return icons.slice(0, MAX_VISIBLE_ICONS);
  }, [icons, showAll]);

  const hasMore = icons.length > MAX_VISIBLE_ICONS && !showAll;

  if (isLoading) {
    return (
      <EmptyState
        title="Loading icons..."
        description="Please wait while we load the icon catalog."
      />
    );
  }

  if (icons.length === 0) {
    return (
      <EmptyState
        title="No icons found"
        description="Try adjusting your search or selecting a different pack."
      />
    );
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="w-full space-y-2 p-2">
          {searchQuery && (
            <div className="flex items-center justify-between px-2">
              <p className="text-xs text-muted-foreground">
                {icons.length} result{icons.length !== 1 ? "s" : ""} found
                {hasMore &&
                  ` (showing ${MAX_VISIBLE_ICONS} of ${icons.length})`}
              </p>
              <p className="text-xs text-muted-foreground">
                Click an icon to select it
              </p>
            </div>
          )}
          <div
            className="grid w-full gap-2"
            style={{
              gridTemplateColumns: `repeat(auto-fill, minmax(${iconSize}px, 1fr))`,
            }}
            role="grid"
            aria-label="Icon grid"
          >
            {visibleIcons.map((icon) => (
              <IconGridItem
                key={icon.id}
                icon={icon}
                isSelected={selectedIconId === icon.id}
                onClick={() => onIconSelect?.(icon.id)}
                onFavoriteToggle={onFavoriteToggle}
                onRemove={onRemove}
                style={{
                  minHeight: `${iconSize}px`,
                  aspectRatio: "1 / 1",
                }}
              />
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center pt-4 pb-4">
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className="text-sm text-primary hover:underline"
              >
                Load all {icons.length} icons
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
