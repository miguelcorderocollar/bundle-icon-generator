"use client";

/**
 * CanvasControlsPane - Source selector + Background controls for canvas mode
 */

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Library,
  Layers,
  Smile,
  Upload,
  Image as ImageIcon,
  PenTool,
} from "lucide-react";
import { BackgroundControls } from "./BackgroundControls";
import { ICON_PACKS, type IconPack } from "@/src/constants/app";
import type { BackgroundValue } from "@/src/utils/gradients";

interface CanvasControlsPaneProps {
  selectedPack: IconPack;
  onPackChange: (pack: IconPack) => void;
  backgroundColor: BackgroundValue;
  onBackgroundColorChange: (color: BackgroundValue) => void;
}

export function CanvasControlsPane({
  selectedPack,
  onPackChange,
  backgroundColor,
  onBackgroundColorChange,
}: CanvasControlsPaneProps) {
  const handlePackChange = (value: string) => {
    onPackChange(value as IconPack);
  };

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Controls</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 overflow-y-auto">
        {/* Source Selector */}
        <div className="space-y-2">
          <Label htmlFor="source-select">Source</Label>
          <Select value={selectedPack} onValueChange={handlePackChange}>
            <SelectTrigger id="source-select" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ICON_PACKS.ALL}>
                <span className="flex items-center gap-2">
                  <Layers className="size-4" />
                  All Icons
                </span>
              </SelectItem>
              <SelectItem value={ICON_PACKS.GARDEN}>
                <span className="flex items-center gap-2">
                  <Library className="size-4" />
                  Garden
                </span>
              </SelectItem>
              <SelectItem value={ICON_PACKS.FEATHER}>
                <span className="flex items-center gap-2">
                  <Library className="size-4" />
                  Feather
                </span>
              </SelectItem>
              <SelectItem value={ICON_PACKS.REMIXICON}>
                <span className="flex items-center gap-2">
                  <Library className="size-4" />
                  RemixIcon
                </span>
              </SelectItem>
              <SelectItem value={ICON_PACKS.EMOJI}>
                <span className="flex items-center gap-2">
                  <Smile className="size-4" />
                  Emoji
                </span>
              </SelectItem>
              <SelectItem value={ICON_PACKS.CUSTOM_SVG}>
                <span className="flex items-center gap-2">
                  <Upload className="size-4" />
                  Custom SVG
                </span>
              </SelectItem>
              <SelectItem value={ICON_PACKS.CUSTOM_IMAGE}>
                <span className="flex items-center gap-2">
                  <ImageIcon className="size-4" />
                  Custom Image
                </span>
              </SelectItem>
              <SelectItem value={ICON_PACKS.CANVAS}>
                <span className="flex items-center gap-2">
                  <PenTool className="size-4" />
                  Canvas Editor
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Select a different source to exit canvas mode.
          </p>
        </div>

        <Separator />

        {/* Background Controls */}
        <BackgroundControls
          value={backgroundColor}
          onChange={onBackgroundColorChange}
        />
      </CardContent>
    </Card>
  );
}
