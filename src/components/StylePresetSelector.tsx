/**
 * Style preset selector dropdown for quick style switching
 */

import * as React from "react";
import { Palette, Plus, Trash2, Edit2, Check } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
  className,
}: StylePresetSelectorProps) {
  const [open, setOpen] = React.useState(false);

  const selectedPreset = presets.find((p) => p.id === selectedPresetId);
  const builtInPresets = presets.filter((p) => p.isBuiltIn);
  const customPresets = presets.filter((p) => !p.isBuiltIn);

  const handleSelectPreset = (preset: StylePreset) => {
    onSelectPreset(preset.id);
    onApplyPreset(preset);
    setOpen(false);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <Palette className="h-4 w-4 text-muted-foreground" />
        <Label className="text-sm font-medium">Style Preset</Label>
      </div>

      <div className="flex items-center gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="flex-1 justify-start"
            >
              {selectedPreset ? (
                <div className="flex items-center gap-2">
                  <StylePreview preset={selectedPreset} size="sm" />
                  <span className="truncate">{selectedPreset.name}</span>
                </div>
              ) : (
                <span className="text-muted-foreground">Select style...</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="start">
            <ScrollArea className="h-80">
              <div className="p-2">
                {/* Built-in presets */}
                <div className="pb-2">
                  <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    Built-in Styles
                  </p>
                  <div className="grid gap-1">
                    {builtInPresets.map((preset) => (
                      <StylePresetItem
                        key={preset.id}
                        preset={preset}
                        isSelected={preset.id === selectedPresetId}
                        onSelect={() => handleSelectPreset(preset)}
                      />
                    ))}
                  </div>
                </div>

                {/* Custom presets */}
                {customPresets.length > 0 && (
                  <>
                    <Separator className="my-2" />
                    <div className="pb-2">
                      <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                        Custom Styles
                      </p>
                      <div className="grid gap-1">
                        {customPresets.map((preset) => (
                          <StylePresetItem
                            key={preset.id}
                            preset={preset}
                            isSelected={preset.id === selectedPresetId}
                            onSelect={() => handleSelectPreset(preset)}
                            onEdit={
                              onEditPreset
                                ? () => {
                                    onEditPreset(preset);
                                    setOpen(false);
                                  }
                                : undefined
                            }
                            onDelete={
                              onDeletePreset
                                ? () => {
                                    onDeletePreset(preset.id);
                                  }
                                : undefined
                            }
                          />
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Create button */}
                {onCreatePreset && (
                  <>
                    <Separator className="my-2" />
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        onCreatePreset();
                        setOpen(false);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Custom Style
                    </Button>
                  </>
                )}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>

        {/* Clear selection */}
        {selectedPresetId && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => onSelectPreset(null)}
                className="h-9 w-9"
              >
                <span className="sr-only">Clear selection</span>
                <span className="text-xs">×</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Clear style preset</TooltipContent>
          </Tooltip>
        )}
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
        "rounded-md border flex items-center justify-center",
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

interface StylePresetItemProps {
  preset: StylePreset;
  isSelected: boolean;
  onSelect: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

function StylePresetItem({
  preset,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}: StylePresetItemProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-accent group",
        isSelected && "bg-accent"
      )}
      onClick={onSelect}
    >
      <StylePreview preset={preset} />
      <span className="flex-1 truncate text-sm">{preset.name}</span>
      {isSelected && <Check className="h-4 w-4 text-primary" />}

      {/* Action buttons for custom presets */}
      {!preset.isBuiltIn && (onEdit || onDelete) && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <Edit2 className="h-3 w-3" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
