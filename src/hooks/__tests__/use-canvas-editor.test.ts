/**
 * Unit tests for useCanvasEditor hook
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCanvasEditor } from "../use-canvas-editor";
import { DEFAULT_CANVAS_STATE } from "@/src/types/canvas";

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("useCanvasEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe("initialization", () => {
    it("should initialize with default state", () => {
      const { result } = renderHook(() => useCanvasEditor());

      expect(result.current.state.layers).toEqual([]);
      expect(result.current.state.selectedLayerId).toBeUndefined();
      expect(result.current.state.canvasSize).toBe(1024);
    });

    it("should load persisted state from localStorage", async () => {
      const persistedState = {
        ...DEFAULT_CANVAS_STATE,
        layers: [
          {
            id: "layer-1",
            name: "Test Icon",
            type: "icon" as const,
            iconId: "test-icon",
            color: "#ff0000",
            visible: true,
            locked: false,
            left: 100,
            top: 100,
            scaleX: 1,
            scaleY: 1,
            angle: 0,
            opacity: 1,
          },
        ],
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(persistedState));

      const { result } = renderHook(() => useCanvasEditor());

      // Wait for initialization
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(result.current.state.layers).toHaveLength(1);
      expect(result.current.state.layers[0].name).toBe("Test Icon");
    });
  });

  describe("addIconLayer", () => {
    it("should add an icon layer", () => {
      const { result } = renderHook(() => useCanvasEditor());

      act(() => {
        result.current.actions.addIconLayer("test-icon-id", "#ffffff");
      });

      expect(result.current.state.layers).toHaveLength(1);
      expect(result.current.state.layers[0].type).toBe("icon");
      expect(
        (result.current.state.layers[0] as { iconId: string }).iconId
      ).toBe("test-icon-id");
      expect((result.current.state.layers[0] as { color: string }).color).toBe(
        "#ffffff"
      );
    });

    it("should select the newly added layer", () => {
      const { result } = renderHook(() => useCanvasEditor());

      act(() => {
        result.current.actions.addIconLayer("test-icon-id");
      });

      expect(result.current.state.selectedLayerId).toBe(
        result.current.state.layers[0].id
      );
    });
  });

  describe("addImageLayer", () => {
    it("should add an image layer", () => {
      const { result } = renderHook(() => useCanvasEditor());
      const dataUrl = "data:image/png;base64,test";

      act(() => {
        result.current.actions.addImageLayer(dataUrl, "Test Image");
      });

      expect(result.current.state.layers).toHaveLength(1);
      expect(result.current.state.layers[0].type).toBe("image");
      expect(
        (result.current.state.layers[0] as { imageDataUrl: string })
          .imageDataUrl
      ).toBe(dataUrl);
      expect(result.current.state.layers[0].name).toBe("Test Image");
    });
  });

  describe("addTextLayer", () => {
    it("should add a text layer with default options", () => {
      const { result } = renderHook(() => useCanvasEditor());

      act(() => {
        result.current.actions.addTextLayer("Hello World");
      });

      expect(result.current.state.layers).toHaveLength(1);
      expect(result.current.state.layers[0].type).toBe("text");
      expect((result.current.state.layers[0] as { text: string }).text).toBe(
        "Hello World"
      );
      expect(
        (result.current.state.layers[0] as { fontFamily: string }).fontFamily
      ).toBe("Arial");
    });

    it("should add a text layer with custom options", () => {
      const { result } = renderHook(() => useCanvasEditor());

      act(() => {
        result.current.actions.addTextLayer("Hello", {
          fontFamily: "Georgia",
          fontSize: 48,
          color: "#ff0000",
          bold: true,
        });
      });

      const layer = result.current.state.layers[0] as {
        fontFamily: string;
        fontSize: number;
        color: string;
        bold: boolean;
      };
      expect(layer.fontFamily).toBe("Georgia");
      expect(layer.fontSize).toBe(48);
      expect(layer.color).toBe("#ff0000");
      expect(layer.bold).toBe(true);
    });
  });

  describe("removeLayer", () => {
    it("should remove a layer by id", () => {
      const { result } = renderHook(() => useCanvasEditor());

      act(() => {
        result.current.actions.addIconLayer("icon-1");
        result.current.actions.addIconLayer("icon-2");
      });

      const firstLayerId = result.current.state.layers[0].id;

      act(() => {
        result.current.actions.removeLayer(firstLayerId);
      });

      expect(result.current.state.layers).toHaveLength(1);
      expect(result.current.state.layers[0].id).not.toBe(firstLayerId);
    });

    it("should clear selection if removed layer was selected", () => {
      const { result } = renderHook(() => useCanvasEditor());

      act(() => {
        result.current.actions.addIconLayer("icon-1");
      });

      const layerId = result.current.state.layers[0].id;

      act(() => {
        result.current.actions.removeLayer(layerId);
      });

      expect(result.current.state.selectedLayerId).toBeUndefined();
    });
  });

  describe("updateLayer", () => {
    it("should update layer properties", () => {
      const { result } = renderHook(() => useCanvasEditor());

      act(() => {
        result.current.actions.addIconLayer("icon-1");
      });

      const layerId = result.current.state.layers[0].id;

      act(() => {
        result.current.actions.updateLayer(layerId, {
          opacity: 0.5,
          angle: 45,
        });
      });

      expect(result.current.state.layers[0].opacity).toBe(0.5);
      expect(result.current.state.layers[0].angle).toBe(45);
    });
  });

  describe("reorderLayers", () => {
    it("should reorder layers", () => {
      const { result } = renderHook(() => useCanvasEditor());

      act(() => {
        result.current.actions.addIconLayer("icon-1");
        result.current.actions.addIconLayer("icon-2");
        result.current.actions.addIconLayer("icon-3");
      });

      const secondLayerId = result.current.state.layers[1].id;

      act(() => {
        result.current.actions.reorderLayers(1, 2);
      });

      expect(result.current.state.layers[2].id).toBe(secondLayerId);
    });
  });

  describe("bringForward", () => {
    it("should move layer up in z-order", () => {
      const { result } = renderHook(() => useCanvasEditor());

      act(() => {
        result.current.actions.addIconLayer("icon-1");
        result.current.actions.addIconLayer("icon-2");
      });

      const firstLayerId = result.current.state.layers[0].id;

      act(() => {
        result.current.actions.bringForward(firstLayerId);
      });

      expect(result.current.state.layers[1].id).toBe(firstLayerId);
    });

    it("should not move layer if already at top", () => {
      const { result } = renderHook(() => useCanvasEditor());

      act(() => {
        result.current.actions.addIconLayer("icon-1");
        result.current.actions.addIconLayer("icon-2");
      });

      const topLayerId = result.current.state.layers[1].id;

      act(() => {
        result.current.actions.bringForward(topLayerId);
      });

      expect(result.current.state.layers[1].id).toBe(topLayerId);
    });
  });

  describe("sendBackward", () => {
    it("should move layer down in z-order", () => {
      const { result } = renderHook(() => useCanvasEditor());

      act(() => {
        result.current.actions.addIconLayer("icon-1");
        result.current.actions.addIconLayer("icon-2");
      });

      const secondLayerId = result.current.state.layers[1].id;

      act(() => {
        result.current.actions.sendBackward(secondLayerId);
      });

      expect(result.current.state.layers[0].id).toBe(secondLayerId);
    });
  });

  describe("duplicateLayer", () => {
    it("should duplicate a layer", () => {
      const { result } = renderHook(() => useCanvasEditor());

      act(() => {
        result.current.actions.addIconLayer("icon-1");
      });

      const originalLayer = result.current.state.layers[0];

      act(() => {
        result.current.actions.duplicateLayer(originalLayer.id);
      });

      expect(result.current.state.layers).toHaveLength(2);
      expect(result.current.state.layers[1].name).toContain("(copy)");
    });
  });

  describe("clearCanvas", () => {
    it("should remove all layers", () => {
      const { result } = renderHook(() => useCanvasEditor());

      act(() => {
        result.current.actions.addIconLayer("icon-1");
        result.current.actions.addIconLayer("icon-2");
      });

      act(() => {
        result.current.actions.clearCanvas();
      });

      expect(result.current.state.layers).toHaveLength(0);
      expect(result.current.state.selectedLayerId).toBeUndefined();
    });
  });

  describe("setBackgroundColor", () => {
    it("should update background color", () => {
      const { result } = renderHook(() => useCanvasEditor());

      act(() => {
        result.current.actions.setBackgroundColor("#ff0000");
      });

      expect(result.current.state.backgroundColor).toBe("#ff0000");
    });
  });

  describe("selectedLayer", () => {
    it("should return the selected layer", () => {
      const { result } = renderHook(() => useCanvasEditor());

      act(() => {
        result.current.actions.addIconLayer("icon-1");
      });

      expect(result.current.selectedLayer).toBeDefined();
      expect(result.current.selectedLayer?.id).toBe(
        result.current.state.selectedLayerId
      );
    });

    it("should return undefined when no layer is selected", () => {
      const { result } = renderHook(() => useCanvasEditor());

      act(() => {
        result.current.actions.addIconLayer("icon-1");
        result.current.actions.selectLayer(undefined);
      });

      expect(result.current.selectedLayer).toBeUndefined();
    });
  });
});
