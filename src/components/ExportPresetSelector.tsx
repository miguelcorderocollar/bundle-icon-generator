/**
 * Export preset selector dropdown
 */

import * as React from "react";
import { Package, Plus, Trash2, Edit2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ExportPreset } from "@/src/types/preset";

export interface ExportPresetSelectorProps {
  presets: ExportPreset[];
  selectedPresetId: string;
  onSelectPreset: (id: string) => void;
  onCreatePreset?: () => void;
  onEditPreset?: (preset: ExportPreset) => void;
  onDeletePreset?: (id: string) => void;
  showLabel?: boolean;
  className?: string;
}

export function ExportPresetSelector({
  presets,
  selectedPresetId,
  onSelectPreset,
  onCreatePreset,
  onEditPreset,
  onDeletePreset,
  showLabel = true,
  className,
}: ExportPresetSelectorProps) {
  const selectedPreset = presets.find((p) => p.id === selectedPresetId);
  const builtInPresets = presets.filter((p) => p.isBuiltIn);
  const customPresets = presets.filter((p) => !p.isBuiltIn);

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex items-center gap-2 mb-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-medium">Export Preset</Label>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Select value={selectedPresetId} onValueChange={onSelectPreset}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select preset...">
              {selectedPreset?.name}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {/* Built-in presets */}
            {builtInPresets.length > 0 && (
              <SelectGroup>
                <SelectLabel>Built-in Presets</SelectLabel>
                {builtInPresets.map((preset) => (
                  <SelectItem key={preset.id} value={preset.id}>
                    <div className="flex flex-col">
                      <span>{preset.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {preset.variants.length} variant
                        {preset.variants.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
            )}

            {/* Custom presets */}
            {customPresets.length > 0 && (
              <>
                {builtInPresets.length > 0 && <SelectSeparator />}
                <SelectGroup>
                  <SelectLabel>Custom Presets</SelectLabel>
                  {customPresets.map((preset) => (
                    <SelectItem key={preset.id} value={preset.id}>
                      <div className="flex flex-col">
                        <span>{preset.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {preset.variants.length} variant
                          {preset.variants.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </>
            )}
          </SelectContent>
        </Select>

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          {onCreatePreset && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onCreatePreset}
                  className="h-9 w-9"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Create custom preset</TooltipContent>
            </Tooltip>
          )}

          {selectedPreset && !selectedPreset.isBuiltIn && (
            <>
              {onEditPreset && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onEditPreset(selectedPreset)}
                      className="h-9 w-9"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Edit preset</TooltipContent>
                </Tooltip>
              )}

              {onDeletePreset && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onDeletePreset(selectedPreset.id)}
                      className="h-9 w-9 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Delete preset</TooltipContent>
                </Tooltip>
              )}
            </>
          )}
        </div>
      </div>

      {/* Preset description */}
      {selectedPreset && (
        <p className="mt-2 text-xs text-muted-foreground">
          {selectedPreset.description}
        </p>
      )}
    </div>
  );
}
