"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Home, Share2 } from "lucide-react";
import { useTheme } from "@/src/components/ThemeProvider";
import { useBatchGenerator } from "@/src/hooks/use-batch-generator";
import { usePresets } from "@/src/hooks/use-presets";
import {
  BatchUploadZone,
  CsvImportCard,
  BatchTable,
  BatchIconSelector,
  BatchExportModal,
} from "@/src/components/batch";
import type {
  BatchIconConfig,
  BatchIconSource,
  BatchExportProgress,
  BatchValidationResult,
} from "@/src/types/batch";
import {
  generateBatchExportZip,
  validateBatchConfigs,
  downloadBatchZip,
} from "@/src/utils/batch-export-controller";

export default function BatchPage() {
  const { theme, mounted, toggleTheme } = useTheme();
  const { state, actions, hasInitialized } = useBatchGenerator();
  const { stylePresets, exportPresets } = usePresets();

  // Icon selector state
  const [iconSelectorOpen, setIconSelectorOpen] = React.useState(false);
  const [editingConfigId, setEditingConfigId] = React.useState<string | null>(
    null
  );

  // Export modal state
  const [exportModalOpen, setExportModalOpen] = React.useState(false);
  const [exportProgress, setExportProgress] =
    React.useState<BatchExportProgress | null>(null);
  const [validationResult, setValidationResult] =
    React.useState<BatchValidationResult | null>(null);
  const [exportWarnings, setExportWarnings] = React.useState<string[]>([]);
  const [exportBlob, setExportBlob] = React.useState<Blob | null>(null);
  const [isExporting, setIsExporting] = React.useState(false);

  // Handle opening icon selector for a specific config
  const handleSelectIcon = (configId: string) => {
    setEditingConfigId(configId);
    setIconSelectorOpen(true);
  };

  // Handle icon selection
  const handleIconSelected = (
    source: BatchIconSource,
    iconName: string,
    iconId: string
  ) => {
    if (editingConfigId) {
      actions.updateConfig(editingConfigId, {
        source,
        iconName,
        iconId,
      });
    }
    setIconSelectorOpen(false);
    setEditingConfigId(null);
  };

  // Handle CSV import
  const handleCsvImport = (configs: BatchIconConfig[]) => {
    actions.importConfigs(configs);
  };

  // Handle adding a new row
  const handleAddRow = () => {
    actions.addConfig();
  };

  // Start export process
  const handleStartExport = () => {
    // Validate first
    const result = validateBatchConfigs(state.configs, state.uploadedAssets);
    setValidationResult(result);
    setExportModalOpen(true);
    setExportProgress(null);
    setExportWarnings([]);
    setExportBlob(null);
  };

  // Execute export
  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress({
      phase: "validating",
      currentIndex: 0,
      totalItems: state.configs.length,
    });

    try {
      const result = await generateBatchExportZip(state.configs, {
        globalFormatPresetId: state.globalFormatPresetId,
        uploadedAssets: state.uploadedAssets,
        onProgress: setExportProgress,
      });

      setExportBlob(result.zipBlob);
      setExportWarnings(result.warnings);
      setExportProgress({
        phase: "complete",
        currentIndex: result.projectCount,
        totalItems: result.projectCount,
      });

      // Auto-download
      downloadBatchZip(result.zipBlob);
    } catch (error) {
      console.error("Batch export failed:", error);
      setExportProgress({
        phase: "error",
        currentIndex: 0,
        totalItems: state.configs.length,
        error: error instanceof Error ? error.message : "Export failed",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Handle manual download
  const handleDownload = () => {
    if (exportBlob) {
      downloadBatchZip(exportBlob);
    }
  };

  // Get the config being edited for icon selector
  const editingConfig = editingConfigId
    ? state.configs.find((c) => c.id === editingConfigId)
    : null;

  if (!hasInitialized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">Batch Generator</h1>
              <p className="text-sm text-muted-foreground">
                Generate multiple app icon bundles at once
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Navigation */}
              <Button variant="ghost" size="sm" asChild>
                <Link href="/">
                  <Home className="size-4 mr-1" />
                  Single
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/share">
                  <Share2 className="size-4 mr-1" />
                  Share
                </Link>
              </Button>

              {/* Theme toggle */}
              {mounted && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  aria-label="Toggle theme"
                >
                  {theme === "dark" ? (
                    <Sun className="size-4" />
                  ) : (
                    <Moon className="size-4" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Step 1: Upload Assets */}
          <BatchUploadZone
            uploadedAssets={state.uploadedAssets}
            onUpload={actions.addUploadedAsset}
            onRemove={actions.removeUploadedAsset}
            onClearAll={actions.clearUploadedAssets}
          />

          {/* Step 2: Configure Projects */}
          <CsvImportCard
            uploadedAssets={state.uploadedAssets}
            onImport={handleCsvImport}
          />

          {/* Step 3: Review & Edit */}
          <BatchTable
            configs={state.configs}
            globalFormatPresetId={state.globalFormatPresetId}
            stylePresets={stylePresets}
            exportPresets={exportPresets}
            uploadedAssets={state.uploadedAssets}
            validationResult={validationResult || undefined}
            onUpdateConfig={actions.updateConfig}
            onDeleteConfig={actions.removeConfig}
            onAddRow={handleAddRow}
            onClearAll={actions.clearConfigs}
            onGlobalFormatPresetChange={actions.setGlobalFormatPresetId}
            onSelectIcon={handleSelectIcon}
            onExport={handleStartExport}
            isExporting={isExporting}
          />
        </div>
      </main>

      {/* Icon selector dialog */}
      <BatchIconSelector
        open={iconSelectorOpen}
        onOpenChange={setIconSelectorOpen}
        currentSource={editingConfig?.source}
        uploadedAssets={state.uploadedAssets}
        onSelect={handleIconSelected}
      />

      {/* Export modal */}
      <BatchExportModal
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
        progress={exportProgress}
        validationResult={validationResult}
        warnings={exportWarnings}
        onExport={handleExport}
        onDownload={handleDownload}
        canDownload={!!exportBlob}
      />
    </div>
  );
}
