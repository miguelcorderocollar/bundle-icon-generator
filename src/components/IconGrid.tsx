/**
 * Responsive icon grid component that fills width horizontally
 */

import * as React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { IconGridItem } from "./IconGridItem";
import { EmptyState } from "./EmptyState";
import { ICON_GRID } from "@/src/constants/app";

export interface IconGridProps {
  icons: Array<{ id: string; label: string }>;
  selectedIconId?: string;
  onIconSelect?: (iconId: string) => void;
  searchQuery?: string;
}

export function IconGrid({
  icons,
  selectedIconId,
  onIconSelect,
  searchQuery,
}: IconGridProps) {
  const iconSize = ICON_GRID.DEFAULT_ICON_SIZE;
  const gap = ICON_GRID.GAP;

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
      <ScrollArea className="flex-1 w-full">
        <div className="w-full space-y-2 p-2">
          {searchQuery && (
            <div className="flex items-center justify-between px-2">
              <p className="text-xs text-muted-foreground">
                {icons.length} result{icons.length !== 1 ? "s" : ""} found
              </p>
            </div>
          )}
          <div
            className="grid w-full gap-2"
            style={{
              gridTemplateColumns: `repeat(auto-fill, minmax(${iconSize}px, 1fr))`,
            }}
          >
            {icons.map((icon) => (
              <IconGridItem
                key={icon.id}
                id={icon.id}
                label={icon.label}
                isSelected={selectedIconId === icon.id}
                onClick={() => onIconSelect?.(icon.id)}
                style={{ 
                  minHeight: `${iconSize}px`,
                  aspectRatio: "1 / 1",
                }}
              />
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

