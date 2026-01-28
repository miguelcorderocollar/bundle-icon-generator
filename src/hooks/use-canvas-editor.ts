/**
 * Canvas editor state management hook
 * Manages layers, selection, and persistence for the canvas editor
 */

import * as React from "react";
import type {
  CanvasEditorState,
  CanvasLayer,
  IconLayer,
  ImageLayer,
  TextLayer,
} from "@/src/types/canvas";
import {
  DEFAULT_CANVAS_STATE,
  DEFAULT_FONT_FAMILY,
  DEFAULT_FONT_SIZE,
} from "@/src/types/canvas";
import type { BackgroundValue } from "@/src/utils/gradients";

const STORAGE_PREFIX = "zdk-icon-generator";
const CANVAS_STATE_KEY = `${STORAGE_PREFIX}:canvas-state`;
const DEBOUNCE_DELAY = 300;

/**
 * Generate a unique layer ID
 */
function generateLayerId(): string {
  return `layer-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Load canvas state from localStorage
 */
function loadCanvasState(): CanvasEditorState | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = localStorage.getItem(CANVAS_STATE_KEY);
    if (!stored) {
      return null;
    }
    return JSON.parse(stored) as CanvasEditorState;
  } catch (error) {
    console.error("Error loading canvas state from localStorage:", error);
    return null;
  }
}

/**
 * Save canvas state to localStorage
 */
function saveCanvasState(state: CanvasEditorState): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(CANVAS_STATE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Error saving canvas state to localStorage:", error);
  }
}

/**
 * Actions for managing canvas editor state
 */
export interface CanvasEditorActions {
  /** Add a new layer and return its ID */
  addIconLayer: (iconId: string, color?: string) => string;
  addImageLayer: (imageDataUrl: string, name?: string) => string;
  addTextLayer: (text: string, options?: Partial<TextLayer>) => string;
  /** Remove a layer by ID */
  removeLayer: (id: string) => void;
  /** Update layer properties */
  updateLayer: (id: string, updates: Partial<CanvasLayer>) => void;
  /** Reorder layers (move from one index to another) */
  reorderLayers: (fromIndex: number, toIndex: number) => void;
  /** Move layer up in z-index */
  bringForward: (id: string) => void;
  /** Move layer down in z-index */
  sendBackward: (id: string) => void;
  /** Select a layer */
  selectLayer: (id: string | undefined) => void;
  /** Duplicate a layer */
  duplicateLayer: (id: string) => string | undefined;
  /** Set background color */
  setBackgroundColor: (color: BackgroundValue) => void;
  /** Clear all layers */
  clearCanvas: () => void;
  /** Reset to default state */
  resetCanvas: () => void;
}

/**
 * Hook for managing canvas editor state
 */
export function useCanvasEditor() {
  const [state, setState] =
    React.useState<CanvasEditorState>(DEFAULT_CANVAS_STATE);
  const [hasInitialized, setHasInitialized] = React.useState(false);
  const saveTimeoutRef = React.useRef<number | null>(null);

  // Load persisted state on mount
  React.useEffect(() => {
    if (hasInitialized || typeof window === "undefined") return;

    const persistedState = loadCanvasState();
    if (persistedState) {
      setState(persistedState);
    }
    setHasInitialized(true);
  }, [hasInitialized]);

  // Debounced save to localStorage
  React.useEffect(() => {
    if (!hasInitialized || typeof window === "undefined") return;

    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = window.setTimeout(() => {
      saveCanvasState(state);
    }, DEBOUNCE_DELAY);

    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [state, hasInitialized]);

  const actions: CanvasEditorActions = React.useMemo(
    () => ({
      addIconLayer: (iconId: string, color: string = "#ffffff") => {
        const id = generateLayerId();
        const newLayer: IconLayer = {
          id,
          name: `Icon ${state.layers.filter((l) => l.type === "icon").length + 1}`,
          type: "icon",
          iconId,
          color,
          visible: true,
          locked: false,
          left: state.canvasSize / 2,
          top: state.canvasSize / 2,
          scaleX: 1,
          scaleY: 1,
          angle: 0,
          opacity: 1,
        };
        setState((prev) => ({
          ...prev,
          layers: [...prev.layers, newLayer],
          selectedLayerId: id,
        }));
        return id;
      },

      addImageLayer: (imageDataUrl: string, name?: string) => {
        const id = generateLayerId();
        const newLayer: ImageLayer = {
          id,
          name:
            name ||
            `Image ${state.layers.filter((l) => l.type === "image").length + 1}`,
          type: "image",
          imageDataUrl,
          visible: true,
          locked: false,
          left: state.canvasSize / 2,
          top: state.canvasSize / 2,
          scaleX: 1,
          scaleY: 1,
          angle: 0,
          opacity: 1,
        };
        setState((prev) => ({
          ...prev,
          layers: [...prev.layers, newLayer],
          selectedLayerId: id,
        }));
        return id;
      },

      addTextLayer: (text: string, options?: Partial<TextLayer>) => {
        const id = generateLayerId();
        const newLayer: TextLayer = {
          id,
          name:
            options?.name ||
            `Text ${state.layers.filter((l) => l.type === "text").length + 1}`,
          type: "text",
          text,
          fontFamily: options?.fontFamily || DEFAULT_FONT_FAMILY,
          fontSize: options?.fontSize || DEFAULT_FONT_SIZE,
          color: options?.color || "#ffffff",
          bold: options?.bold || false,
          italic: options?.italic || false,
          visible: true,
          locked: false,
          left: state.canvasSize / 2,
          top: state.canvasSize / 2,
          scaleX: 1,
          scaleY: 1,
          angle: 0,
          opacity: 1,
        };
        setState((prev) => ({
          ...prev,
          layers: [...prev.layers, newLayer],
          selectedLayerId: id,
        }));
        return id;
      },

      removeLayer: (id: string) => {
        setState((prev) => ({
          ...prev,
          layers: prev.layers.filter((layer) => layer.id !== id),
          selectedLayerId:
            prev.selectedLayerId === id ? undefined : prev.selectedLayerId,
        }));
      },

      updateLayer: (id: string, updates: Partial<CanvasLayer>) => {
        setState((prev) => ({
          ...prev,
          layers: prev.layers.map((layer) =>
            layer.id === id ? ({ ...layer, ...updates } as CanvasLayer) : layer
          ),
        }));
      },

      reorderLayers: (fromIndex: number, toIndex: number) => {
        setState((prev) => {
          const newLayers = [...prev.layers];
          const [removed] = newLayers.splice(fromIndex, 1);
          newLayers.splice(toIndex, 0, removed);
          return { ...prev, layers: newLayers };
        });
      },

      bringForward: (id: string) => {
        setState((prev) => {
          const index = prev.layers.findIndex((l) => l.id === id);
          if (index === -1 || index === prev.layers.length - 1) return prev;

          const newLayers = [...prev.layers];
          const [removed] = newLayers.splice(index, 1);
          newLayers.splice(index + 1, 0, removed);
          return { ...prev, layers: newLayers };
        });
      },

      sendBackward: (id: string) => {
        setState((prev) => {
          const index = prev.layers.findIndex((l) => l.id === id);
          if (index <= 0) return prev;

          const newLayers = [...prev.layers];
          const [removed] = newLayers.splice(index, 1);
          newLayers.splice(index - 1, 0, removed);
          return { ...prev, layers: newLayers };
        });
      },

      selectLayer: (id: string | undefined) => {
        setState((prev) => ({ ...prev, selectedLayerId: id }));
      },

      duplicateLayer: (id: string) => {
        const layer = state.layers.find((l) => l.id === id);
        if (!layer) return undefined;

        const newId = generateLayerId();
        const duplicatedLayer: CanvasLayer = {
          ...layer,
          id: newId,
          name: `${layer.name} (copy)`,
          left: layer.left + 20,
          top: layer.top + 20,
        };

        setState((prev) => ({
          ...prev,
          layers: [...prev.layers, duplicatedLayer],
          selectedLayerId: newId,
        }));

        return newId;
      },

      setBackgroundColor: (color: BackgroundValue) => {
        setState((prev) => ({ ...prev, backgroundColor: color }));
      },

      clearCanvas: () => {
        setState((prev) => ({
          ...prev,
          layers: [],
          selectedLayerId: undefined,
        }));
      },

      resetCanvas: () => {
        setState(DEFAULT_CANVAS_STATE);
      },
    }),
    [state.layers, state.canvasSize]
  );

  // Get the selected layer
  const selectedLayer = React.useMemo(
    () => state.layers.find((l) => l.id === state.selectedLayerId),
    [state.layers, state.selectedLayerId]
  );

  return {
    state,
    actions,
    selectedLayer,
    hasInitialized,
  };
}
