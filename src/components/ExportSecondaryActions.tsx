"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Check,
  ChevronDown,
  Copy,
  Download,
  FileImage,
  FileType2,
} from "lucide-react";
import type { IconGeneratorState } from "../hooks/use-icon-generator";
import type { AppLocation } from "../types/app-location";
import type { CanvasEditorState } from "../types/canvas";
import type { ExportPreset } from "../types/preset";
import { cn } from "@/lib/utils";
import {
  downloadFile,
  generateClipboardPng,
  generateSourceSvgDownload,
  generateStyledSvgDownload,
  getSecondaryExportCapabilities,
} from "../utils/export-controller";
import {
  isImageClipboardSupported,
  writeImageToClipboard,
} from "../utils/clipboard";

export interface ExportSecondaryActionsProps {
  state: IconGeneratorState;
  selectedLocations: AppLocation[];
  canvasState?: CanvasEditorState;
  selectedExportPreset?: ExportPreset;
  disabled?: boolean;
  className?: string;
}

type ActionStatus = "idle" | "loading" | "success" | "error";
type ActionKey = "styledSvg" | "sourceSvg" | "copyPng";

export function ExportSecondaryActions({
  state,
  selectedLocations,
  canvasState,
  selectedExportPreset,
  disabled = false,
  className,
}: ExportSecondaryActionsProps) {
  const [statuses, setStatuses] = React.useState<
    Record<ActionKey, ActionStatus>
  >({
    styledSvg: "idle",
    sourceSvg: "idle",
    copyPng: "idle",
  });

  const resetTimers = React.useRef<Partial<Record<ActionKey, number>>>({});

  React.useEffect(() => {
    const timers = resetTimers.current;
    return () => {
      Object.values(timers).forEach((timer) => {
        if (timer) {
          window.clearTimeout(timer);
        }
      });
    };
  }, []);

  const capabilities = React.useMemo(
    () =>
      getSecondaryExportCapabilities(state, selectedLocations, canvasState, {
        preset: selectedExportPreset,
      }),
    [canvasState, selectedExportPreset, selectedLocations, state]
  );

  const setTimedStatus = React.useCallback(
    (key: ActionKey, status: ActionStatus) => {
      setStatuses((current) => ({ ...current, [key]: status }));

      if (resetTimers.current[key]) {
        window.clearTimeout(resetTimers.current[key]);
      }

      if (status === "success" || status === "error") {
        resetTimers.current[key] = window.setTimeout(() => {
          setStatuses((current) => ({ ...current, [key]: "idle" }));
        }, 2000);
      }
    },
    []
  );

  const runAction = React.useCallback(
    async (key: ActionKey, action: () => Promise<void>) => {
      setStatuses((current) => ({ ...current, [key]: "loading" }));

      try {
        await action();
        setTimedStatus(key, "success");
      } catch (error) {
        console.error(`Secondary export action failed (${key}):`, error);
        setTimedStatus(key, "error");
      }
    },
    [setTimedStatus]
  );

  const clipboardSupported = isImageClipboardSupported();
  const copyPngEnabled =
    !disabled &&
    capabilities.canCopyPng &&
    clipboardSupported &&
    statuses.copyPng !== "loading";

  const getLabel = (key: ActionKey, idle: string) => {
    const status = statuses[key];
    if (status === "loading") return "Working...";
    if (status === "success") {
      return key === "copyPng" ? "Copied" : "Downloaded";
    }
    if (status === "error") return "Failed";
    return idle;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="default"
          size="lg"
          aria-label="Export secondary actions"
          disabled={disabled}
          className={cn(
            "rounded-l-none border-l border-primary-foreground/20 px-3",
            className
          )}
        >
          <ChevronDown className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem
          disabled={
            disabled ||
            !capabilities.canDownloadStyledSvg ||
            statuses.styledSvg === "loading"
          }
          onSelect={(event) => {
            event.preventDefault();
            void runAction("styledSvg", async () => {
              const result = await generateStyledSvgDownload(state);
              downloadFile(result.blob, result.filename);
            });
          }}
        >
          {statuses.styledSvg === "success" ? (
            <Check className="size-4" />
          ) : (
            <FileType2 className="size-4" />
          )}
          {getLabel("styledSvg", "Download styled SVG")}
        </DropdownMenuItem>

        <DropdownMenuItem
          disabled={
            disabled ||
            !capabilities.canDownloadSourceSvg ||
            statuses.sourceSvg === "loading"
          }
          onSelect={(event) => {
            event.preventDefault();
            void runAction("sourceSvg", async () => {
              const result = await generateSourceSvgDownload(state);
              downloadFile(result.blob, result.filename);
            });
          }}
        >
          {statuses.sourceSvg === "success" ? (
            <Check className="size-4" />
          ) : (
            <Download className="size-4" />
          )}
          {getLabel("sourceSvg", "Download source SVG")}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          disabled={!copyPngEnabled}
          onSelect={(event) => {
            event.preventDefault();
            void runAction("copyPng", async () => {
              const blob = await generateClipboardPng(
                state,
                selectedLocations,
                canvasState,
                { preset: selectedExportPreset }
              );
              await writeImageToClipboard(blob);
            });
          }}
        >
          {statuses.copyPng === "success" ? (
            <Check className="size-4" />
          ) : (
            <FileImage className="size-4" />
          )}
          {getLabel(
            "copyPng",
            clipboardSupported
              ? "Copy PNG to clipboard"
              : "Clipboard unavailable"
          )}
          {!clipboardSupported && (
            <Copy className="ml-auto size-4 opacity-50" />
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
