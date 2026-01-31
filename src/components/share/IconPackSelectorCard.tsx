"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Star } from "lucide-react";
import type { RestrictionConfig } from "@/src/types/restriction";
import {
  ICON_PACK_OPTIONS,
  type UseIconPackSelectorReturn,
} from "@/src/hooks/use-icon-pack-selector";

export interface IconPackSelectorCardProps {
  /** Current config */
  config: RestrictionConfig;
  /** Icon pack selector hook return */
  iconPackSelector: UseIconPackSelectorReturn;
}

/**
 * Card component for selecting allowed icon packs
 */
export function IconPackSelectorCard({
  config,
  iconPackSelector,
}: IconPackSelectorCardProps) {
  const {
    toggleIconPack,
    toggleAllPacks,
    setDefaultIconPack,
    isPackSelected,
    isDefaultPack,
  } = iconPackSelector;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Allowed Icon Packs</span>
          <Button size="sm" variant="outline" onClick={toggleAllPacks}>
            {(config.allowedIconPacks?.length ?? 0) === ICON_PACK_OPTIONS.length
              ? "Deselect All"
              : "Select All"}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {ICON_PACK_OPTIONS.map((option) => {
            const isChecked = isPackSelected(option.value);
            const isDefault = isDefaultPack(option.value);

            return (
              <div
                key={option.value}
                className="flex items-center gap-2 rounded-md border p-3 hover:bg-accent"
              >
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={() => toggleIconPack(option.value)}
                  id={`pack-${option.value}`}
                />
                <label
                  htmlFor={`pack-${option.value}`}
                  className="flex-1 cursor-pointer text-sm"
                >
                  {option.label}
                </label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={() => setDefaultIconPack(option.value)}
                      >
                        <Star
                          className={`h-3.5 w-3.5 ${
                            isDefault
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted-foreground"
                          }`}
                        />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isDefault
                        ? "Default pack (click to unset)"
                        : "Set as default pack"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {!config.allowedIconPacks
            ? "All icon packs are allowed"
            : `${config.allowedIconPacks.length} pack(s) allowed`}
          {config.defaultIconPack && (
            <>
              {" · "}
              Default:{" "}
              {ICON_PACK_OPTIONS.find((o) => o.value === config.defaultIconPack)
                ?.label || config.defaultIconPack}
            </>
          )}
        </p>
      </CardContent>
    </Card>
  );
}
