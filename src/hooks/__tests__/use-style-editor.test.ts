import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useStyleEditor } from "../use-style-editor";
import type { RestrictionConfig } from "../../types/restriction";

describe("useStyleEditor", () => {
  const createDefaultConfig = (): RestrictionConfig => ({
    version: 1,
    styles: [
      {
        name: "Default Style",
        backgroundColor: "#063940",
        iconColor: "#ffffff",
      },
    ],
  });

  let config: RestrictionConfig;
  let setConfig: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    config = createDefaultConfig();
    setConfig = vi.fn((newConfig: RestrictionConfig) => {
      config = newConfig;
    });
  });

  describe("initial state", () => {
    it("has no editing style initially", () => {
      const { result } = renderHook(() => useStyleEditor(config, setConfig));

      expect(result.current.editingStyleIndex).toBeNull();
      expect(result.current.editingStyle).toBeNull();
    });
  });

  describe("style operations", () => {
    it("addStyle creates a new style and selects it", () => {
      const { result, rerender } = renderHook(() =>
        useStyleEditor(config, setConfig)
      );

      act(() => {
        result.current.addStyle();
      });

      expect(setConfig).toHaveBeenCalled();
      const newConfig = setConfig.mock.calls[0][0];
      expect(newConfig.styles).toHaveLength(2);
      expect(newConfig.styles[1].name).toBe("Style 2");

      // Update config for rerender
      config = newConfig;
      rerender();

      expect(result.current.editingStyleIndex).toBe(1);
    });

    it("removeStyle removes a style", () => {
      // Start with 2 styles
      config.styles.push({
        name: "Second Style",
        backgroundColor: "#000000",
        iconColor: "#ffffff",
      });

      const { result } = renderHook(() => useStyleEditor(config, setConfig));

      act(() => {
        result.current.removeStyle(1);
      });

      expect(setConfig).toHaveBeenCalled();
      const newConfig = setConfig.mock.calls[0][0];
      expect(newConfig.styles).toHaveLength(1);
      expect(newConfig.styles[0].name).toBe("Default Style");
    });

    it("removeStyle does not remove last style", () => {
      const { result } = renderHook(() => useStyleEditor(config, setConfig));

      act(() => {
        result.current.removeStyle(0);
      });

      // Should not have called setConfig since we can't remove the last style
      expect(setConfig).not.toHaveBeenCalled();
    });

    it("updateStyle updates style properties", () => {
      const { result } = renderHook(() => useStyleEditor(config, setConfig));

      act(() => {
        result.current.updateStyle(0, { name: "Updated Name" });
      });

      expect(setConfig).toHaveBeenCalled();
      const newConfig = setConfig.mock.calls[0][0];
      expect(newConfig.styles[0].name).toBe("Updated Name");
    });

    it("setEditingIndex selects a style", () => {
      const { result } = renderHook(() => useStyleEditor(config, setConfig));

      act(() => {
        result.current.setEditingIndex(0);
      });

      expect(result.current.editingStyleIndex).toBe(0);
      expect(result.current.editingStyle).toEqual(config.styles[0]);
    });
  });

  describe("palette operations", () => {
    it("addPaletteColor adds a color to the current style", () => {
      const { result } = renderHook(() => useStyleEditor(config, setConfig));

      act(() => {
        result.current.setEditingIndex(0);
      });

      act(() => {
        result.current.addPaletteColor();
      });

      expect(setConfig).toHaveBeenCalled();
      const newConfig = setConfig.mock.calls[0][0];
      expect(newConfig.styles[0].colorPalette).toHaveLength(1);
      expect(newConfig.styles[0].colorPalette[0].name).toBe("Color 1");
    });

    it("addPaletteColor does nothing when no style selected", () => {
      const { result } = renderHook(() => useStyleEditor(config, setConfig));

      act(() => {
        result.current.addPaletteColor();
      });

      expect(setConfig).not.toHaveBeenCalled();
    });

    it("removePaletteColor removes a color", () => {
      config.styles[0].colorPalette = [
        { name: "Red", color: "#ff0000" },
        { name: "Blue", color: "#0000ff" },
      ];

      const { result } = renderHook(() => useStyleEditor(config, setConfig));

      act(() => {
        result.current.setEditingIndex(0);
      });

      act(() => {
        result.current.removePaletteColor(0);
      });

      expect(setConfig).toHaveBeenCalled();
      const newConfig = setConfig.mock.calls[0][0];
      expect(newConfig.styles[0].colorPalette).toHaveLength(1);
      expect(newConfig.styles[0].colorPalette[0].name).toBe("Blue");
    });

    it("updatePaletteColor updates a color", () => {
      config.styles[0].colorPalette = [{ name: "Red", color: "#ff0000" }];

      const { result } = renderHook(() => useStyleEditor(config, setConfig));

      act(() => {
        result.current.setEditingIndex(0);
      });

      act(() => {
        result.current.updatePaletteColor(0, { name: "Updated Red" });
      });

      expect(setConfig).toHaveBeenCalled();
      const newConfig = setConfig.mock.calls[0][0];
      expect(newConfig.styles[0].colorPalette[0].name).toBe("Updated Red");
    });
  });

  describe("editing index adjustment on remove", () => {
    it("clears editing index when current style is removed", () => {
      config.styles.push({
        name: "Second Style",
        backgroundColor: "#000000",
        iconColor: "#ffffff",
      });

      const { result } = renderHook(() => useStyleEditor(config, setConfig));

      act(() => {
        result.current.setEditingIndex(1);
      });

      expect(result.current.editingStyleIndex).toBe(1);

      act(() => {
        result.current.removeStyle(1);
      });

      expect(result.current.editingStyleIndex).toBeNull();
    });

    it("decrements editing index when earlier style is removed", () => {
      config.styles.push(
        {
          name: "Second Style",
          backgroundColor: "#000000",
          iconColor: "#ffffff",
        },
        {
          name: "Third Style",
          backgroundColor: "#111111",
          iconColor: "#ffffff",
        }
      );

      const { result } = renderHook(() => useStyleEditor(config, setConfig));

      act(() => {
        result.current.setEditingIndex(2);
      });

      expect(result.current.editingStyleIndex).toBe(2);

      act(() => {
        result.current.removeStyle(0);
      });

      expect(result.current.editingStyleIndex).toBe(1);
    });
  });
});
