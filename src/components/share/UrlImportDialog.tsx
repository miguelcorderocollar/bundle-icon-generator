"use client";

import * as React from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { UseConfigImportExportReturn } from "@/src/hooks/use-config-import-export";

export interface UrlImportDialogProps {
  /** Import/export hook return object */
  importExport: UseConfigImportExportReturn;
}

/**
 * Dialog for importing config from a URL
 */
export function UrlImportDialog({ importExport }: UrlImportDialogProps) {
  const {
    showUrlImport,
    urlImportValue,
    urlImportError,
    closeUrlImport,
    setUrlImportValue,
    importFromUrl,
  } = importExport;

  return (
    <Dialog
      open={showUrlImport}
      onOpenChange={(open) => !open && closeUrlImport()}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import from URL</DialogTitle>
          <DialogDescription>
            Paste an existing restriction URL to import its configuration. This
            will replace your current settings.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="url-import">Restriction URL</Label>
            <Input
              id="url-import"
              value={urlImportValue}
              onChange={(e) => setUrlImportValue(e.target.value)}
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
          <Button variant="outline" onClick={closeUrlImport}>
            Cancel
          </Button>
          <Button onClick={importFromUrl}>Import</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
