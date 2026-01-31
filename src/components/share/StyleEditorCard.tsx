"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2 } from "lucide-react";
import type {
  RestrictedStyle,
  RestrictedColorPaletteEntry,
} from "@/src/types/restriction";
import { BackgroundControls } from "@/src/components/BackgroundControls";
import { DebouncedColorInput } from "@/src/components/DebouncedColorInput";
import type { BackgroundValue } from "@/src/utils/gradients";

export interface StyleEditorCardProps {
  /** The style being edited (null if none selected) */
  editingStyle: RestrictedStyle | null;
  /** Index of the editing style (null if none) */
  editingStyleIndex: number | null;
  /** Update style callback */
  onUpdateStyle: (index: number, updates: Partial<RestrictedStyle>) => void;
  /** Add palette color callback */
  onAddPaletteColor: () => void;
  /** Remove palette color callback */
  onRemovePaletteColor: (colorIndex: number) => void;
  /** Update palette color callback */
  onUpdatePaletteColor: (
    colorIndex: number,
    updates: Partial<RestrictedColorPaletteEntry>
  ) => void;
}

/**
 * Card component for editing a single style preset
 */
export function StyleEditorCard({
  editingStyle,
  editingStyleIndex,
  onUpdateStyle,
  onAddPaletteColor,
  onRemovePaletteColor,
  onUpdatePaletteColor,
}: StyleEditorCardProps) {
  // Handle background change
  const handleBackgroundChange = (value: BackgroundValue) => {
    if (editingStyleIndex !== null) {
      onUpdateStyle(editingStyleIndex, { backgroundColor: value });
    }
  };

  // Handle icon color change
  const handleIconColorChange = (value: string) => {
    if (editingStyleIndex !== null) {
      onUpdateStyle(editingStyleIndex, { iconColor: value });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {editingStyle ? `Edit: ${editingStyle.name}` : "Select a Style"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {editingStyle ? (
          <>
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="style-name">Name</Label>
              <Input
                id="style-name"
                value={editingStyle.name}
                onChange={(e) =>
                  onUpdateStyle(editingStyleIndex!, {
                    name: e.target.value,
                  })
                }
                placeholder="Style name"
              />
            </div>

            {/* Icon Color */}
            <div className="space-y-2">
              <Label htmlFor="icon-color">Icon Color</Label>
              <div className="flex gap-2">
                <DebouncedColorInput
                  id="icon-color"
                  value={editingStyle.iconColor}
                  onChange={handleIconColorChange}
                  colorInputClassName="h-10 w-20 cursor-pointer rounded-md border"
                  textInputClassName="flex-1 font-mono"
                />
              </div>
            </div>

            <Separator />

            {/* Background */}
            <BackgroundControls
              value={editingStyle.backgroundColor}
              onChange={handleBackgroundChange}
            />

            <Separator />

            {/* Color Palette (Accent Colors for Canvas) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Accent Colors (for Canvas)</Label>
                <Button size="sm" variant="outline" onClick={onAddPaletteColor}>
                  <Plus className="mr-1 h-3 w-3" />
                  Add
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Additional colors users can choose from when editing layers in
                canvas mode.
              </p>
              {editingStyle.colorPalette &&
              editingStyle.colorPalette.length > 0 ? (
                <div className="space-y-2">
                  {editingStyle.colorPalette.map((color, colorIndex) => (
                    <div key={colorIndex} className="flex items-center gap-2">
                      <DebouncedColorInput
                        value={color.color}
                        onChange={(value) =>
                          onUpdatePaletteColor(colorIndex, { color: value })
                        }
                        colorInputClassName="h-8 w-12 cursor-pointer rounded border flex-shrink-0"
                        textInputClassName="w-24 font-mono text-xs"
                      />
                      <Input
                        value={color.name}
                        onChange={(e) =>
                          onUpdatePaletteColor(colorIndex, {
                            name: e.target.value,
                          })
                        }
                        placeholder="Color name"
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemovePaletteColor(colorIndex)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  No accent colors added. Users will only have the main icon
                  color.
                </p>
              )}
            </div>
          </>
        ) : (
          <p className="text-muted-foreground text-center py-8">
            Click a style to edit it
          </p>
        )}
      </CardContent>
    </Card>
  );
}
