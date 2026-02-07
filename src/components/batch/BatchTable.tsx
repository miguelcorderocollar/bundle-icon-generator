"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, Download } from "lucide-react";
import type {
  BatchIconConfig,
  UploadedAsset,
  BatchValidationResult,
} from "@/src/types/batch";
import type { StylePreset, ExportPreset } from "@/src/types/preset";
import { BatchRow } from "./BatchRow";

export interface BatchTableProps {
  /** Current batch configurations */
  configs: BatchIconConfig[];
  /** Currently selected global format preset ID */
  globalFormatPresetId: string;
  /** All available style presets */
  stylePresets: StylePreset[];
  /** All available export presets */
  exportPresets: ExportPreset[];
  /** Uploaded assets */
  uploadedAssets: UploadedAsset[];
  /** Validation result (for showing errors) */
  validationResult?: BatchValidationResult;
  /** Called when a config is updated */
  onUpdateConfig: (id: string, updates: Partial<BatchIconConfig>) => void;
  /** Called when a config is deleted */
  onDeleteConfig: (id: string) => void;
  /** Called when a new row should be added */
  onAddRow: () => void;
  /** Called when all rows should be cleared */
  onClearAll: () => void;
  /** Called when global format preset changes */
  onGlobalFormatPresetChange: (presetId: string) => void;
  /** Called when icon selector should open for a row */
  onSelectIcon: (configId: string) => void;
  /** Called when export is triggered */
  onExport: () => void;
  /** Whether export is in progress */
  isExporting?: boolean;
  className?: string;
}

export function BatchTable({
  configs,
  globalFormatPresetId,
  stylePresets,
  exportPresets,
  uploadedAssets,
  validationResult,
  onUpdateConfig,
  onDeleteConfig,
  onAddRow,
  onClearAll,
  onGlobalFormatPresetChange,
  onSelectIcon,
  onExport,
  isExporting,
  className,
}: BatchTableProps) {
  // Separate built-in and custom export presets
  const builtInExportPresets = exportPresets.filter((p) => p.isBuiltIn);
  const customExportPresets = exportPresets.filter((p) => !p.isBuiltIn);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-base">Step 3: Review & Edit</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Global Format:
            </span>
            <Select
              value={globalFormatPresetId}
              onValueChange={onGlobalFormatPresetChange}
            >
              <SelectTrigger size="sm" className="w-36 h-8">
                <SelectValue placeholder="Format preset" />
              </SelectTrigger>
              <SelectContent>
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
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Table header */}
        {configs.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1 text-xs text-muted-foreground font-medium border-b">
            <div className="w-6">#</div>
            <div className="w-10">Icon</div>
            <div className="w-32">Project</div>
            <div className="w-16 text-center">Source</div>
            <div className="w-24">Icon Name</div>
            <div className="w-28">Style</div>
            <div className="w-28">Format</div>
            <div className="w-14 text-center">Size</div>
            <div className="w-8"></div>
          </div>
        )}

        {/* Rows */}
        {configs.length > 0 ? (
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-2 pr-4">
              {configs.map((config, index) => (
                <BatchRow
                  key={config.id}
                  index={index}
                  config={config}
                  stylePresets={stylePresets}
                  exportPresets={exportPresets}
                  uploadedAssets={uploadedAssets}
                  errors={validationResult?.errors.get(config.id)}
                  onUpdate={(updates) => onUpdateConfig(config.id, updates)}
                  onDelete={() => onDeleteConfig(config.id)}
                  onSelectIcon={() => onSelectIcon(config.id)}
                />
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              No projects configured yet
            </p>
            <p className="text-xs text-muted-foreground">
              Upload a CSV or add rows manually below
            </p>
          </div>
        )}

        {/* Add row button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAddRow}
          className="w-full gap-2"
        >
          <Plus className="size-4" />
          Add Row
        </Button>

        {/* Actions */}
        {configs.length > 0 && (
          <div className="flex items-center justify-between pt-2 border-t">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              className="gap-2 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-4" />
              Clear All
            </Button>

            <Button
              type="button"
              onClick={onExport}
              disabled={isExporting || configs.length === 0}
              className="gap-2"
            >
              <Download className="size-4" />
              {isExporting
                ? "Exporting..."
                : `Export All (${configs.length} project${configs.length !== 1 ? "s" : ""})`}
            </Button>
          </div>
        )}

        {/* Global errors */}
        {validationResult &&
          !validationResult.valid &&
          validationResult.globalErrors.length > 0 && (
            <div className="text-sm text-destructive">
              {validationResult.globalErrors.map((err, i) => (
                <p key={i}>{err}</p>
              ))}
            </div>
          )}
      </CardContent>
    </Card>
  );
}
