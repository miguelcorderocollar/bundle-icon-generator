/**
 * Style preset editor modal for creating and editing style presets
 */

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { BackgroundControls } from "./BackgroundControls";
import { ColorPicker } from "./ColorPicker";
import type { StylePreset, ColorPaletteEntry } from "@/src/types/preset";
import type { BackgroundValue } from "@/src/utils/gradients";
import { KALE_COLORS } from "@/src/utils/gradients";
import { generateColorPaletteEntryId } from "@/src/utils/preset-storage";

/** Maximum number of colors in a palette */
const MAX_PALETTE_COLORS = 8;

/** Default color names for new palette entries */
const DEFAULT_COLOR_NAMES = [
  "Primary",
  "Secondary",
  "Tertiary",
  "Accent",
  "Highlight",
  "Muted",
  "Surface",
  "Border",
];

export interface StylePresetEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preset?: StylePreset;
  onSave: (preset: Omit<StylePreset, "id" | "isBuiltIn" | "createdAt">) => void;
  mode?: "create" | "edit";
}

const DEFAULT_BACKGROUND = KALE_COLORS["900"];
const DEFAULT_ICON_COLOR = "#ffffff";

export function StylePresetEditor({
  open,
  onOpenChange,
  preset,
  onSave,
  mode = "create",
}: StylePresetEditorProps) {
  const [name, setName] = React.useState(preset?.name || "");
  const [backgroundColor, setBackgroundColor] = React.useState<BackgroundValue>(
    preset?.backgroundColor || DEFAULT_BACKGROUND
  );
  const [iconColor, setIconColor] = React.useState(
    preset?.iconColor || DEFAULT_ICON_COLOR
  );
  const [colorPalette, setColorPalette] = React.useState<ColorPaletteEntry[]>(
    preset?.colorPalette || []
  );

  // Reset form when preset changes
  React.useEffect(() => {
    if (preset) {
      setName(preset.name);
      setBackgroundColor(preset.backgroundColor);
      setIconColor(preset.iconColor);
      setColorPalette(preset.colorPalette || []);
    } else {
      setName("");
      setBackgroundColor(DEFAULT_BACKGROUND);
      setIconColor(DEFAULT_ICON_COLOR);
      setColorPalette([]);
    }
  }, [preset, open]);

  const handleSave = () => {
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      backgroundColor,
      iconColor,
      colorPalette: colorPalette.length > 0 ? colorPalette : undefined,
    });

    onOpenChange(false);
  };

  const handleAddColor = () => {
    if (colorPalette.length >= MAX_PALETTE_COLORS) return;

    const defaultName =
      DEFAULT_COLOR_NAMES[colorPalette.length] ||
      `Color ${colorPalette.length + 1}`;
    const newEntry: ColorPaletteEntry = {
      id: generateColorPaletteEntryId(),
      name: defaultName,
      color: iconColor, // Use current icon color as default
    };
    setColorPalette([...colorPalette, newEntry]);
  };

  const handleRemoveColor = (id: string) => {
    setColorPalette(colorPalette.filter((entry) => entry.id !== id));
  };

  const handleUpdateColorName = (id: string, newName: string) => {
    setColorPalette(
      colorPalette.map((entry) =>
        entry.id === id ? { ...entry, name: newName } : entry
      )
    );
  };

  const handleUpdateColorValue = (id: string, newColor: string) => {
    setColorPalette(
      colorPalette.map((entry) =>
        entry.id === id ? { ...entry, color: newColor } : entry
      )
    );
  };

  const isValid = name.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>
            {mode === "create" ? "Create Style Preset" : "Edit Style Preset"}
          </DialogTitle>
          <DialogDescription>
            Define a reusable color scheme for your icons.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto -mx-6 px-6">
          <div className="space-y-6 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="style-name">Preset Name</Label>
              <Input
                id="style-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Custom Style"
              />
            </div>

            <Separator />

            {/* Preview */}
            <div className="space-y-2">
              <Label>Preview</Label>
              <StylePreview
                backgroundColor={backgroundColor}
                iconColor={iconColor}
              />
            </div>

            <Separator />

            {/* Background */}
            <BackgroundControls
              value={backgroundColor}
              onChange={setBackgroundColor}
            />

            <Separator />

            {/* Icon Color */}
            <ColorPicker
              id="icon-color"
              label="Icon Color"
              value={iconColor}
              onChange={setIconColor}
              colorType="icon"
            />

            <Separator />

            {/* Color Palette */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Color Palette</Label>
                <span className="text-xs text-muted-foreground">
                  {colorPalette.length}/{MAX_PALETTE_COLORS}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Add brand colors for quick access when customizing icons.
              </p>

              {colorPalette.length > 0 && (
                <div className="space-y-2">
                  {colorPalette.map((entry, index) => (
                    <div key={entry.id} className="flex items-center gap-2">
                      <input
                        type="color"
                        value={entry.color}
                        onChange={(e) =>
                          handleUpdateColorValue(entry.id, e.target.value)
                        }
                        className="h-8 w-10 cursor-pointer rounded-md border flex-shrink-0"
                        aria-label={`Color for ${entry.name}`}
                      />
                      <Input
                        value={entry.name}
                        onChange={(e) =>
                          handleUpdateColorName(entry.id, e.target.value)
                        }
                        placeholder={DEFAULT_COLOR_NAMES[index] || "Color name"}
                        className="flex-1"
                      />
                      <Input
                        value={entry.color}
                        onChange={(e) =>
                          handleUpdateColorValue(entry.id, e.target.value)
                        }
                        placeholder="#ffffff"
                        className="w-24 font-mono text-xs"
                        maxLength={7}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive flex-shrink-0"
                        onClick={() => handleRemoveColor(entry.id)}
                        aria-label={`Remove ${entry.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleAddColor}
                disabled={colorPalette.length >= MAX_PALETTE_COLORS}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Color
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isValid}>
            {mode === "create" ? "Create Style" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface StylePreviewProps {
  backgroundColor: BackgroundValue;
  iconColor: string;
}

function StylePreview({ backgroundColor, iconColor }: StylePreviewProps) {
  const getBackgroundStyle = (): React.CSSProperties => {
    if (typeof backgroundColor === "string") {
      return { backgroundColor };
    }

    // Gradient
    if (backgroundColor.type === "linear") {
      const stops = backgroundColor.stops
        .map((s) => `${s.color} ${s.offset}%`)
        .join(", ");
      return {
        background: `linear-gradient(${backgroundColor.angle}deg, ${stops})`,
      };
    } else {
      const stops = backgroundColor.stops
        .map((s) => `${s.color} ${s.offset}%`)
        .join(", ");
      return {
        background: `radial-gradient(circle ${backgroundColor.radius}% at ${backgroundColor.centerX}% ${backgroundColor.centerY}%, ${stops})`,
      };
    }
  };

  return (
    <div
      className="h-24 rounded-lg border flex items-center justify-center"
      style={getBackgroundStyle()}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-12 w-12"
        fill={iconColor}
        stroke="none"
      >
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    </div>
  );
}
