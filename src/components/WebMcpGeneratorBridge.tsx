"use client";

import * as React from "react";
import type { CanvasEditorState } from "../types/canvas";
import type {
  IconGeneratorActions,
  IconGeneratorState,
} from "../hooks/use-icon-generator";
import { usePresets } from "../hooks/use-presets";
import { useRestriction } from "../contexts/RestrictionContext";
import { getDocumentModelContext, registerWebMcpTools } from "../utils/webmcp";
import {
  createGeneratorWebMcpTools,
  type WebMcpGeneratorBindings,
} from "../utils/webmcp-generator";

interface WebMcpGeneratorBridgeProps {
  state: IconGeneratorState;
  actions: IconGeneratorActions;
  canvasState: CanvasEditorState;
}

type RegistrationStatus = "checking" | "ready" | "unavailable" | "error";

export function WebMcpGeneratorBridge({
  state,
  actions,
  canvasState,
}: WebMcpGeneratorBridgeProps) {
  const {
    exportPresets,
    selectedExportPresetId,
    stylePresets,
    selectedStylePresetId,
    selectExportPreset,
    selectStylePreset,
  } = usePresets();
  const restriction = useRestriction();
  const stateRef = React.useRef(state);
  const canvasStateRef = React.useRef(canvasState);
  const exportPresetsRef = React.useRef(exportPresets);
  const selectedExportPresetIdRef = React.useRef(selectedExportPresetId);
  const stylePresetsRef = React.useRef(stylePresets);
  const selectedStylePresetIdRef = React.useRef(selectedStylePresetId);
  const restrictionRef = React.useRef(restriction);
  const [status, setStatus] = React.useState<RegistrationStatus>("checking");
  const [toolCount, setToolCount] = React.useState(0);

  React.useEffect(() => {
    stateRef.current = state;
    canvasStateRef.current = canvasState;
    exportPresetsRef.current = exportPresets;
    selectedExportPresetIdRef.current = selectedExportPresetId;
    stylePresetsRef.current = stylePresets;
    selectedStylePresetIdRef.current = selectedStylePresetId;
    restrictionRef.current = restriction;
  }, [
    canvasState,
    exportPresets,
    restriction,
    selectedExportPresetId,
    selectedStylePresetId,
    state,
    stylePresets,
  ]);

  const bindings = React.useMemo<WebMcpGeneratorBindings>(
    () => ({
      getState: () => stateRef.current,
      getCanvasState: () => canvasStateRef.current,
      getExportPresets: () =>
        restrictionRef.current.allowedExportPresets ?? exportPresetsRef.current,
      getSelectedExportPresetId: () => selectedExportPresetIdRef.current,
      getStylePresets: () => stylePresetsRef.current,
      getSelectedStylePresetId: () => selectedStylePresetIdRef.current,
      isIconPackAllowed: (pack) =>
        restrictionRef.current.isIconPackAllowed(pack),
      isExportPresetAllowed: (preset) =>
        restrictionRef.current.isExportPresetAllowed(preset.id),
      isRestricted: () => restrictionRef.current.isRestricted,
      getAllowedStyles: () => restrictionRef.current.allowedStyles,
      actions,
      selectExportPreset,
      selectStylePreset,
    }),
    [actions, selectExportPreset, selectStylePreset]
  );

  React.useEffect(() => {
    const modelContext = getDocumentModelContext();
    if (!modelContext) {
      setStatus("unavailable");
      return;
    }

    let disposed = false;
    const registrationPromise = registerWebMcpTools(
      modelContext,
      createGeneratorWebMcpTools(bindings)
    );

    registrationPromise
      .then((registration) => {
        if (disposed) {
          registration.dispose();
          return;
        }
        setToolCount(registration.toolNames.length);
        setStatus("ready");
      })
      .catch(() => {
        if (!disposed) {
          setStatus("error");
        }
      });

    return () => {
      disposed = true;
      void registrationPromise
        .then((registration) => registration.dispose())
        .catch(() => undefined);
    };
  }, [bindings]);

  if (status !== "ready") {
    return null;
  }

  return (
    <span
      data-testid="webmcp-main-status"
      className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300"
      title="This page exposes icon search, configuration, rendering, and export tools."
    >
      <span
        className="size-1.5 rounded-full bg-emerald-500"
        aria-hidden="true"
      />
      Agent ready · {toolCount} tools
    </span>
  );
}
