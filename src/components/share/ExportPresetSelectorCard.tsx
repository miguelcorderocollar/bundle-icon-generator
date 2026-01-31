"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Plus, Edit2, Trash2 } from "lucide-react";
import type { RestrictionConfig } from "@/src/types/restriction";
import type { ShareMode } from "@/src/hooks/use-share-config";
import type { UseExportPresetManagerReturn } from "@/src/hooks/use-export-preset-manager";
import { BUILTIN_EXPORT_PRESETS } from "@/src/utils/builtin-presets";

export interface ExportPresetSelectorCardProps {
  /** Current config */
  config: RestrictionConfig;
  /** Current share mode */
  shareMode: ShareMode;
  /** Export preset manager hook return */
  presetManager: UseExportPresetManagerReturn;
}

/**
 * Card component for selecting and managing export presets
 */
export function ExportPresetSelectorCard({
  config,
  shareMode,
  presetManager,
}: ExportPresetSelectorCardProps) {
  const {
    customPresets,
    toggleBuiltInPreset,
    toggleAllPresets,
    createCustomPreset,
    editCustomPreset,
    deleteCustomPreset,
  } = presetManager;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>
            {shareMode === "restricted"
              ? "Allowed Export Presets"
              : "Custom Export Presets to Share"}
          </span>
          <div className="flex items-center gap-2">
            {shareMode === "restricted" && (
              <Button size="sm" variant="outline" onClick={toggleAllPresets}>
                {(config.allowedExportPresets?.length ?? 0) ===
                BUILTIN_EXPORT_PRESETS.length
                  ? "Deselect All"
                  : "Select All"}
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={createCustomPreset}>
              <Plus className="mr-2 h-4 w-4" />
              Custom
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Built-in Presets - Only show in restricted mode */}
        {shareMode === "restricted" && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Built-in Presets
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {BUILTIN_EXPORT_PRESETS.map((preset) => {
                const isChecked =
                  !config.allowedExportPresets ||
                  config.allowedExportPresets.some((p) => p.id === preset.id);

                return (
                  <label
                    key={preset.id}
                    className="flex items-start gap-3 cursor-pointer rounded-md border p-3 hover:bg-accent"
                  >
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => toggleBuiltInPreset(preset.id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{preset.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {preset.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {preset.variants.length} variant(s)
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Custom Presets */}
        {customPresets.length > 0 ? (
          <div>
            {shareMode === "restricted" && <Separator className="my-4" />}
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Custom Presets
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {customPresets.map(({ preset, index }) => (
                <div
                  key={preset.id}
                  className="flex items-start gap-3 rounded-md border p-3 hover:bg-accent"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{preset.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {preset.description || "Custom preset"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {preset.variants?.length || 0} variant(s)
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => editCustomPreset(preset, index)}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit preset</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => deleteCustomPreset(index)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete preset</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          shareMode === "import" && (
            <p className="text-center text-sm text-muted-foreground py-4">
              No custom export presets yet. Click &quot;Custom&quot; to create
              one to share.
            </p>
          )
        )}

        <p className="text-xs text-muted-foreground">
          {shareMode === "restricted" ? (
            !config.allowedExportPresets ? (
              "All export presets are allowed"
            ) : (
              `${config.allowedExportPresets.length} preset(s) allowed`
            )
          ) : (
            <>{customPresets.length} custom preset(s) will be shared</>
          )}
        </p>
      </CardContent>
    </Card>
  );
}
