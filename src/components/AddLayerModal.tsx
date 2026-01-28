"use client";

/**
 * AddLayerModal component for adding new layers to the canvas
 * Provides tabs for icons, images, and text with pack selection
 */

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  Upload,
  Type,
  Palette,
  X,
  Library,
  Layers,
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { IconGrid } from "./IconGrid";
import { useIconSearch } from "@/src/hooks/use-icon-search";
import { ICON_PACKS, type IconPack } from "@/src/constants/app";
import { AVAILABLE_FONTS, DEFAULT_FONT_FAMILY } from "@/src/types/canvas";
import type { CanvasEditorActions } from "@/src/hooks/use-canvas-editor";
import { cn } from "@/lib/utils";

interface AddLayerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actions: CanvasEditorActions;
  iconColor?: string;
}

type TabValue = "icons" | "images" | "text";

// Icon packs available for canvas (excluding custom types and canvas itself)
const CANVAS_ICON_PACKS: { value: IconPack; label: string }[] = [
  { value: ICON_PACKS.ALL, label: "All Icons" },
  { value: ICON_PACKS.GARDEN, label: "Garden" },
  { value: ICON_PACKS.FEATHER, label: "Feather" },
  { value: ICON_PACKS.REMIXICON, label: "RemixIcon" },
];

export function AddLayerModal({
  open,
  onOpenChange,
  actions,
  iconColor = "#ffffff",
}: AddLayerModalProps) {
  const [activeTab, setActiveTab] = React.useState<TabValue>("icons");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedPack, setSelectedPack] = React.useState<IconPack>(
    ICON_PACKS.ALL
  );
  const [textContent, setTextContent] = React.useState("");
  const [fontFamily, setFontFamily] = React.useState(DEFAULT_FONT_FAMILY);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Icon search
  const { icons, isLoading } = useIconSearch({
    searchQuery,
    selectedPack,
    selectedCategory: null,
    sortBy: "name",
  });

  // Filter out non-SVG icons
  const filteredIcons = React.useMemo(
    () => icons.filter((icon) => icon.svg && !icon.isCustomImage),
    [icons]
  );

  // Image dropzone
  const onDrop = React.useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (dataUrl) {
          actions.addImageLayer(dataUrl, file.name);
          onOpenChange(false);
        }
      };
      reader.readAsDataURL(file);
    },
    [actions, onOpenChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"],
    },
    multiple: false,
  });

  const handleIconSelect = (iconId: string) => {
    actions.addIconLayer(iconId, iconColor);
    onOpenChange(false);
  };

  const handleAddText = () => {
    if (!textContent.trim()) return;
    actions.addTextLayer(textContent.trim(), { fontFamily, color: iconColor });
    setTextContent("");
    onOpenChange(false);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    searchInputRef.current?.focus();
  };

  // Reset state when modal opens
  React.useEffect(() => {
    if (open) {
      setSearchQuery("");
      setTextContent("");
      setFontFamily(DEFAULT_FONT_FAMILY);
      setSelectedPack(ICON_PACKS.ALL);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Add Layer</DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as TabValue)}
          className="flex-1 flex flex-col min-h-0 overflow-hidden"
        >
          <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
            <TabsTrigger value="icons" className="gap-2">
              <Palette className="size-4" />
              Icons
            </TabsTrigger>
            <TabsTrigger value="images" className="gap-2">
              <Upload className="size-4" />
              Images
            </TabsTrigger>
            <TabsTrigger value="text" className="gap-2">
              <Type className="size-4" />
              Text
            </TabsTrigger>
          </TabsList>

          {/* Icons Tab */}
          <TabsContent
            value="icons"
            className="flex-1 flex flex-col min-h-0 mt-4 data-[state=inactive]:hidden"
          >
            {/* Pack Selector */}
            <div className="flex gap-2 mb-3 flex-shrink-0">
              <Select
                value={selectedPack}
                onValueChange={(v) => setSelectedPack(v as IconPack)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CANVAS_ICON_PACKS.map((pack) => (
                    <SelectItem key={pack.value} value={pack.value}>
                      <span className="flex items-center gap-2">
                        {pack.value === ICON_PACKS.ALL ? (
                          <Layers className="size-4" />
                        ) : (
                          <Library className="size-4" />
                        )}
                        {pack.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  ref={searchInputRef}
                  placeholder="Search icons..."
                  className="pl-9 pr-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Icon Grid with ScrollArea */}
            <ScrollArea className="flex-1 min-h-0">
              <div className="pr-4">
                <IconGrid
                  icons={filteredIcons}
                  onIconSelect={handleIconSelect}
                  searchQuery={searchQuery}
                  isLoading={isLoading}
                />
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Images Tab */}
          <TabsContent
            value="images"
            className="flex-1 mt-4 data-[state=inactive]:hidden"
          >
            <div
              {...getRootProps()}
              className={cn(
                "flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50"
              )}
            >
              <input {...getInputProps()} />
              <Upload className="size-12 text-muted-foreground mb-4" />
              {isDragActive ? (
                <p className="text-sm text-muted-foreground">
                  Drop the image here...
                </p>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-1">
                    Drag and drop an image here, or click to select
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supports PNG, JPG, GIF, WebP, SVG
                  </p>
                </>
              )}
            </div>
          </TabsContent>

          {/* Text Tab */}
          <TabsContent
            value="text"
            className="flex-1 mt-4 space-y-4 data-[state=inactive]:hidden"
          >
            <div className="space-y-2">
              <Label htmlFor="text-content">Text</Label>
              <Input
                id="text-content"
                placeholder="Enter text..."
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddText();
                  }
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="font-family">Font Family</Label>
              <Select value={fontFamily} onValueChange={setFontFamily}>
                <SelectTrigger id="font-family">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_FONTS.map((font) => (
                    <SelectItem
                      key={font.value}
                      value={font.value}
                      style={{ fontFamily: font.value }}
                    >
                      {font.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Text Preview */}
            {textContent && (
              <div className="p-4 border rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                <p className="text-2xl" style={{ fontFamily }}>
                  {textContent}
                </p>
              </div>
            )}

            <Button
              onClick={handleAddText}
              disabled={!textContent.trim()}
              className="w-full"
            >
              Add Text Layer
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
