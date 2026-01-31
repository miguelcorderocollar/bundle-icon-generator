"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ArrowLeft, Download, Upload, ExternalLink } from "lucide-react";
import Link from "next/link";
import type { UseConfigImportExportReturn } from "@/src/hooks/use-config-import-export";

export interface SharePageHeaderProps {
  /** Import/export hook return object */
  importExport: UseConfigImportExportReturn;
}

/**
 * Header component for the share page
 * Contains navigation, title, and import/export buttons
 */
export function SharePageHeader({ importExport }: SharePageHeaderProps) {
  const {
    fileInputRef,
    exportConfig,
    handleFileImport,
    openUrlImport,
    triggerFileInput,
  } = importExport;

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">Share Configuration</h1>
          <p className="text-sm text-muted-foreground">
            Generate shareable links with presets and configurations
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileImport}
          className="hidden"
        />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={openUrlImport}>
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
              <Button variant="outline" size="sm" onClick={triggerFileInput}>
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
              <Button variant="outline" size="sm" onClick={exportConfig}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </TooltipTrigger>
            <TooltipContent>Export current config to JSON file</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
