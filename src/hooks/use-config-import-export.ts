/**
 * Hook for config import/export functionality in the share page
 *
 * Handles file import/export and URL import operations.
 */

import * as React from "react";
import type { RestrictionConfig } from "@/src/types/restriction";
import { isRestrictionConfig } from "@/src/types/restriction";
import {
  decodeRestrictionConfig,
  RESTRICTION_URL_PARAM,
} from "@/src/utils/restriction-codec";

export interface UseConfigImportExportReturn {
  /** Reference for the hidden file input */
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  /** Whether the URL import dialog is open */
  showUrlImport: boolean;
  /** Current URL input value */
  urlImportValue: string;
  /** URL import error message (null if no error) */
  urlImportError: string | null;
  /** Export config to JSON file */
  exportConfig: () => void;
  /** Handle file input change (import from file) */
  handleFileImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  /** Open the URL import dialog */
  openUrlImport: () => void;
  /** Close the URL import dialog */
  closeUrlImport: () => void;
  /** Set the URL input value */
  setUrlImportValue: (value: string) => void;
  /** Import config from URL */
  importFromUrl: () => void;
  /** Trigger file input click */
  triggerFileInput: () => void;
}

export function useConfigImportExport(
  config: RestrictionConfig,
  setConfig: (config: RestrictionConfig) => void,
  onImportSuccess?: () => void
): UseConfigImportExportReturn {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [showUrlImport, setShowUrlImport] = React.useState(false);
  const [urlImportValue, setUrlImportValue] = React.useState("");
  const [urlImportError, setUrlImportError] = React.useState<string | null>(
    null
  );

  // Export config to JSON file
  const exportConfig = React.useCallback(() => {
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
  }, [config]);

  // Handle file input change (import from file)
  const handleFileImport = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
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
          onImportSuccess?.();
        } catch (error) {
          console.error("Failed to import config:", error);
          alert(
            "Failed to parse the config file. Please check the file format."
          );
        }
      };
      reader.readAsText(file);

      // Reset the input so the same file can be selected again
      event.target.value = "";
    },
    [setConfig, onImportSuccess]
  );

  // Open the URL import dialog
  const openUrlImport = React.useCallback(() => {
    setShowUrlImport(true);
    setUrlImportError(null);
    setUrlImportValue("");
  }, []);

  // Close the URL import dialog
  const closeUrlImport = React.useCallback(() => {
    setShowUrlImport(false);
    setUrlImportValue("");
    setUrlImportError(null);
  }, []);

  // Import config from URL
  const importFromUrl = React.useCallback(() => {
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
      onImportSuccess?.();
      setShowUrlImport(false);
      setUrlImportValue("");
    } catch {
      setUrlImportError(
        "Invalid URL format. Please enter a valid URL with a restriction config."
      );
    }
  }, [urlImportValue, setConfig, onImportSuccess]);

  // Trigger file input click
  const triggerFileInput = React.useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return {
    fileInputRef,
    showUrlImport,
    urlImportValue,
    urlImportError,
    exportConfig,
    handleFileImport,
    openUrlImport,
    closeUrlImport,
    setUrlImportValue,
    importFromUrl,
    triggerFileInput,
  };
}
