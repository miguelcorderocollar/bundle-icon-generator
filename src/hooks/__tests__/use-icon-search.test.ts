import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { IconMetadata } from "../../types/icon";

// Create mock data factory (must be defined before mocks since mocks are hoisted)
const createMockIcons = () => ({
  "zendesk-arrow-left": {
    id: "zendesk-arrow-left",
    name: "Arrow Left",
    pack: "zendesk",
    tags: ["arrow", "navigation", "left"],
    svg: "<svg></svg>",
  },
  "zendesk-arrow-right": {
    id: "zendesk-arrow-right",
    name: "Arrow Right",
    pack: "zendesk",
    tags: ["arrow", "navigation", "right"],
    svg: "<svg></svg>",
  },
  "feather-check": {
    id: "feather-check",
    name: "Check",
    pack: "feather",
    tags: ["check", "done", "success"],
    svg: "<svg></svg>",
  },
  "feather-x": {
    id: "feather-x",
    name: "X",
    pack: "feather",
    tags: ["close", "remove", "delete"],
    svg: "<svg></svg>",
  },
} as Record<string, IconMetadata>);

// Mock the icon catalog
vi.mock("../../utils/icon-catalog", () => {
  const mockIcons = {
    "zendesk-arrow-left": {
      id: "zendesk-arrow-left",
      name: "Arrow Left",
      pack: "zendesk",
      tags: ["arrow", "navigation", "left"],
      svg: "<svg></svg>",
    },
    "zendesk-arrow-right": {
      id: "zendesk-arrow-right",
      name: "Arrow Right",
      pack: "zendesk",
      tags: ["arrow", "navigation", "right"],
      svg: "<svg></svg>",
    },
    "feather-check": {
      id: "feather-check",
      name: "Check",
      pack: "feather",
      tags: ["check", "done", "success"],
      svg: "<svg></svg>",
    },
    "feather-x": {
      id: "feather-x",
      name: "X",
      pack: "feather",
      tags: ["close", "remove", "delete"],
      svg: "<svg></svg>",
    },
  };

  return {
    loadIconCatalog: vi.fn().mockResolvedValue({
      icons: mockIcons,
    }),
    searchIcons: vi.fn().mockImplementation(async (query: string) => {
      const queryLower = query.toLowerCase();
      return Object.values(mockIcons).filter(
        (icon) =>
          icon.name.toLowerCase().includes(queryLower) ||
          icon.tags.some((tag: string) => tag.toLowerCase().includes(queryLower))
      );
    }),
    filterIconsByPack: vi.fn().mockImplementation(async (icons: IconMetadata[], pack: string) => {
      return icons.filter((icon) => icon.pack === pack);
    }),
    filterIconsByCategory: vi.fn().mockImplementation((icons: IconMetadata[]) => icons),
  };
});

// Mock emoji catalog
vi.mock("../../utils/emoji-catalog", () => ({
  getUserEmojis: vi.fn().mockReturnValue([]),
}));

// Mock local storage utilities
vi.mock("../../utils/local-storage", () => ({
  getFavorites: vi.fn().mockReturnValue([]),
  getRecentIcons: vi.fn().mockReturnValue([]),
}));

// Import after mocks
import { useIconSearch } from "../use-icon-search";

describe("useIconSearch", () => {
  const mockIcons = createMockIcons();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("initial loading", () => {
    it("starts in loading state", () => {
      const { result } = renderHook(() =>
        useIconSearch({
          searchQuery: "",
          selectedPack: "all",
        })
      );

      expect(result.current.isLoading).toBe(true);
    });

    it("loads all icons when no query", async () => {
      const { result } = renderHook(() =>
        useIconSearch({
          searchQuery: "",
          selectedPack: "all",
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.icons.length).toBe(Object.keys(mockIcons).length);
      expect(result.current.error).toBeNull();
    });
  });

  describe("search filtering", () => {
    it("filters icons by search query", async () => {
      const { result } = renderHook(() =>
        useIconSearch({
          searchQuery: "arrow",
          selectedPack: "all",
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should find arrow icons
      expect(result.current.icons.length).toBeGreaterThan(0);
      expect(result.current.icons.every((icon) => 
        icon.name.toLowerCase().includes("arrow") ||
        icon.tags.some((tag) => tag.toLowerCase().includes("arrow"))
      )).toBe(true);
    });

    it("returns empty for non-matching query", async () => {
      const { result } = renderHook(() =>
        useIconSearch({
          searchQuery: "xyznonexistent",
          selectedPack: "all",
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.icons.length).toBe(0);
    });
  });

  describe("pack filtering", () => {
    it("filters icons by pack", async () => {
      const { result } = renderHook(() =>
        useIconSearch({
          searchQuery: "",
          selectedPack: "zendesk",
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.icons.every((icon) => icon.pack === "zendesk")).toBe(true);
    });

    it("shows all packs when 'all' is selected", async () => {
      const { result } = renderHook(() =>
        useIconSearch({
          searchQuery: "",
          selectedPack: "all",
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const packs = new Set(result.current.icons.map((icon) => icon.pack));
      expect(packs.size).toBeGreaterThan(1);
    });
  });

  describe("sorting", () => {
    it("sorts by name by default", async () => {
      const { result } = renderHook(() =>
        useIconSearch({
          searchQuery: "",
          selectedPack: "all",
          sortBy: "name",
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const names = result.current.icons.map((icon) => icon.name);
      const sortedNames = [...names].sort((a, b) => a.localeCompare(b));
      expect(names).toEqual(sortedNames);
    });

    it("sorts by pack", async () => {
      const { result } = renderHook(() =>
        useIconSearch({
          searchQuery: "",
          selectedPack: "all",
          sortBy: "pack",
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const packs = result.current.icons.map((icon) => icon.pack);
      const sortedPacks = [...packs].sort((a, b) => a.localeCompare(b));
      expect(packs).toEqual(sortedPacks);
    });
  });

  describe("error handling", () => {
    it("returns null error on success", async () => {
      const { result } = renderHook(() =>
        useIconSearch({
          searchQuery: "",
          selectedPack: "all",
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe("result structure", () => {
    it("returns icons, isLoading, and error", async () => {
      const { result } = renderHook(() =>
        useIconSearch({
          searchQuery: "",
          selectedPack: "all",
        })
      );

      expect(result.current).toHaveProperty("icons");
      expect(result.current).toHaveProperty("isLoading");
      expect(result.current).toHaveProperty("error");
      expect(Array.isArray(result.current.icons)).toBe(true);
    });
  });
});
