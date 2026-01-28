/**
 * Export preset editor modal for creating and editing export presets
 */

import * as React from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import type {
  ExportPreset,
  ExportVariantConfig,
  ExportFormat,
} from "@/src/types/preset";
import {
  EXPORT_FORMATS,
  formatSupportsQuality,
  getFormatExtension,
} from "@/src/types/preset";

export interface ExportPresetEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preset?: ExportPreset;
  onSave: (
    preset: Omit<ExportPreset, "id" | "isBuiltIn" | "createdAt">
  ) => void;
  mode?: "create" | "edit";
}

const DEFAULT_VARIANT: ExportVariantConfig = {
  filename: "icon.png",
  width: 512,
  height: 512,
  format: "png",
};

export function ExportPresetEditor({
  open,
  onOpenChange,
  preset,
  onSave,
  mode = "create",
}: ExportPresetEditorProps) {
  const [name, setName] = React.useState(preset?.name || "");
  const [description, setDescription] = React.useState(
    preset?.description || ""
  );
  const [variants, setVariants] = React.useState<ExportVariantConfig[]>(
    preset?.variants || [{ ...DEFAULT_VARIANT }]
  );

  // Reset form when preset changes
  React.useEffect(() => {
    if (preset) {
      setName(preset.name);
      setDescription(preset.description);
      setVariants(preset.variants);
    } else {
      setName("");
      setDescription("");
      setVariants([{ ...DEFAULT_VARIANT }]);
    }
  }, [preset, open]);

  const handleAddVariant = () => {
    setVariants([...variants, { ...DEFAULT_VARIANT }]);
  };

  const handleRemoveVariant = (index: number) => {
    if (variants.length > 1) {
      setVariants(variants.filter((_, i) => i !== index));
    }
  };

  const handleVariantChange = (
    index: number,
    updates: Partial<ExportVariantConfig>
  ) => {
    setVariants(
      variants.map((v, i) => {
        if (i !== index) return v;
        const updated = { ...v, ...updates };

        // Auto-update filename extension when format changes
        if (updates.format && v.format !== updates.format) {
          const oldExt = getFormatExtension(v.format);
          const newExt = getFormatExtension(updates.format);
          updated.filename = v.filename.replace(
            new RegExp(`\\.${oldExt}$`),
            `.${newExt}`
          );

          // Remove quality if format doesn't support it
          if (!formatSupportsQuality(updates.format)) {
            delete updated.quality;
          } else if (!updated.quality) {
            updated.quality = 92;
          }
        }

        return updated;
      })
    );
  };

  const handleSave = () => {
    if (!name.trim()) return;
    if (variants.length === 0) return;

    onSave({
      name: name.trim(),
      description: description.trim(),
      variants,
    });

    onOpenChange(false);
  };

  const isValid = name.trim() && variants.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>
            {mode === "create" ? "Create Export Preset" : "Edit Export Preset"}
          </DialogTitle>
          <DialogDescription>
            Define the output files for your icon export.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto -mx-6 px-6">
          <div className="space-y-4 py-4">
            {/* Name and Description */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="preset-name">Preset Name</Label>
                <Input
                  id="preset-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Custom Preset"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="preset-description">Description</Label>
                <Input
                  id="preset-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description of when to use this preset"
                />
              </div>
            </div>

            <Separator />

            {/* Variants */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Export Variants</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddVariant}
                  className="h-8"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Variant
                </Button>
              </div>

              <div className="space-y-4">
                {variants.map((variant, index) => (
                  <VariantEditor
                    key={index}
                    variant={variant}
                    onChange={(updates) => handleVariantChange(index, updates)}
                    onRemove={() => handleRemoveVariant(index)}
                    canRemove={variants.length > 1}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isValid}>
            {mode === "create" ? "Create Preset" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface VariantEditorProps {
  variant: ExportVariantConfig;
  onChange: (updates: Partial<ExportVariantConfig>) => void;
  onRemove: () => void;
  canRemove: boolean;
}

function VariantEditor({
  variant,
  onChange,
  onRemove,
  canRemove,
}: VariantEditorProps) {
  return (
    <div className="p-4 rounded-lg border bg-muted/30 space-y-4">
      <div className="flex items-start gap-2">
        <GripVertical className="h-4 w-4 mt-2 text-muted-foreground/50" />

        <div className="flex-1 grid grid-cols-2 gap-4">
          {/* Filename */}
          <div className="col-span-2 space-y-1">
            <Label className="text-xs text-muted-foreground">Filename</Label>
            <Input
              value={variant.filename}
              onChange={(e) => onChange({ filename: e.target.value })}
              placeholder="icon.png"
              className="h-8"
            />
          </div>

          {/* Format */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Format</Label>
            <Select
              value={variant.format}
              onValueChange={(value: ExportFormat) =>
                onChange({ format: value })
              }
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPORT_FORMATS.map((format) => (
                  <SelectItem key={format} value={format}>
                    {format.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Size */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Size (px)</Label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={variant.width}
                onChange={(e) =>
                  onChange({
                    width: parseInt(e.target.value) || 0,
                    height: parseInt(e.target.value) || 0,
                  })
                }
                className="h-8 w-20"
                min={1}
                max={4096}
              />
              <span className="text-xs text-muted-foreground">×</span>
              <Input
                type="number"
                value={variant.height}
                onChange={(e) =>
                  onChange({ height: parseInt(e.target.value) || 0 })
                }
                className="h-8 w-20"
                min={1}
                max={4096}
              />
            </div>
          </div>

          {/* Quality (only for JPEG/WebP) */}
          {formatSupportsQuality(variant.format) && (
            <div className="col-span-2 space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Quality</Label>
                <span className="text-xs text-muted-foreground">
                  {variant.quality || 92}%
                </span>
              </div>
              <Slider
                value={[variant.quality || 92]}
                onValueChange={([value]) => onChange({ quality: value })}
                min={1}
                max={100}
                step={1}
                className="mt-2"
              />
            </div>
          )}
        </div>

        {/* Remove button */}
        {canRemove && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
