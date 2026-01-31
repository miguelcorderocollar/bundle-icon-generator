import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useShareConfig } from "../use-share-config";

// Mock local storage utilities
vi.mock("../../utils/local-storage", () => ({
  loadAdminConfig: vi.fn().mockReturnValue(null),
  saveAdminConfig: vi.fn(),
}));

// Mock restriction codec
vi.mock("../../utils/restriction-codec", () => ({
  encodeRestrictionConfig: vi.fn().mockReturnValue("encoded-restriction"),
  encodePresetConfig: vi.fn().mockReturnValue("encoded-preset"),
  RESTRICTION_URL_PARAM: "restrict",
  CONFIG_URL_PARAM: "config",
}));

describe("useShareConfig", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("initial state", () => {
    it("returns default config and state", async () => {
      const { result } = renderHook(() => useShareConfig());

      expect(result.current.shareMode).toBe("restricted");
      expect(result.current.config.version).toBe(1);
      expect(result.current.config.styles).toHaveLength(1);
      expect(result.current.config.styles[0].name).toBe("Zendesk Default");
    });

    it("provides action functions", () => {
      const { result } = renderHook(() => useShareConfig());

      expect(typeof result.current.setConfig).toBe("function");
      expect(typeof result.current.setShareMode).toBe("function");
      expect(typeof result.current.resetEditingState).toBe("function");
    });

    it("generates a URL", async () => {
      const { result } = renderHook(() => useShareConfig());

      await waitFor(() => {
        expect(result.current.generatedUrl).toContain("http://localhost");
      });
    });
  });

  describe("actions", () => {
    it("setShareMode updates mode", () => {
      const { result } = renderHook(() => useShareConfig());

      act(() => {
        result.current.setShareMode("import");
      });

      expect(result.current.shareMode).toBe("import");
    });

    it("setConfig updates config", () => {
      const { result } = renderHook(() => useShareConfig());

      act(() => {
        result.current.setConfig({
          version: 1,
          styles: [
            {
              name: "Custom Style",
              backgroundColor: "#ff0000",
              iconColor: "#00ff00",
            },
          ],
        });
      });

      expect(result.current.config.styles[0].name).toBe("Custom Style");
      expect(result.current.config.styles[0].backgroundColor).toBe("#ff0000");
    });
  });

  describe("URL generation", () => {
    it("generates restricted URL in restricted mode", async () => {
      const { result } = renderHook(() => useShareConfig());

      await waitFor(() => {
        expect(result.current.generatedUrl).toContain("restrict=");
      });
    });

    it("generates import URL in import mode", async () => {
      const { result } = renderHook(() => useShareConfig());

      act(() => {
        result.current.setShareMode("import");
      });

      await waitFor(() => {
        expect(result.current.generatedUrl).toContain("config=");
      });
    });
  });

  describe("initialization", () => {
    it("becomes initialized after mount", async () => {
      const { result } = renderHook(() => useShareConfig());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });
    });
  });
});
