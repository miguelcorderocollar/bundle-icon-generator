import { describe, it, expect, beforeEach } from "vitest";
import {
  getFavorites,
  addFavorite,
  removeFavorite,
  toggleFavorite,
  isFavorite,
  getRecentIcons,
  addRecentIcon,
  clearRecentIcons,
  saveGeneratorState,
  loadGeneratorState,
  clearGeneratorState,
  type PersistedGeneratorState,
} from "../local-storage";

describe("local-storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("favorites", () => {
    describe("getFavorites", () => {
      it("returns empty array when no favorites stored", () => {
        expect(getFavorites()).toEqual([]);
      });

      it("returns stored favorites", () => {
        localStorage.setItem(
          "zdk-icon-generator:favorites",
          JSON.stringify(["icon1", "icon2"])
        );
        expect(getFavorites()).toEqual(["icon1", "icon2"]);
      });

      it("returns empty array for invalid JSON", () => {
        localStorage.setItem("zdk-icon-generator:favorites", "invalid");
        expect(getFavorites()).toEqual([]);
      });

      it("returns empty array for non-array value", () => {
        localStorage.setItem(
          "zdk-icon-generator:favorites",
          JSON.stringify({ not: "array" })
        );
        expect(getFavorites()).toEqual([]);
      });
    });

    describe("addFavorite", () => {
      it("adds icon to empty favorites", () => {
        addFavorite("icon1");
        expect(getFavorites()).toEqual(["icon1"]);
      });

      it("adds icon to existing favorites", () => {
        addFavorite("icon1");
        addFavorite("icon2");
        expect(getFavorites()).toEqual(["icon1", "icon2"]);
      });

      it("does not duplicate existing favorite", () => {
        addFavorite("icon1");
        addFavorite("icon1");
        expect(getFavorites()).toEqual(["icon1"]);
      });
    });

    describe("removeFavorite", () => {
      it("removes icon from favorites", () => {
        addFavorite("icon1");
        addFavorite("icon2");
        removeFavorite("icon1");
        expect(getFavorites()).toEqual(["icon2"]);
      });

      it("handles removing non-existent icon", () => {
        addFavorite("icon1");
        removeFavorite("icon2");
        expect(getFavorites()).toEqual(["icon1"]);
      });

      it("handles removing from empty favorites", () => {
        removeFavorite("icon1");
        expect(getFavorites()).toEqual([]);
      });
    });

    describe("toggleFavorite", () => {
      it("adds icon when not favorite and returns true", () => {
        const result = toggleFavorite("icon1");
        expect(result).toBe(true);
        expect(isFavorite("icon1")).toBe(true);
      });

      it("removes icon when already favorite and returns false", () => {
        addFavorite("icon1");
        const result = toggleFavorite("icon1");
        expect(result).toBe(false);
        expect(isFavorite("icon1")).toBe(false);
      });
    });

    describe("isFavorite", () => {
      it("returns true for favorited icon", () => {
        addFavorite("icon1");
        expect(isFavorite("icon1")).toBe(true);
      });

      it("returns false for non-favorited icon", () => {
        expect(isFavorite("icon1")).toBe(false);
      });
    });
  });

  describe("recent icons", () => {
    describe("getRecentIcons", () => {
      it("returns empty array when no recent icons", () => {
        expect(getRecentIcons()).toEqual([]);
      });

      it("returns stored recent icons", () => {
        localStorage.setItem(
          "zdk-icon-generator:recent",
          JSON.stringify(["icon1", "icon2"])
        );
        expect(getRecentIcons()).toEqual(["icon1", "icon2"]);
      });
    });

    describe("addRecentIcon", () => {
      it("adds icon to front of recent list", () => {
        addRecentIcon("icon1");
        addRecentIcon("icon2");
        expect(getRecentIcons()).toEqual(["icon2", "icon1"]);
      });

      it("moves existing icon to front", () => {
        addRecentIcon("icon1");
        addRecentIcon("icon2");
        addRecentIcon("icon1");
        expect(getRecentIcons()).toEqual(["icon1", "icon2"]);
      });

      it("limits to 20 recent icons", () => {
        for (let i = 0; i < 25; i++) {
          addRecentIcon(`icon${i}`);
        }
        expect(getRecentIcons()).toHaveLength(20);
        // Most recent should be first
        expect(getRecentIcons()[0]).toBe("icon24");
      });
    });

    describe("clearRecentIcons", () => {
      it("clears all recent icons", () => {
        addRecentIcon("icon1");
        addRecentIcon("icon2");
        clearRecentIcons();
        expect(getRecentIcons()).toEqual([]);
      });
    });
  });

  describe("generator state", () => {
    const mockState: PersistedGeneratorState = {
      selectedLocations: ["top_bar"],
      selectedIconId: "test-icon",
      backgroundColor: "#ff0000",
      iconColor: "#ffffff",
      selectedPack: "zendesk",
      iconSize: 100,
      svgIconSize: 80,
    };

    describe("saveGeneratorState", () => {
      it("saves state to localStorage", () => {
        saveGeneratorState(mockState);
        const stored = localStorage.getItem("zdk-icon-generator:generator-state");
        expect(stored).not.toBeNull();
        expect(JSON.parse(stored!)).toEqual(mockState);
      });
    });

    describe("loadGeneratorState", () => {
      it("returns null when no state stored", () => {
        expect(loadGeneratorState()).toBeNull();
      });

      it("returns stored state", () => {
        saveGeneratorState(mockState);
        expect(loadGeneratorState()).toEqual(mockState);
      });

      it("returns null for invalid JSON", () => {
        localStorage.setItem("zdk-icon-generator:generator-state", "invalid");
        expect(loadGeneratorState()).toBeNull();
      });
    });

    describe("clearGeneratorState", () => {
      it("clears stored state", () => {
        saveGeneratorState(mockState);
        clearGeneratorState();
        expect(loadGeneratorState()).toBeNull();
      });
    });

    describe("gradient background persistence", () => {
      it("saves and loads gradient background", () => {
        const stateWithGradient: PersistedGeneratorState = {
          ...mockState,
          backgroundColor: {
            type: "linear",
            angle: 90,
            stops: [
              { color: "#ff0000", offset: 0 },
              { color: "#0000ff", offset: 100 },
            ],
          },
        };
        saveGeneratorState(stateWithGradient);
        const loaded = loadGeneratorState();
        expect(loaded?.backgroundColor).toEqual(stateWithGradient.backgroundColor);
      });
    });
  });
});

