"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Plus,
  Trash2,
  Copy,
  Check,
  ArrowLeft,
  Link2,
  Download,
  Upload,
  Edit2,
  ExternalLink,
  Star,
} from "lucide-react";
import { ICON_PACKS, type IconPack } from "@/src/constants/app";
import type {
  RestrictionConfig,
  RestrictedStyle,
  RestrictedColorPaletteEntry,
  RestrictedExportPreset,
} from "@/src/types/restriction";
import {
  createDefaultRestrictionConfig,
  isRestrictionConfig,
} from "@/src/types/restriction";
import { saveAdminConfig, loadAdminConfig } from "@/src/utils/local-storage";
import { BUILTIN_EXPORT_PRESETS } from "@/src/utils/builtin-presets";
import {
  encodeRestrictionConfig,
  decodeRestrictionConfig,
  RESTRICTION_URL_PARAM,
} from "@/src/utils/restriction-codec";
import {
  isGradient,
  gradientToCss,
  isSolidColor,
  type BackgroundValue,
} from "@/src/utils/gradients";
import { BackgroundControls } from "@/src/components/BackgroundControls";
import { ExportPresetEditor } from "@/src/components/ExportPresetEditor";
import type { ExportPreset } from "@/src/types/preset";
import Link from "next/link";

/**
 * Icon pack display configuration
 */
const ICON_PACK_OPTIONS: { value: IconPack; label: string }[] = [
  { value: ICON_PACKS.ALL, label: "All Icons" },
  { value: ICON_PACKS.GARDEN, label: "Garden" },
  { value: ICON_PACKS.FEATHER, label: "Feather" },
  { value: ICON_PACKS.REMIXICON, label: "RemixIcon" },
  { value: ICON_PACKS.EMOJI, label: "Emoji" },
  { value: ICON_PACKS.CUSTOM_SVG, label: "Custom SVG" },
  { value: ICON_PACKS.CUSTOM_IMAGE, label: "Custom Image" },
  { value: ICON_PACKS.CANVAS, label: "Canvas Editor" },
];

/**
 * Get CSS string for a background value
 */
function getBackgroundCss(value: BackgroundValue): string {
  if (isSolidColor(value)) {
    return value;
  }
  if (isGradient(value)) {
    return gradientToCss(value);
  }
  return "#063940";
}

/**
 * Admin page for generating restricted mode links
 */
