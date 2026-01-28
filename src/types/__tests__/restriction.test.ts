/**
 * Tests for restriction type guards
 */

import { describe, it, expect } from "vitest";
import {
  isRestrictedStyle,
  isRestrictedExportPreset,
  isRestrictionConfig,
  isValidIconPack,
  createDefaultRestrictionConfig,
} from "../restriction";

describe("restriction type guards", () => {
  describe("isRestrictedStyle", () => {
    it("should return true for valid style with solid color", () => {
      const style = {
        name: "Test",
        backgroundColor: "#063940",
        iconColor: "#ffffff",
      };
      expect(isRestrictedStyle(style)).toBe(true);
    });

    it("should return true for valid style with gradient", () => {
      const style = {
        name: "Gradient",
        backgroundColor: {
          type: "linear",
          angle: 135,
          stops: [
            { color: "#0ea5e9", offset: 0 },
            { color: "#0284c7", offset: 100 },
          ],
        },
        iconColor: "#ffffff",
      };
      expect(isRestrictedStyle(style)).toBe(true);
    });

    it("should return false for null", () => {
      expect(isRestrictedStyle(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isRestrictedStyle(undefined)).toBe(false);
    });

    it("should return false for missing name", () => {
      expect(
        isRestrictedStyle({ backgroundColor: "#000", iconColor: "#fff" })
      ).toBe(false);
    });

    it("should return false for empty name", () => {
      expect(
        isRestrictedStyle({
          name: "",
          backgroundColor: "#000",
          iconColor: "#fff",
        })
      ).toBe(false);
    });

    it("should return false for missing backgroundColor", () => {
      expect(isRestrictedStyle({ name: "Test", iconColor: "#fff" })).toBe(
        false
      );
    });

    it("should return false for missing iconColor", () => {
      expect(isRestrictedStyle({ name: "Test", backgroundColor: "#000" })).toBe(
        false
      );
    });
  });

  describe("isValidIconPack", () => {
    it("should return true for valid icon packs", () => {
      expect(isValidIconPack("all")).toBe(true);
      expect(isValidIconPack("garden")).toBe(true);
      expect(isValidIconPack("feather")).toBe(true);
      expect(isValidIconPack("remixicon")).toBe(true);
      expect(isValidIconPack("emoji")).toBe(true);
      expect(isValidIconPack("custom-svg")).toBe(true);
      expect(isValidIconPack("custom-image")).toBe(true);
      expect(isValidIconPack("canvas")).toBe(true);
    });

    it("should return false for invalid pack names", () => {
      expect(isValidIconPack("invalid")).toBe(false);
      expect(isValidIconPack("")).toBe(false);
      expect(isValidIconPack("fontawesome")).toBe(false);
    });

    it("should return false for non-strings", () => {
      expect(isValidIconPack(null)).toBe(false);
      expect(isValidIconPack(undefined)).toBe(false);
      expect(isValidIconPack(123)).toBe(false);
      expect(isValidIconPack({})).toBe(false);
    });
  });

  describe("isRestrictedExportPreset", () => {
    it("should return true for valid preset referencing built-in", () => {
      const preset = {
        id: "zendesk-app",
        name: "Zendesk App",
        description: "Icon bundle for Zendesk marketplace apps",
      };
      expect(isRestrictedExportPreset(preset)).toBe(true);
    });

    it("should return true for valid preset with custom variants", () => {
      const preset = {
        id: "custom-preset",
        name: "Custom Preset",
        variants: [
          { filename: "icon.png", width: 256, height: 256, format: "png" },
        ],
      };
      expect(isRestrictedExportPreset(preset)).toBe(true);
    });

    it("should return false for missing id", () => {
      expect(isRestrictedExportPreset({ name: "Test" })).toBe(false);
    });

    it("should return false for missing name", () => {
      expect(isRestrictedExportPreset({ id: "test" })).toBe(false);
    });

    it("should return false for empty id", () => {
      expect(isRestrictedExportPreset({ id: "", name: "Test" })).toBe(false);
    });

    it("should return false for empty name", () => {
      expect(isRestrictedExportPreset({ id: "test", name: "" })).toBe(false);
    });

    it("should return false for invalid variants", () => {
      expect(
        isRestrictedExportPreset({
          id: "test",
          name: "Test",
          variants: [{ invalid: true }],
        })
      ).toBe(false);
    });

    it("should return false for non-array variants", () => {
      expect(
        isRestrictedExportPreset({
          id: "test",
          name: "Test",
          variants: "invalid",
        })
      ).toBe(false);
    });

    it("should return false for null", () => {
      expect(isRestrictedExportPreset(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isRestrictedExportPreset(undefined)).toBe(false);
    });
  });

  describe("isRestrictionConfig", () => {
    it("should return true for valid config", () => {
      const config = {
        version: 1,
        styles: [
          {
            name: "Test",
            backgroundColor: "#063940",
            iconColor: "#ffffff",
          },
        ],
      };
      expect(isRestrictionConfig(config)).toBe(true);
    });

    it("should return true for config with allowedIconPacks", () => {
      const config = {
        version: 1,
        styles: [
          {
            name: "Test",
            backgroundColor: "#063940",
            iconColor: "#ffffff",
          },
        ],
        allowedIconPacks: ["garden", "feather"],
      };
      expect(isRestrictionConfig(config)).toBe(true);
    });

    it("should return true for config with allowedExportPresets", () => {
      const config = {
        version: 1,
        styles: [
          {
            name: "Test",
            backgroundColor: "#063940",
            iconColor: "#ffffff",
          },
        ],
        allowedExportPresets: [
          { id: "zendesk-app", name: "Zendesk App" },
          { id: "favicon-bundle", name: "Favicon Bundle" },
        ],
      };
      expect(isRestrictionConfig(config)).toBe(true);
    });

    it("should return false for invalid allowedExportPresets entry", () => {
      const config = {
        version: 1,
        styles: [
          {
            name: "Test",
            backgroundColor: "#063940",
            iconColor: "#ffffff",
          },
        ],
        allowedExportPresets: [{ invalid: true }],
      };
      expect(isRestrictionConfig(config)).toBe(false);
    });

    it("should return false for non-array allowedExportPresets", () => {
      const config = {
        version: 1,
        styles: [
          {
            name: "Test",
            backgroundColor: "#063940",
            iconColor: "#ffffff",
          },
        ],
        allowedExportPresets: "zendesk-app",
      };
      expect(isRestrictionConfig(config)).toBe(false);
    });

    it("should return false for wrong version", () => {
      const config = {
        version: 2,
        styles: [
          {
            name: "Test",
            backgroundColor: "#063940",
            iconColor: "#ffffff",
          },
        ],
      };
      expect(isRestrictionConfig(config)).toBe(false);
    });

    it("should return false for empty styles array", () => {
      const config = {
        version: 1,
        styles: [],
      };
      expect(isRestrictionConfig(config)).toBe(false);
    });

    it("should return false for invalid style in array", () => {
      const config = {
        version: 1,
        styles: [{ invalid: true }],
      };
      expect(isRestrictionConfig(config)).toBe(false);
    });

    it("should return false for invalid allowedIconPacks entry", () => {
      const config = {
        version: 1,
        styles: [
          {
            name: "Test",
            backgroundColor: "#063940",
            iconColor: "#ffffff",
          },
        ],
        allowedIconPacks: ["garden", "invalid-pack"],
      };
      expect(isRestrictionConfig(config)).toBe(false);
    });

    it("should return false for non-array allowedIconPacks", () => {
      const config = {
        version: 1,
        styles: [
          {
            name: "Test",
            backgroundColor: "#063940",
            iconColor: "#ffffff",
          },
        ],
        allowedIconPacks: "garden",
      };
      expect(isRestrictionConfig(config)).toBe(false);
    });

    it("should return false for null", () => {
      expect(isRestrictionConfig(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isRestrictionConfig(undefined)).toBe(false);
    });
  });

  describe("createDefaultRestrictionConfig", () => {
    it("should create a valid config", () => {
      const config = createDefaultRestrictionConfig();
      expect(isRestrictionConfig(config)).toBe(true);
    });

    it("should have version 1", () => {
      const config = createDefaultRestrictionConfig();
      expect(config.version).toBe(1);
    });

    it("should have at least one style", () => {
      const config = createDefaultRestrictionConfig();
      expect(config.styles.length).toBeGreaterThanOrEqual(1);
    });

    it("should have undefined allowedIconPacks by default", () => {
      const config = createDefaultRestrictionConfig();
      expect(config.allowedIconPacks).toBeUndefined();
    });
  });
});
