import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useConfigImportExport } from "../use-config-import-export";
import type { RestrictionConfig } from "../../types/restriction";

// Mock restriction codec
vi.mock("../../utils/restriction-codec", () => ({
  decodeRestrictionConfig: vi.fn(),
  RESTRICTION_URL_PARAM: "restrict",
}));

// Mock type guard
vi.mock("../../types/restriction", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as object),
    isRestrictionConfig: vi.fn().mockReturnValue(true),
  };
});

import { decodeRestrictionConfig } from "../../utils/restriction-codec";

describe("useConfigImportExport", () => {
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
  let onImportSuccess: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    config = createDefaultConfig();
    setConfig = vi.fn();
    onImportSuccess = vi.fn();
    vi.clearAllMocks();
  });

  describe("initial state", () => {
    it("has URL import dialog closed", () => {
      const { result } = renderHook(() =>
        useConfigImportExport(config, setConfig, onImportSuccess)
      );

      expect(result.current.showUrlImport).toBe(false);
      expect(result.current.urlImportValue).toBe("");
      expect(result.current.urlImportError).toBeNull();
    });

    it("provides a file input ref", () => {
      const { result } = renderHook(() =>
        useConfigImportExport(config, setConfig, onImportSuccess)
      );

      expect(result.current.fileInputRef).toBeDefined();
    });
  });

  describe("URL import dialog", () => {
    it("openUrlImport opens dialog and clears state", () => {
      const { result } = renderHook(() =>
        useConfigImportExport(config, setConfig, onImportSuccess)
      );

      act(() => {
        result.current.openUrlImport();
      });

      expect(result.current.showUrlImport).toBe(true);
      expect(result.current.urlImportValue).toBe("");
      expect(result.current.urlImportError).toBeNull();
    });

    it("closeUrlImport closes dialog and clears state", () => {
      const { result } = renderHook(() =>
        useConfigImportExport(config, setConfig, onImportSuccess)
      );

      act(() => {
        result.current.openUrlImport();
        result.current.setUrlImportValue("https://example.com");
      });

      act(() => {
        result.current.closeUrlImport();
      });

      expect(result.current.showUrlImport).toBe(false);
      expect(result.current.urlImportValue).toBe("");
    });

    it("setUrlImportValue updates value", () => {
      const { result } = renderHook(() =>
        useConfigImportExport(config, setConfig, onImportSuccess)
      );

      act(() => {
        result.current.setUrlImportValue("https://example.com/?restrict=abc");
      });

      expect(result.current.urlImportValue).toBe(
        "https://example.com/?restrict=abc"
      );
    });
  });

  describe("importFromUrl", () => {
    it("shows error for empty URL", () => {
      const { result } = renderHook(() =>
        useConfigImportExport(config, setConfig, onImportSuccess)
      );

      act(() => {
        result.current.openUrlImport();
      });

      act(() => {
        result.current.importFromUrl();
      });

      expect(result.current.urlImportError).toBe("Please enter a URL");
      expect(setConfig).not.toHaveBeenCalled();
    });

    it("shows error for URL without restrict param", () => {
      const { result } = renderHook(() =>
        useConfigImportExport(config, setConfig, onImportSuccess)
      );

      act(() => {
        result.current.openUrlImport();
        result.current.setUrlImportValue("https://example.com/");
      });

      act(() => {
        result.current.importFromUrl();
      });

      expect(result.current.urlImportError).toContain(
        "No restriction config found"
      );
      expect(setConfig).not.toHaveBeenCalled();
    });

    it("shows error for invalid config", () => {
      vi.mocked(decodeRestrictionConfig).mockReturnValue(null);

      const { result } = renderHook(() =>
        useConfigImportExport(config, setConfig, onImportSuccess)
      );

      act(() => {
        result.current.openUrlImport();
        result.current.setUrlImportValue(
          "https://example.com/?restrict=invalid"
        );
      });

      act(() => {
        result.current.importFromUrl();
      });

      expect(result.current.urlImportError).toContain(
        "Invalid restriction config"
      );
      expect(setConfig).not.toHaveBeenCalled();
    });

    it("imports valid config and closes dialog", () => {
      const decodedConfig: RestrictionConfig = {
        version: 1,
        styles: [
          { name: "Imported", backgroundColor: "#000", iconColor: "#fff" },
        ],
      };
      vi.mocked(decodeRestrictionConfig).mockReturnValue(decodedConfig);

      const { result } = renderHook(() =>
        useConfigImportExport(config, setConfig, onImportSuccess)
      );

      act(() => {
        result.current.openUrlImport();
        result.current.setUrlImportValue("https://example.com/?restrict=valid");
      });

      act(() => {
        result.current.importFromUrl();
      });

      expect(setConfig).toHaveBeenCalledWith(decodedConfig);
      expect(onImportSuccess).toHaveBeenCalled();
      expect(result.current.showUrlImport).toBe(false);
      expect(result.current.urlImportValue).toBe("");
    });
  });

  describe("exportConfig", () => {
    it("creates download link", () => {
      // Mock URL and document methods
      const createObjectURLSpy = vi
        .spyOn(URL, "createObjectURL")
        .mockReturnValue("blob:test");
      const revokeObjectURLSpy = vi
        .spyOn(URL, "revokeObjectURL")
        .mockImplementation(() => {});
      const appendChildSpy = vi
        .spyOn(document.body, "appendChild")
        .mockImplementation(() => document.createElement("a"));
      const removeChildSpy = vi
        .spyOn(document.body, "removeChild")
        .mockImplementation(() => document.createElement("a"));

      const { result } = renderHook(() =>
        useConfigImportExport(config, setConfig, onImportSuccess)
      );

      act(() => {
        result.current.exportConfig();
      });

      expect(createObjectURLSpy).toHaveBeenCalled();
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalled();

      createObjectURLSpy.mockRestore();
      revokeObjectURLSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });
  });
});