export default function AdminPage() {
  const [config, setConfig] = React.useState<RestrictionConfig>(
    createDefaultRestrictionConfig()
  );
  const [generatedUrl, setGeneratedUrl] = React.useState<string>("");
  const [copied, setCopied] = React.useState(false);
  const [editingStyleIndex, setEditingStyleIndex] = React.useState<
    number | null
  >(null);
  const [isInitialized, setIsInitialized] = React.useState(false);

  // Export preset editor state
  const [showExportPresetEditor, setShowExportPresetEditor] =
    React.useState(false);
  const [editingExportPreset, setEditingExportPreset] = React.useState<
    RestrictedExportPreset | undefined
  >();
  const [editingExportPresetIndex, setEditingExportPresetIndex] =
    React.useState<number | null>(null);

  // Load config from localStorage on mount
  React.useEffect(() => {
    const stored = loadAdminConfig();
    if (stored && isRestrictionConfig(stored)) {
      setConfig(stored);
    }
    setIsInitialized(true);
  }, []);

  // Save config to localStorage whenever it changes (after initial load)
  React.useEffect(() => {
    if (isInitialized) {
      saveAdminConfig(config);
    }
  }, [config, isInitialized]);

  // Generate URL whenever config changes
  React.useEffect(() => {
    try {
      const encoded = encodeRestrictionConfig(config);
      const baseUrl =
        typeof window !== "undefined"
          ? window.location.origin
          : "http://localhost:3000";
      const url = new URL(baseUrl);
      url.searchParams.set(RESTRICTION_URL_PARAM, encoded);
      setGeneratedUrl(url.toString());
    } catch (error) {
      console.error("Failed to generate URL:", error);
      setGeneratedUrl("");
    }
  }, [config]);

  // Add a new style
  const handleAddStyle = () => {
    const newStyle: RestrictedStyle = {
      name: `Style ${config.styles.length + 1}`,
      backgroundColor: "#063940",
      iconColor: "#ffffff",
    };
    setConfig({
      ...config,
      styles: [...config.styles, newStyle],
    });
    setEditingStyleIndex(config.styles.length);
  };

  // Remove a style
  const handleRemoveStyle = (index: number) => {
    if (config.styles.length <= 1) {
      return; // Must have at least one style
    }
    const newStyles = config.styles.filter((_, i) => i !== index);
    setConfig({ ...config, styles: newStyles });
    if (editingStyleIndex === index) {
      setEditingStyleIndex(null);
    } else if (editingStyleIndex !== null && editingStyleIndex > index) {
      setEditingStyleIndex(editingStyleIndex - 1);
    }
  };

  // Update a style
  const handleUpdateStyle = (
    index: number,
    updates: Partial<RestrictedStyle>
  ) => {
    const newStyles = [...config.styles];
    newStyles[index] = { ...newStyles[index], ...updates };
    setConfig({ ...config, styles: newStyles });
  };

  // Toggle icon pack
  const handleToggleIconPack = (pack: IconPack) => {
    const currentPacks = config.allowedIconPacks || [];
    let newPacks: IconPack[];

    if (currentPacks.includes(pack)) {
      newPacks = currentPacks.filter((p) => p !== pack);
    } else {
      newPacks = [...currentPacks, pack];
    }

    // If empty, set to undefined (all allowed)
    setConfig({
      ...config,
      allowedIconPacks: newPacks.length > 0 ? newPacks : undefined,
    });
  };

  // Toggle all icon packs
  const handleToggleAllPacks = () => {
    const allPacks = ICON_PACK_OPTIONS.map((o) => o.value);
    const currentPacks = config.allowedIconPacks || [];

    if (currentPacks.length === allPacks.length) {
      // All selected - deselect all (undefined means all allowed)
      setConfig({ ...config, allowedIconPacks: undefined });
    } else {
      // Select all
      setConfig({ ...config, allowedIconPacks: allPacks });
    }
  };

  // Set the default icon pack
  const handleSetDefaultIconPack = (pack: IconPack) => {
    // Toggle: if already default, clear it
    if (config.defaultIconPack === pack) {
      setConfig({ ...config, defaultIconPack: undefined });
    } else {
      // Set as default (also ensure it's in allowed packs if we have restrictions)
      const currentPacks = config.allowedIconPacks || [];
      if (currentPacks.length > 0 && !currentPacks.includes(pack)) {
        // Add it to allowed packs
        setConfig({
          ...config,
          allowedIconPacks: [...currentPacks, pack],
          defaultIconPack: pack,
        });
      } else {
        setConfig({ ...config, defaultIconPack: pack });
      }
    }
  };

  // Copy URL to clipboard
  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy URL:", error);
    }
  };

  // Set editing style's background
  const handleBackgroundChange = (value: BackgroundValue) => {
    if (editingStyleIndex !== null) {
      handleUpdateStyle(editingStyleIndex, { backgroundColor: value });
    }
  };

  // Set editing style's icon color
  const handleIconColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editingStyleIndex !== null) {
      handleUpdateStyle(editingStyleIndex, { iconColor: e.target.value });
    }
  };

  // Add a color to the palette
  const handleAddPaletteColor = () => {
    if (editingStyleIndex === null) return;
    const style = config.styles[editingStyleIndex];
    const currentPalette = style.colorPalette || [];
    const newColor: RestrictedColorPaletteEntry = {
      name: `Color ${currentPalette.length + 1}`,
      color: "#808080",
    };
    handleUpdateStyle(editingStyleIndex, {
      colorPalette: [...currentPalette, newColor],
    });
  };

  // Remove a color from the palette
  const handleRemovePaletteColor = (colorIndex: number) => {
    if (editingStyleIndex === null) return;
    const style = config.styles[editingStyleIndex];
    const currentPalette = style.colorPalette || [];
    handleUpdateStyle(editingStyleIndex, {
      colorPalette: currentPalette.filter((_, i) => i !== colorIndex),
    });
  };

  // Update a color in the palette
  const handleUpdatePaletteColor = (
    colorIndex: number,
    updates: Partial<RestrictedColorPaletteEntry>
  ) => {
    if (editingStyleIndex === null) return;
    const style = config.styles[editingStyleIndex];
    const currentPalette = style.colorPalette || [];
    const newPalette = [...currentPalette];
    newPalette[colorIndex] = { ...newPalette[colorIndex], ...updates };
    handleUpdateStyle(editingStyleIndex, { colorPalette: newPalette });
  };

  const editingStyle =
    editingStyleIndex !== null ? config.styles[editingStyleIndex] : null;

  // Toggle export preset
  const handleToggleExportPreset = (presetId: string) => {
    const currentPresets = config.allowedExportPresets || [];
    const existingIndex = currentPresets.findIndex((p) => p.id === presetId);

    if (existingIndex >= 0) {
      // Remove it
      const newPresets = currentPresets.filter((_, i) => i !== existingIndex);
      setConfig({
        ...config,
        allowedExportPresets: newPresets.length > 0 ? newPresets : undefined,
      });
    } else {
      // Add it - find the built-in preset to get name/description
      const builtIn = BUILTIN_EXPORT_PRESETS.find((p) => p.id === presetId);
      if (builtIn) {
        const newPreset: RestrictedExportPreset = {
          id: builtIn.id,
          name: builtIn.name,
          description: builtIn.description,
          // No variants means it references the built-in
        };
        setConfig({
          ...config,
          allowedExportPresets: [...currentPresets, newPreset],
        });
      }
    }
  };

  // Toggle all export presets
  const handleToggleAllExportPresets = () => {
    const currentPresets = config.allowedExportPresets || [];
    if (currentPresets.length === BUILTIN_EXPORT_PRESETS.length) {
      // All selected - deselect all
      setConfig({ ...config, allowedExportPresets: undefined });
    } else {
      // Select all built-in presets
      const allPresets: RestrictedExportPreset[] = BUILTIN_EXPORT_PRESETS.map(
        (p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
        })
      );
      setConfig({ ...config, allowedExportPresets: allPresets });
    }
  };

  // Create a new custom export preset
  const handleCreateCustomExportPreset = () => {
    setEditingExportPreset(undefined);
    setEditingExportPresetIndex(null);
    setShowExportPresetEditor(true);
  };

  // Edit an existing custom export preset
  const handleEditCustomExportPreset = (
    preset: RestrictedExportPreset,
    index: number
  ) => {
    setEditingExportPreset(preset);
    setEditingExportPresetIndex(index);
    setShowExportPresetEditor(true);
  };

  // Save custom export preset (create or update)
  const handleSaveCustomExportPreset = (
    preset: Omit<ExportPreset, "id" | "isBuiltIn" | "createdAt">
  ) => {
    const currentPresets = config.allowedExportPresets || [];

    if (editingExportPresetIndex !== null) {
      // Update existing preset
      const updatedPresets = [...currentPresets];
      updatedPresets[editingExportPresetIndex] = {
        id: editingExportPreset?.id || `custom-${Date.now()}`,
        name: preset.name,
        description: preset.description,
        variants: preset.variants,
      };
      setConfig({ ...config, allowedExportPresets: updatedPresets });
    } else {
      // Create new preset
      const newPreset: RestrictedExportPreset = {
        id: `custom-${Date.now()}`,
        name: preset.name,
        description: preset.description,
        variants: preset.variants,
      };
      setConfig({
        ...config,
        allowedExportPresets: [...currentPresets, newPreset],
      });
    }

    setShowExportPresetEditor(false);
    setEditingExportPreset(undefined);
    setEditingExportPresetIndex(null);
  };

  // Delete a custom export preset
  const handleDeleteCustomExportPreset = (index: number) => {
    const currentPresets = config.allowedExportPresets || [];
    const updatedPresets = currentPresets.filter((_, i) => i !== index);
    setConfig({
      ...config,
      allowedExportPresets:
        updatedPresets.length > 0 ? updatedPresets : undefined,
    });
  };

  // Get custom presets (those with variants defined)
  const customExportPresets = React.useMemo(() => {
    if (!config.allowedExportPresets) return [];
    return config.allowedExportPresets
      .map((p, index) => ({ preset: p, index }))
      .filter(({ preset }) => preset.variants && preset.variants.length > 0);
  }, [config.allowedExportPresets]);

  // Export config to JSON file
  const handleExportConfig = () => {
    try {
      const jsonString = JSON.stringify(config, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `restriction-config-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export config:", error);
    }
  };

  // Import config from JSON file
  const handleImportConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);

        if (!isRestrictionConfig(parsed)) {
          alert(
            "Invalid restriction config file. Please ensure it has the correct format."
          );
          return;
        }

        setConfig(parsed);
        setEditingStyleIndex(null);
      } catch (error) {
        console.error("Failed to import config:", error);
        alert("Failed to parse the config file. Please check the file format.");
      }
    };
    reader.readAsText(file);

    // Reset the input so the same file can be selected again
    event.target.value = "";
  };

  // Reference for file input
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Import from URL state
  const [showUrlImport, setShowUrlImport] = React.useState(false);
  const [urlImportValue, setUrlImportValue] = React.useState("");
  const [urlImportError, setUrlImportError] = React.useState<string | null>(
    null
  );

  // Import config from URL
  const handleImportFromUrl = () => {
    setUrlImportError(null);

    if (!urlImportValue.trim()) {
      setUrlImportError("Please enter a URL");
      return;
    }

    try {
      const url = new URL(urlImportValue.trim());
      const encoded = url.searchParams.get(RESTRICTION_URL_PARAM);

      if (!encoded) {
        setUrlImportError(
          "No restriction config found in URL. Make sure the URL contains the 'restrict' parameter."
        );
        return;
      }

      const decoded = decodeRestrictionConfig(encoded);

      if (!decoded) {
        setUrlImportError(
          "Invalid restriction config in URL. The config may be corrupted or malformed."
        );
        return;
      }

      setConfig(decoded);
      setEditingStyleIndex(null);
      setShowUrlImport(false);
      setUrlImportValue("");
    } catch {
      setUrlImportError(
        "Invalid URL format. Please enter a valid URL with a restriction config."
      );
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-semibold">Restriction Mode Admin</h1>
              <p className="text-sm text-muted-foreground">
                Generate restricted links for internal use
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportConfig}
              className="hidden"
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowUrlImport(true);
                      setUrlImportError(null);
                      setUrlImportValue("");
                    }}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    From URL
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Import config from an existing restriction URL
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Import
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Import a previously exported JSON config
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportConfig}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Export current config to JSON file
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Style Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Style Presets</span>
                <Button size="sm" variant="outline" onClick={handleAddStyle}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Style
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {config.styles.map((style, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                    editingStyleIndex === index
                      ? "border-primary bg-accent"
                      : "hover:bg-accent/50"
                  }`}
                  onClick={() => setEditingStyleIndex(index)}
                >
                  {/* Preview */}
                  <div
                    className="h-12 w-12 rounded-md flex items-center justify-center shrink-0"
                    style={{
                      background: getBackgroundCss(style.backgroundColor),
                    }}
                  >
                    <div
                      className="h-6 w-6 rounded-full"
                      style={{ backgroundColor: style.iconColor }}
                    />
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{style.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {isSolidColor(style.backgroundColor)
                        ? style.backgroundColor
                        : isGradient(style.backgroundColor)
                          ? `${style.backgroundColor.type} gradient`
                          : "Custom"}
                    </p>
                  </div>

                  {/* Delete */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveStyle(index);
                          }}
                          disabled={config.styles.length <= 1}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {config.styles.length <= 1
                          ? "At least one style required"
                          : "Remove style"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Style Editor */}
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
                        handleUpdateStyle(editingStyleIndex!, {
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
                      <input
                        id="icon-color"
                        type="color"
                        value={editingStyle.iconColor}
                        onChange={handleIconColorChange}
                        className="h-10 w-20 cursor-pointer rounded-md border"
                      />
                      <Input
                        value={editingStyle.iconColor}
                        onChange={handleIconColorChange}
                        className="flex-1 font-mono"
                        placeholder="#ffffff"
                        maxLength={7}
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
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleAddPaletteColor}
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        Add
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Additional colors users can choose from when editing
                      layers in canvas mode.
                    </p>
                    {editingStyle.colorPalette &&
                    editingStyle.colorPalette.length > 0 ? (
                      <div className="space-y-2">
                        {editingStyle.colorPalette.map((color, colorIndex) => (
                          <div
                            key={colorIndex}
                            className="flex items-center gap-2"
                          >
                            <input
                              type="color"
                              value={color.color}
                              onChange={(e) =>
                                handleUpdatePaletteColor(colorIndex, {
                                  color: e.target.value,
                                })
                              }
                              className="h-8 w-12 cursor-pointer rounded border"
                            />
                            <Input
                              value={color.name}
                              onChange={(e) =>
                                handleUpdatePaletteColor(colorIndex, {
                                  name: e.target.value,
                                })
                              }
                              placeholder="Color name"
                              className="flex-1"
                            />
                            <Input
                              value={color.color}
                              onChange={(e) =>
                                handleUpdatePaletteColor(colorIndex, {
                                  color: e.target.value,
                                })
                              }
                              placeholder="#808080"
                              className="w-24 font-mono text-xs"
                              maxLength={7}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                handleRemovePaletteColor(colorIndex)
                              }
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        No accent colors added. Users will only have the main
                        icon color.
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
        </div>

        {/* Icon Pack Restrictions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Allowed Icon Packs</span>
              <Button
                size="sm"
                variant="outline"
                onClick={handleToggleAllPacks}
              >
                {(config.allowedIconPacks?.length ?? 0) ===
                ICON_PACK_OPTIONS.length
                  ? "Deselect All"
                  : "Select All"}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {ICON_PACK_OPTIONS.map((option) => {
                const isChecked =
                  !config.allowedIconPacks ||
                  config.allowedIconPacks.includes(option.value);
                const isDefault = config.defaultIconPack === option.value;

                return (
                  <div
                    key={option.value}
                    className="flex items-center gap-2 rounded-md border p-3 hover:bg-accent"
                  >
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => handleToggleIconPack(option.value)}
                      id={`pack-${option.value}`}
                    />
                    <label
                      htmlFor={`pack-${option.value}`}
                      className="flex-1 cursor-pointer text-sm"
                    >
                      {option.label}
                    </label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={() => handleSetDefaultIconPack(option.value)}
                          >
                            <Star
                              className={`h-3.5 w-3.5 ${
                                isDefault
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-muted-foreground"
                              }`}
                            />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {isDefault
                            ? "Default pack (click to unset)"
                            : "Set as default pack"}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {!config.allowedIconPacks
                ? "All icon packs are allowed"
                : `${config.allowedIconPacks.length} pack(s) allowed`}
              {config.defaultIconPack && (
                <>
                  {" · "}
                  Default:{" "}
                  {ICON_PACK_OPTIONS.find((o) => o.value === config.defaultIconPack)
                    ?.label || config.defaultIconPack}
                </>
              )}
            </p>
          </CardContent>
        </Card>

        {/* Export Preset Restrictions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Allowed Export Presets</span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleToggleAllExportPresets}
                >
                  {(config.allowedExportPresets?.length ?? 0) ===
                  BUILTIN_EXPORT_PRESETS.length
                    ? "Deselect All"
                    : "Select All"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCreateCustomExportPreset}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Custom
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Built-in Presets */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Built-in Presets
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {BUILTIN_EXPORT_PRESETS.map((preset) => {
                  const isChecked =
                    !config.allowedExportPresets ||
                    config.allowedExportPresets.some((p) => p.id === preset.id);

                  return (
                    <label
                      key={preset.id}
                      className="flex items-start gap-3 cursor-pointer rounded-md border p-3 hover:bg-accent"
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() =>
                          handleToggleExportPreset(preset.id)
                        }
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{preset.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {preset.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {preset.variants.length} variant(s)
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Custom Presets */}
            {customExportPresets.length > 0 && (
              <div>
                <Separator className="my-4" />
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Custom Presets
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {customExportPresets.map(({ preset, index }) => (
                    <div
                      key={preset.id}
                      className="flex items-start gap-3 rounded-md border p-3 hover:bg-accent"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{preset.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {preset.description || "Custom preset"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {preset.variants?.length || 0} variant(s)
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() =>
                                  handleEditCustomExportPreset(preset, index)
                                }
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit preset</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() =>
                                  handleDeleteCustomExportPreset(index)
                                }
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete preset</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              {!config.allowedExportPresets
                ? "All export presets are allowed"
                : `${config.allowedExportPresets.length} preset(s) allowed`}
            </p>
          </CardContent>
        </Card>

        {/* Export Preset Editor Modal */}
        <ExportPresetEditor
          open={showExportPresetEditor}
          onOpenChange={setShowExportPresetEditor}
          preset={
            editingExportPreset
              ? {
                  id: editingExportPreset.id,
                  name: editingExportPreset.name,
                  description: editingExportPreset.description || "",
                  variants: editingExportPreset.variants || [],
                  isBuiltIn: false,
                }
              : undefined
          }
          onSave={handleSaveCustomExportPreset}
          mode={editingExportPreset ? "edit" : "create"}
        />

        {/* Generated URL */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Generated Restriction URL
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={generatedUrl}
                readOnly
                className="font-mono text-xs"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopyUrl}
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {copied ? "Copied!" : "Copy URL"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-xs text-muted-foreground">
              Share this URL with users to give them a restricted experience.
              They will only see the style presets and icon packs you&apos;ve
              configured above.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" asChild className="w-full">
                <a
                  href={generatedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open in New Tab
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Import from URL Dialog */}
        <Dialog open={showUrlImport} onOpenChange={setShowUrlImport}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Import from URL</DialogTitle>
              <DialogDescription>
                Paste an existing restriction URL to import its configuration.
                This will replace your current settings.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="url-import">Restriction URL</Label>
                <Input
                  id="url-import"
                  value={urlImportValue}
                  onChange={(e) => {
                    setUrlImportValue(e.target.value);
                    setUrlImportError(null);
                  }}
                  placeholder="https://example.com/?restrict=..."
                  className="font-mono text-xs"
                />
              </div>
              {urlImportError && (
                <Alert variant="destructive">
                  <AlertDescription>{urlImportError}</AlertDescription>
                </Alert>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowUrlImport(false);
                  setUrlImportValue("");
                  setUrlImportError(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleImportFromUrl}>Import</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
