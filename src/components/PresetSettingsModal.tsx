/**
 * Preset settings modal for managing export and style presets
 */

"use client";

import * as React from "react";
import { Settings, Trash2, Edit2, Package, Palette } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { PresetImportExport } from "./PresetImportExport";
import { ExportPresetEditor } from "./ExportPresetEditor";
import { StylePresetEditor } from "./StylePresetEditor";
import type {
  ExportPreset,
  StylePreset,
  PresetImportResult,
} from "@/src/types/preset";
import type { BackgroundValue } from "@/src/utils/gradients";
import { gradientToCss, isGradient } from "@/src/utils/gradients";

export interface PresetSettingsModalProps {
  exportPresets: ExportPreset[];
  stylePresets: StylePreset[];
  onCreateExportPreset: (
    preset: Omit<ExportPreset, "id" | "isBuiltIn" | "createdAt">
  ) => ExportPreset;
  onUpdateExportPreset: (
    id: string,
    updates: Partial<Omit<ExportPreset, "id" | "isBuiltIn">>
  ) => void;
  onDeleteExportPreset: (id: string) => boolean;
  onCreateStylePreset: (
    preset: Omit<StylePreset, "id" | "isBuiltIn" | "createdAt">
  ) => StylePreset;
  onUpdateStylePreset: (
    id: string,
    updates: Partial<Omit<StylePreset, "id" | "isBuiltIn">>
  ) => void;
  onDeleteStylePreset: (id: string) => boolean;
  onExportPresets: () => void;
  onImportPresets: (file: File) => Promise<PresetImportResult>;
  onClearPresets: () => void;
  hasCustomPresets: boolean;
  trigger?: React.ReactNode;
}

