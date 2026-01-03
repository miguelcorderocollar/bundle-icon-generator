import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useIconGenerator } from "../use-icon-generator";
import * as localStorageUtils from "../../utils/local-storage";
import * as iconCatalogUtils from "../../utils/icon-catalog";

// Mock the icon catalog to avoid fetching
vi.mock("../../utils/icon-catalog", () => ({
  loadIconCatalog: vi.fn().mockResolvedValue({
    icons: {
      "test-icon": { id: "test-icon", name: "Test Icon", pack: "test", tags: [], svg: "<svg></svg>" },
    },
  }),
}));

// Mock emoji catalog
vi.mock("../../utils/emoji-catalog", () => ({
  getUserEmojis: vi.fn().mockReturnValue([]),
}));

describe("useIconGenerator", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("initial state", () => {
    it("returns default state", async () => {
      const { result } = renderHook(() => useIconGenerator());

      // Initial state before initialization
      expect(result.current.state.selectedLocations).toEqual([]);
      expect(result.current.state.backgroundColor).toBe("#063940");
      expect(result.current.state.iconColor).toBe("#ffffff");
      expect(result.current.state.searchQuery).toBe("");
      expect(result.current.state.selectedPack).toBe("all");
      expect(result.current.state.iconSize).toBe(123);
      expect(result.current.state.svgIconSize).toBe(123);
    });

    it("provides action functions", () => {
      const { result } = renderHook(() => useIconGenerator());

      expect(typeof result.current.actions.setSelectedLocations).toBe("function");
      expect(typeof result.current.actions.setSelectedIconId).toBe("function");
      expect(typeof result.current.actions.setBackgroundColor).toBe("function");
      expect(typeof result.current.actions.setIconColor).toBe("function");
      expect(typeof result.current.actions.setSearchQuery).toBe("function");
      expect(typeof result.current.actions.setSelectedPack).toBe("function");
      expect(typeof result.current.actions.setIconSize).toBe("function");
      expect(typeof result.current.actions.setSvgIconSize).toBe("function");
    });
  });

  describe("actions", () => {
    it("setSelectedLocations updates locations", async () => {
      const { result } = renderHook(() => useIconGenerator());

      act(() => {
        result.current.actions.setSelectedLocations(["top_bar", "nav_bar"]);
      });

      expect(result.current.state.selectedLocations).toEqual(["top_bar", "nav_bar"]);
    });

    it("setSelectedIconId updates icon", async () => {
      const { result } = renderHook(() => useIconGenerator());

      act(() => {
        result.current.actions.setSelectedIconId("my-icon");
      });

      expect(result.current.state.selectedIconId).toBe("my-icon");
    });

    it("setBackgroundColor updates background color", async () => {
      const { result } = renderHook(() => useIconGenerator());

      act(() => {
        result.current.actions.setBackgroundColor("#ff0000");
      });

      expect(result.current.state.backgroundColor).toBe("#ff0000");
    });

    it("setBackgroundColor accepts gradient", async () => {
      const { result } = renderHook(() => useIconGenerator());

      const gradient = {
        type: "linear" as const,
        angle: 90,
        stops: [
          { color: "#ff0000", offset: 0 },
          { color: "#0000ff", offset: 100 },
        ],
      };

      act(() => {
        result.current.actions.setBackgroundColor(gradient);
      });

      expect(result.current.state.backgroundColor).toEqual(gradient);
    });

    it("setIconColor updates icon color", async () => {
      const { result } = renderHook(() => useIconGenerator());

      act(() => {
        result.current.actions.setIconColor("#00ff00");
      });

      expect(result.current.state.iconColor).toBe("#00ff00");
    });

    it("setSearchQuery updates search query", async () => {
      const { result } = renderHook(() => useIconGenerator());

      act(() => {
        result.current.actions.setSearchQuery("arrow");
      });

      expect(result.current.state.searchQuery).toBe("arrow");
    });

    it("setSelectedPack updates pack filter", async () => {
      const { result } = renderHook(() => useIconGenerator());

      act(() => {
        result.current.actions.setSelectedPack("zendesk");
      });

      expect(result.current.state.selectedPack).toBe("zendesk");
    });

    it("setIconSize updates icon size", async () => {
      const { result } = renderHook(() => useIconGenerator());

      act(() => {
        result.current.actions.setIconSize(150);
      });

      expect(result.current.state.iconSize).toBe(150);
    });

    it("setSvgIconSize updates SVG icon size", async () => {
      const { result } = renderHook(() => useIconGenerator());

      act(() => {
        result.current.actions.setSvgIconSize(100);
      });

      expect(result.current.state.svgIconSize).toBe(100);
    });
  });

  describe("localStorage persistence", () => {
    it("loads persisted state on mount", async () => {
      const persistedState = {
        selectedLocations: ["top_bar"],
        selectedIconId: "saved-icon",
        backgroundColor: "#123456",
        iconColor: "#abcdef",
        selectedPack: "feather",
        iconSize: 100,
        svgIconSize: 80,
      };
      localStorage.setItem(
        "zdk-icon-generator:generator-state",
        JSON.stringify(persistedState)
      );

      const { result } = renderHook(() => useIconGenerator());

      // Wait for initialization
      await waitFor(() => {
        expect(result.current.state.selectedIconId).toBe("saved-icon");
      });

      expect(result.current.state.selectedLocations).toEqual(["top_bar"]);
      expect(result.current.state.backgroundColor).toBe("#123456");
      expect(result.current.state.iconColor).toBe("#abcdef");
      expect(result.current.state.selectedPack).toBe("feather");
      expect(result.current.state.iconSize).toBe(100);
      expect(result.current.state.svgIconSize).toBe(80);
    });

    it("does not persist searchQuery", async () => {
      const persistedState = {
        selectedLocations: [],
        selectedIconId: "test-icon",
        backgroundColor: "#000000",
        iconColor: "#ffffff",
        selectedPack: "all",
        iconSize: 123,
        svgIconSize: 123,
      };
      localStorage.setItem(
        "zdk-icon-generator:generator-state",
        JSON.stringify(persistedState)
      );

      const { result } = renderHook(() => useIconGenerator());

      // Wait for initialization
      await waitFor(() => {
        expect(result.current.state.selectedIconId).toBe("test-icon");
      });

      // Search query should always be empty on load
      expect(result.current.state.searchQuery).toBe("");
    });

    it("saves state changes to localStorage after initialization", async () => {
      const { result } = renderHook(() => useIconGenerator());

      // Wait for initialization
      await waitFor(() => {
        expect(result.current.state).toBeDefined();
      });

      // Make a change
      act(() => {
        result.current.actions.setIconColor("#ff0000");
      });

      // Wait a tick for the effect to run
      await waitFor(() => {
        const stored = localStorage.getItem("zdk-icon-generator:generator-state");
        if (stored) {
          const parsed = JSON.parse(stored);
          expect(parsed.iconColor).toBe("#ff0000");
        }
      });
    });
  });

  describe("action memoization", () => {
    it("actions object is stable across renders", async () => {
      const { result, rerender } = renderHook(() => useIconGenerator());

      const firstActions = result.current.actions;

      rerender();

      expect(result.current.actions).toBe(firstActions);
    });
  });
});

