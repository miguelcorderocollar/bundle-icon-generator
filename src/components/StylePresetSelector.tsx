/**
 * Style preset selector dropdown for quick style switching
 */

import * as React from "react";
import { Palette, Plus, Trash2, Edit2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { StylePreset } from "@/src/types/preset";
import type { BackgroundValue } from "@/src/utils/gradients";
import { gradientToCss, isGradient } from "@/src/utils/gradients";

export interface StylePresetSelectorProps {
  presets: StylePreset[];
  selectedPresetId: string | null;
  onSelectPreset: (id: string | null) => void;
  onApplyPreset: (preset: StylePreset) => void;
  onCreatePreset?: () => void;
  onEditPreset?: (preset: StylePreset) => void;
  onDeletePreset?: (id: string) => void;
  showLabel?: boolean;
  className?: string;
}

function getBackgroundStyle(bg: BackgroundValue): React.CSSProperties {
  if (isGradient(bg)) {
    return { background: gradientToCss(bg) };
  }
  return { backgroundColor: bg };
}

export function StylePresetSelector({
  presets,
  selectedPresetId,
  onSelectPreset,
  onApplyPreset,
  onCreatePreset,
  onEditPreset,
  onDeletePreset,
  showLabel = true,
  className,
}: StylePresetSelectorProps) {
  const selectedPreset = presets.find((p) => p.id === selectedPresetId);
  const builtInPresets = presets.filter((p) => p.isBuiltIn);
  const customPresets = presets.filter((p) => !p.isBuiltIn);

  const handleSelectPreset = (presetId: string) => {
    const preset = presets.find((p) => p.id === presetId);
    if (preset) {
      onSelectPreset(preset.id);
      onApplyPreset(preset);
    }
  };

  return (
    <div className={className}>
      {showLabel && (
        <div className="mb-2 flex items-center gap-2">
          <Palette className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-medium">Style Preset</Label>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Select
          value={selectedPresetId ?? ""}
          onValueChange={handleSelectPreset}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select style...">
              {selectedPreset ? (
                <div className="flex items-center gap-2">
                  <StylePreview preset={selectedPreset} size="sm" />
                  <span className="truncate">{selectedPreset.name}</span>
                </div>
              ) : null}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-64">
            {/* Custom presets first */}
            {customPresets.length > 0 && (
              <SelectGroup>
                <SelectLabel>Custom Styles</SelectLabel>
                {customPresets.map((preset) => (
                  <SelectItem key={preset.id} value={preset.id}>
                    <div className="flex items-center gap-2">
                      <StylePreview preset={preset} size="sm" />
                      <span>{preset.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
            )}

            {/* Built-in presets */}
            {builtInPresets.length > 0 && (
              <>
                {customPresets.length > 0 && <SelectSeparator />}
                <SelectGroup>
                  <SelectLabel>Built-in Styles</SelectLabel>
                  {builtInPresets.map((preset) => (
                    <SelectItem key={preset.id} value={preset.id}>
                      <div className="flex items-center gap-2">
                        <StylePreview preset={preset} size="sm" />
                        <span>{preset.name}</span>
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
              <TooltipContent>Create custom style</TooltipContent>
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
                  <TooltipContent>Edit style</TooltipContent>
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
                  <TooltipContent>Delete style</TooltipContent>
                </Tooltip>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface StylePreviewProps {
  preset: StylePreset;
  size?: "sm" | "md";
}

function StylePreview({ preset, size = "md" }: StylePreviewProps) {
  const sizeClass = size === "sm" ? "h-5 w-5" : "h-8 w-8";

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-md border",
        sizeClass
      )}
      style={getBackgroundStyle(preset.backgroundColor)}
    >
      <div
        className={cn("rounded-sm", size === "sm" ? "h-2 w-2" : "h-3 w-3")}
        style={{ backgroundColor: preset.iconColor }}
      />
    </div>
  );
}
