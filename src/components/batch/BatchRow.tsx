"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Trash2, Image, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BatchIconConfig, UploadedAsset } from "@/src/types/batch";
import type { StylePreset, ExportPreset } from "@/src/types/preset";

export interface BatchRowProps {
  /** Row index (0-based) */
  index: number;
  /** The batch configuration for this row */
  config: BatchIconConfig;
  /** All available style presets */
  stylePresets: StylePreset[];
  /** All available export presets */
  exportPresets: ExportPreset[];
  /** Uploaded assets for reference */
  uploadedAssets: UploadedAsset[];
  /** Validation errors for this row */
  errors?: string[];
  /** Called when config is updated */
  onUpdate: (updates: Partial<BatchIconConfig>) => void;
  /** Called when row should be deleted */
  onDelete: () => void;
  /** Called when icon selector should open */
  onSelectIcon: () => void;
  className?: string;
}

/**
 * Get a display name for the source
 */
function getSourceLabel(source: string): string {
  switch (source) {
    case "zendesk-garden":
      return "Garden";
    case "feather":
      return "Feather";
    case "remixicon":
      return "Remix";
    case "emoji":
      return "Emoji";
    case "upload":
      return "Upload";
    default:
      return source;
  }
}

/**
 * Get badge variant for source type
 */
function getSourceVariant(
  source: string
): "default" | "secondary" | "outline" | "destructive" {
  switch (source) {
    case "upload":
      return "outline";
    default:
      return "secondary";
  }
}

export function BatchRow({
  index,
  config,
  stylePresets,
  exportPresets,
  uploadedAssets,
  errors,
  onUpdate,
  onDelete,
  onSelectIcon,
  className,
}: BatchRowProps) {
  const hasErrors = errors && errors.length > 0;

  // Find the uploaded asset if source is upload
  const uploadedAsset = React.useMemo(() => {
    if (config.source !== "upload") return null;
    return uploadedAssets.find(
      (a) => a.name === config.iconName || a.filename === config.iconName
    );
  }, [config.source, config.iconName, uploadedAssets]);

  // Separate built-in and custom presets
  const builtInStylePresets = stylePresets.filter((p) => p.isBuiltIn);
  const customStylePresets = stylePresets.filter((p) => !p.isBuiltIn);
  const builtInExportPresets = exportPresets.filter((p) => p.isBuiltIn);
  const customExportPresets = exportPresets.filter((p) => !p.isBuiltIn);

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-md border",
        hasErrors && "border-destructive bg-destructive/5",
        !hasErrors && "border-border hover:bg-muted/50",
        className
      )}
    >
      {/* Row number */}
      <div className="w-6 text-xs text-muted-foreground font-mono">
        {index + 1}
      </div>

      {/* Icon preview / selector button */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onSelectIcon}
              className={cn(
                "size-10 rounded-md border flex items-center justify-center overflow-hidden",
                "hover:border-primary transition-colors",
                !config.iconName && "border-dashed"
              )}
            >
              {uploadedAsset?.dataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={uploadedAsset.dataUrl}
                  alt={config.iconName}
                  className="size-8 object-contain"
                />
              ) : config.iconName ? (
                <div className="size-8 flex items-center justify-center bg-muted rounded">
                  <Image className="size-4 text-muted-foreground" />
                </div>
              ) : (
                <Image className="size-4 text-muted-foreground" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Click to select icon</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Project name */}
      <Input
        type="text"
        value={config.projectName}
        onChange={(e) => onUpdate({ projectName: e.target.value })}
        placeholder="project-name"
        className="w-32 h-8 text-sm"
      />

      {/* Source badge */}
      <Badge
        variant={getSourceVariant(config.source)}
        className="w-16 justify-center text-xs"
      >
        {getSourceLabel(config.source)}
      </Badge>

      {/* Icon name (read-only) */}
      <div className="w-24 truncate text-sm text-muted-foreground">
        {config.iconName || (
          <span className="italic text-muted-foreground/50">none</span>
        )}
      </div>

      {/* Style preset selector */}
      <Select
        value={config.stylePresetId}
        onValueChange={(value) => onUpdate({ stylePresetId: value })}
      >
        <SelectTrigger size="sm" className="w-28 h-8">
          <SelectValue placeholder="Style" />
        </SelectTrigger>
        <SelectContent>
          {builtInStylePresets.length > 0 && (
            <SelectGroup>
              <SelectLabel>Built-in</SelectLabel>
              {builtInStylePresets.map((preset) => (
                <SelectItem key={preset.id} value={preset.id}>
                  {preset.name}
                </SelectItem>
              ))}
            </SelectGroup>
          )}
          {customStylePresets.length > 0 && (
            <SelectGroup>
              <SelectLabel>Custom</SelectLabel>
              {customStylePresets.map((preset) => (
                <SelectItem key={preset.id} value={preset.id}>
                  {preset.name}
                </SelectItem>
              ))}
            </SelectGroup>
          )}
        </SelectContent>
      </Select>

      {/* Format preset selector (optional) */}
      <Select
        value={config.formatPresetId || "__global__"}
        onValueChange={(value) =>
          onUpdate({
            formatPresetId: value === "__global__" ? undefined : value,
          })
        }
      >
        <SelectTrigger size="sm" className="w-28 h-8">
          <SelectValue placeholder="Format" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__global__">
            <span className="text-muted-foreground">Global Default</span>
          </SelectItem>
          {builtInExportPresets.length > 0 && (
            <SelectGroup>
              <SelectLabel>Built-in</SelectLabel>
              {builtInExportPresets.map((preset) => (
                <SelectItem key={preset.id} value={preset.id}>
                  {preset.name}
                </SelectItem>
              ))}
            </SelectGroup>
          )}
          {customExportPresets.length > 0 && (
            <SelectGroup>
              <SelectLabel>Custom</SelectLabel>
              {customExportPresets.map((preset) => (
                <SelectItem key={preset.id} value={preset.id}>
                  {preset.name}
                </SelectItem>
              ))}
            </SelectGroup>
          )}
        </SelectContent>
      </Select>

      {/* Icon size */}
      <Input
        type="number"
        min={1}
        max={100}
        value={config.iconSize}
        onChange={(e) =>
          onUpdate({
            iconSize: Math.max(
              1,
              Math.min(100, parseInt(e.target.value) || 80)
            ),
          })
        }
        className="w-14 h-8 text-sm text-center"
      />

      {/* Error indicator */}
      {hasErrors && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-destructive">
                <AlertCircle className="size-4" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <ul className="text-xs space-y-0.5">
                {errors?.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Delete button */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onDelete}
        className="size-8 text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}
