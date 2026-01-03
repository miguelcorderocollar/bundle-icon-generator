import { describe, it, expect } from "vitest";
import { validateExport, type ExportValidation } from "../export-controller";
import type { IconGeneratorState } from "../../hooks/use-icon-generator";
import type { AppLocation } from "../../types/app-location";

describe("export-controller", () => {
  const createMockState = (
    overrides: Partial<IconGeneratorState> = {}
  ): IconGeneratorState => ({
    selectedLocations: [],
    selectedIconId: "test-icon",
    backgroundColor: "#063940",
    iconColor: "#ffffff",
    searchQuery: "",
    selectedPack: "all",
    iconSize: 123,
    svgIconSize: 123,
    ...overrides,
  });

  describe("validateExport", () => {
    it("returns valid when icon is selected", () => {
      const state = createMockState({ selectedIconId: "test-icon" });
      const locations: AppLocation[] = [];

      const result = validateExport(state, locations);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("returns invalid when no icon is selected", () => {
      const state = createMockState({ selectedIconId: undefined });
      const locations: AppLocation[] = [];

      const result = validateExport(state, locations);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("No icon selected");
    });

    it("warns when no locations are selected", () => {
      const state = createMockState();
      const locations: AppLocation[] = [];

      const result = validateExport(state, locations);

      expect(result.warnings).toContain(
        "No app locations selected - only default PNGs will be exported"
      );
    });

    it("does not warn about locations when locations are selected", () => {
      const state = createMockState();
      const locations: AppLocation[] = ["top_bar"];

      const result = validateExport(state, locations);

      expect(result.warnings).not.toContain(
        "No app locations selected - only default PNGs will be exported"
      );
    });

    it("warns about low contrast colors", () => {
      // Black background with dark gray icon - low contrast
      const state = createMockState({
        backgroundColor: "#000000",
        iconColor: "#333333",
      });
      const locations: AppLocation[] = [];

      const result = validateExport(state, locations);

      expect(result.warnings.some((w) => w.includes("contrast"))).toBe(true);
    });

    it("does not warn about high contrast colors", () => {
      // Dark background with white icon - high contrast
      const state = createMockState({
        backgroundColor: "#000000",
        iconColor: "#ffffff",
      });
      const locations: AppLocation[] = [];

      const result = validateExport(state, locations);

      expect(result.warnings.some((w) => w.includes("contrast"))).toBe(false);
    });

    it("handles gradient backgrounds for contrast check", () => {
      const state = createMockState({
        backgroundColor: {
          type: "linear",
          angle: 90,
          stops: [
            { color: "#000000", offset: 0 },
            { color: "#333333", offset: 100 },
          ],
        },
        iconColor: "#ffffff",
      });
      const locations: AppLocation[] = [];

      const result = validateExport(state, locations);

      // Should not throw and should return valid result
      expect(result.valid).toBe(true);
    });

    it("returns valid result structure", () => {
      const state = createMockState();
      const locations: AppLocation[] = [];

      const result = validateExport(state, locations);

      expect(result).toHaveProperty("valid");
      expect(result).toHaveProperty("errors");
      expect(result).toHaveProperty("warnings");
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it("accumulates multiple issues", () => {
      const state = createMockState({
        selectedIconId: undefined,
        backgroundColor: "#111111",
        iconColor: "#222222",
      });
      const locations: AppLocation[] = [];

      const result = validateExport(state, locations);

      // Should have error for no icon and warnings for locations + contrast
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    describe("color contrast edge cases", () => {
      it("detects low contrast with similar light colors", () => {
        const state = createMockState({
          backgroundColor: "#ffffff",
          iconColor: "#eeeeee",
        });

        const result = validateExport(state, []);

        expect(result.warnings.some((w) => w.includes("contrast"))).toBe(true);
      });

      it("accepts medium contrast colors", () => {
        const state = createMockState({
          backgroundColor: "#003366",
          iconColor: "#ffffff",
        });

        const result = validateExport(state, []);

        expect(result.warnings.some((w) => w.includes("contrast"))).toBe(false);
      });
    });
  });
});