export function PresetSettingsModal({
  exportPresets,
  stylePresets,
  onCreateExportPreset,
  onUpdateExportPreset,
  onDeleteExportPreset,
  onCreateStylePreset,
  onUpdateStylePreset,
  onDeleteStylePreset,
  onExportPresets,
  onImportPresets,
  onClearPresets,
  hasCustomPresets,
  trigger,
}: PresetSettingsModalProps) {
  const [open, setOpen] = React.useState(false);
  const [showExportEditor, setShowExportEditor] = React.useState(false);
  const [editingExportPreset, setEditingExportPreset] = React.useState<
    ExportPreset | undefined
  >();
  const [showStyleEditor, setShowStyleEditor] = React.useState(false);
  const [editingStylePreset, setEditingStylePreset] = React.useState<
    StylePreset | undefined
  >();

  const customExportPresets = exportPresets.filter((p) => !p.isBuiltIn);
  const customStylePresets = stylePresets.filter((p) => !p.isBuiltIn);

  const handleEditExportPreset = (preset: ExportPreset) => {
    setEditingExportPreset(preset);
    setShowExportEditor(true);
  };

  const handleCreateExportPreset = () => {
    setEditingExportPreset(undefined);
    setShowExportEditor(true);
  };

  const handleSaveExportPreset = (
    preset: Omit<ExportPreset, "id" | "isBuiltIn" | "createdAt">
  ) => {
    if (editingExportPreset) {
      onUpdateExportPreset(editingExportPreset.id, preset);
    } else {
      onCreateExportPreset(preset);
    }
  };

  const handleEditStylePreset = (preset: StylePreset) => {
    setEditingStylePreset(preset);
    setShowStyleEditor(true);
  };

  const handleCreateStylePreset = () => {
    setEditingStylePreset(undefined);
    setShowStyleEditor(true);
  };

  const handleSaveStylePreset = (
    preset: Omit<StylePreset, "id" | "isBuiltIn" | "createdAt">
  ) => {
    if (editingStylePreset) {
      onUpdateStylePreset(editingStylePreset.id, preset);
    } else {
      onCreateStylePreset(preset);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Manage Presets
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Preset Settings</DialogTitle>
            <DialogDescription>
              Manage your custom export and style presets
            </DialogDescription>
          </DialogHeader>

          <Tabs
            defaultValue="export"
            className="flex-1 min-h-0 overflow-hidden flex flex-col"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="export" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Export
              </TabsTrigger>
              <TabsTrigger value="style" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Style
              </TabsTrigger>
              <TabsTrigger value="data" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Data
              </TabsTrigger>
            </TabsList>

            <TabsContent value="export" className="flex-1 overflow-hidden mt-4">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-muted-foreground">
                    {customExportPresets.length} custom preset
                    {customExportPresets.length !== 1 ? "s" : ""}
                  </p>
                  <Button size="sm" onClick={handleCreateExportPreset}>
                    Create New
                  </Button>
                </div>

                <ScrollArea className="flex-1">
                  {customExportPresets.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No custom export presets yet</p>
                      <p className="text-xs mt-1">
                        Create one to define your own export formats
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {customExportPresets.map((preset) => (
                        <ExportPresetCard
                          key={preset.id}
                          preset={preset}
                          onEdit={() => handleEditExportPreset(preset)}
                          onDelete={() => onDeleteExportPreset(preset.id)}
                        />
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="style" className="flex-1 overflow-hidden mt-4">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-muted-foreground">
                    {customStylePresets.length} custom preset
                    {customStylePresets.length !== 1 ? "s" : ""}
                  </p>
                  <Button size="sm" onClick={handleCreateStylePreset}>
                    Create New
                  </Button>
                </div>

                <ScrollArea className="flex-1">
                  {customStylePresets.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Palette className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No custom style presets yet</p>
                      <p className="text-xs mt-1">
                        Create one to save your color schemes
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {customStylePresets.map((preset) => (
                        <StylePresetCard
                          key={preset.id}
                          preset={preset}
                          onEdit={() => handleEditStylePreset(preset)}
                          onDelete={() => onDeleteStylePreset(preset.id)}
                        />
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="data" className="flex-1 overflow-auto mt-4">
              <PresetImportExport
                hasCustomPresets={hasCustomPresets}
                onExport={onExportPresets}
                onImport={onImportPresets}
                onClearAll={onClearPresets}
              />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Export Preset Editor */}
      <ExportPresetEditor
        open={showExportEditor}
        onOpenChange={setShowExportEditor}
        preset={editingExportPreset}
        onSave={handleSaveExportPreset}
        mode={editingExportPreset ? "edit" : "create"}
      />

      {/* Style Preset Editor */}
      <StylePresetEditor
        open={showStyleEditor}
        onOpenChange={setShowStyleEditor}
        preset={editingStylePreset}
        onSave={handleSaveStylePreset}
        mode={editingStylePreset ? "edit" : "create"}
      />
    </>
  );
}

interface ExportPresetCardProps {
  preset: ExportPreset;
  onEdit: () => void;
  onDelete: () => void;
}

function ExportPresetCard({ preset, onEdit, onDelete }: ExportPresetCardProps) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{preset.name}</span>
          <Badge variant="secondary" className="text-xs">
            {preset.variants.length} file
            {preset.variants.length !== 1 ? "s" : ""}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground truncate mt-1">
          {preset.description || "No description"}
        </p>
      </div>
      <div className="flex items-center gap-1 ml-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onEdit}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

interface StylePresetCardProps {
  preset: StylePreset;
  onEdit: () => void;
  onDelete: () => void;
}

function StylePresetCard({ preset, onEdit, onDelete }: StylePresetCardProps) {
  const getBackgroundStyle = (bg: BackgroundValue): React.CSSProperties => {
    if (isGradient(bg)) {
      return { background: gradientToCss(bg) };
    }
    return { backgroundColor: bg };
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className="h-10 w-10 rounded-md border flex items-center justify-center shrink-0"
          style={getBackgroundStyle(preset.backgroundColor)}
        >
          <div
            className="h-4 w-4 rounded-sm"
            style={{ backgroundColor: preset.iconColor }}
          />
        </div>
        <span className="font-medium truncate">{preset.name}</span>
      </div>
      <div className="flex items-center gap-1 ml-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onEdit}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
