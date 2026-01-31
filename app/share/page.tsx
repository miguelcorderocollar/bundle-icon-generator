"use client";

import * as React from "react";
import { useShareConfig } from "@/src/hooks/use-share-config";
import { useStyleEditor } from "@/src/hooks/use-style-editor";
import { useExportPresetManager } from "@/src/hooks/use-export-preset-manager";
import { useConfigImportExport } from "@/src/hooks/use-config-import-export";
import { useIconPackSelector } from "@/src/hooks/use-icon-pack-selector";
import {
  SharePageHeader,
  ShareModeTabs,
  StyleListCard,
  StyleEditorCard,
  IconPackSelectorCard,
  ExportPresetSelectorCard,
  GeneratedUrlCard,
  UrlImportDialog,
} from "@/src/components/share";
import { ExportPresetEditor } from "@/src/components/ExportPresetEditor";

/**
 * Share page for generating restricted mode links and import links
 */
export default function SharePage() {
  // Core config state
  const shareConfig = useShareConfig();

  // Style editing
  const styleEditor = useStyleEditor(shareConfig.config, shareConfig.setConfig);

  // Export preset management
  const presetManager = useExportPresetManager(
    shareConfig.config,
    shareConfig.setConfig
  );

  // Config import/export
  const importExport = useConfigImportExport(
    shareConfig.config,
    shareConfig.setConfig,
    () => styleEditor.setEditingIndex(null) // Reset editing on import
  );

  // Icon pack selection
  const iconPackSelector = useIconPackSelector(
    shareConfig.config,
    shareConfig.setConfig
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header with import/export buttons */}
        <SharePageHeader importExport={importExport} />

        {/* Mode selection tabs */}
        <ShareModeTabs
          mode={shareConfig.shareMode}
          onModeChange={shareConfig.setShareMode}
        />

        {/* Style presets section */}
        <div className="grid gap-6 md:grid-cols-2">
          <StyleListCard
            styles={shareConfig.config.styles}
            editingStyleIndex={styleEditor.editingStyleIndex}
            shareMode={shareConfig.shareMode}
            onAddStyle={styleEditor.addStyle}
            onRemoveStyle={styleEditor.removeStyle}
            onSelectStyle={styleEditor.setEditingIndex}
          />
          <StyleEditorCard
            editingStyle={styleEditor.editingStyle}
            editingStyleIndex={styleEditor.editingStyleIndex}
            onUpdateStyle={styleEditor.updateStyle}
            onAddPaletteColor={styleEditor.addPaletteColor}
            onRemovePaletteColor={styleEditor.removePaletteColor}
            onUpdatePaletteColor={styleEditor.updatePaletteColor}
          />
        </div>

        {/* Icon pack restrictions - Only in restricted mode */}
        {shareConfig.shareMode === "restricted" && (
          <IconPackSelectorCard
            config={shareConfig.config}
            iconPackSelector={iconPackSelector}
          />
        )}

        {/* Export preset selection */}
        <ExportPresetSelectorCard
          config={shareConfig.config}
          shareMode={shareConfig.shareMode}
          presetManager={presetManager}
        />

        {/* Export Preset Editor Modal */}
        <ExportPresetEditor
          open={presetManager.showEditor}
          onOpenChange={presetManager.setShowEditor}
          preset={
            presetManager.editingPreset
              ? {
                  id: presetManager.editingPreset.id,
                  name: presetManager.editingPreset.name,
                  description: presetManager.editingPreset.description || "",
                  variants: presetManager.editingPreset.variants || [],
                  isBuiltIn: false,
                }
              : undefined
          }
          onSave={presetManager.saveCustomPreset}
          mode={presetManager.editingPreset ? "edit" : "create"}
        />

        {/* Generated URL display */}
        <GeneratedUrlCard
          url={shareConfig.generatedUrl}
          shareMode={shareConfig.shareMode}
        />

        {/* URL import dialog */}
        <UrlImportDialog importExport={importExport} />
      </div>
    </div>
  );
}
