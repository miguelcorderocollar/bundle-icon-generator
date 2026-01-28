/**
 * Tests for restriction-codec utilities
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  encodeRestrictionConfig,
  decodeRestrictionConfig,
  buildRestrictedUrl,
  RESTRICTION_URL_PARAM,
} from "../restriction-codec";
import type { RestrictionConfig } from "@/src/types/restriction";

describe("restriction-codec", () => {
  const validConfig: RestrictionConfig = {
    version: 1,
    styles: [
      {
        name: "Zendesk Default",
        backgroundColor: "#063940",
        iconColor: "#ffffff",
      },
    ],
    allowedIconPacks: ["garden", "feather"],
  };

  const configWithGradient: RestrictionConfig = {
    version: 1,
    styles: [
      {
        name: "Gradient Style",
        backgroundColor: {
          type: "linear",
          angle: 135,
          stops: [
            { color: "#0ea5e9", offset: 0 },
            { color: "#0284c7", offset: 100 },
          ],
        },
        iconColor: "#ffffff",
      },
    ],
  };

  describe("encodeRestrictionConfig", () => {
    it("should encode a valid config to a string", () => {
      const encoded = encodeRestrictionConfig(validConfig);
      expect(typeof encoded).toBe("string");
      expect(encoded.length).toBeGreaterThan(0);
    });

    it("should produce URL-safe output (no +, /, or =)", () => {
      const encoded = encodeRestrictionConfig(validConfig);
      expect(encoded).not.toMatch(/[+/=]/);
    });

    it("should encode configs with gradients", () => {
      const encoded = encodeRestrictionConfig(configWithGradient);
      expect(typeof encoded).toBe("string");
      expect(encoded.length).toBeGreaterThan(0);
    });
  });

  describe("decodeRestrictionConfig", () => {
    it("should decode a valid encoded config", () => {
      const encoded = encodeRestrictionConfig(validConfig);
      const decoded = decodeRestrictionConfig(encoded);

      expect(decoded).not.toBeNull();
      expect(decoded?.version).toBe(1);
      expect(decoded?.styles).toHaveLength(1);
      expect(decoded?.styles[0].name).toBe("Zendesk Default");
      expect(decoded?.styles[0].backgroundColor).toBe("#063940");
      expect(decoded?.styles[0].iconColor).toBe("#ffffff");
      expect(decoded?.allowedIconPacks).toEqual(["garden", "feather"]);
    });

    it("should decode configs with gradients", () => {
      const encoded = encodeRestrictionConfig(configWithGradient);
      const decoded = decodeRestrictionConfig(encoded);

      expect(decoded).not.toBeNull();
      expect(decoded?.styles[0].backgroundColor).toEqual({
        type: "linear",
        angle: 135,
        stops: [
          { color: "#0ea5e9", offset: 0 },
          { color: "#0284c7", offset: 100 },
        ],
      });
    });

    it("should return null for invalid base64", () => {
      const decoded = decodeRestrictionConfig("not-valid-base64!!!");
      expect(decoded).toBeNull();
    });

    it("should return null for valid base64 but invalid JSON", () => {
      const invalidJson = btoa("not json");
      const decoded = decodeRestrictionConfig(invalidJson);
      expect(decoded).toBeNull();
    });

    it("should return null for valid JSON but invalid config structure", () => {
      const invalidConfig = btoa(JSON.stringify({ foo: "bar" }));
      const decoded = decodeRestrictionConfig(invalidConfig);
      expect(decoded).toBeNull();
    });

    it("should return null for config with wrong version", () => {
      const wrongVersion = btoa(
        JSON.stringify({
          version: 2,
          styles: [
            { name: "Test", backgroundColor: "#000", iconColor: "#fff" },
          ],
        })
      );
      const decoded = decodeRestrictionConfig(wrongVersion);
      expect(decoded).toBeNull();
    });

    it("should return null for config with empty styles array", () => {
      const emptyStyles = btoa(JSON.stringify({ version: 1, styles: [] }));
      const decoded = decodeRestrictionConfig(emptyStyles);
      expect(decoded).toBeNull();
    });
  });

  describe("roundtrip encode/decode", () => {
    it("should preserve config through encode/decode cycle", () => {
      const encoded = encodeRestrictionConfig(validConfig);
      const decoded = decodeRestrictionConfig(encoded);

      expect(decoded).toEqual(validConfig);
    });

    it("should preserve gradient config through encode/decode cycle", () => {
      const encoded = encodeRestrictionConfig(configWithGradient);
      const decoded = decodeRestrictionConfig(encoded);

      expect(decoded).toEqual(configWithGradient);
    });

    it("should handle config with multiple styles", () => {
      const multiStyle: RestrictionConfig = {
        version: 1,
        styles: [
          { name: "Style 1", backgroundColor: "#000000", iconColor: "#ffffff" },
          { name: "Style 2", backgroundColor: "#ffffff", iconColor: "#000000" },
          { name: "Style 3", backgroundColor: "#ff0000", iconColor: "#00ff00" },
        ],
      };

      const encoded = encodeRestrictionConfig(multiStyle);
      const decoded = decodeRestrictionConfig(encoded);

      expect(decoded).toEqual(multiStyle);
    });
  });

  describe("buildRestrictedUrl", () => {
    beforeEach(() => {
      // Mock window.location
      vi.stubGlobal("window", {
        location: {
          origin: "https://example.com",
          pathname: "/",
        },
      });
    });

    it("should build a URL with the restriction param", () => {
      const url = buildRestrictedUrl(validConfig);
      expect(url).toContain(RESTRICTION_URL_PARAM);
      expect(url).toContain("https://example.com");
    });

    it("should use provided baseUrl when given", () => {
      const url = buildRestrictedUrl(validConfig, "https://custom.com/app");
      expect(url).toContain("https://custom.com");
    });

    it("should produce a URL that can be parsed", () => {
      const url = buildRestrictedUrl(validConfig);
      const parsed = new URL(url);
      const encoded = parsed.searchParams.get(RESTRICTION_URL_PARAM);

      expect(encoded).not.toBeNull();
      const decoded = decodeRestrictionConfig(encoded!);
      expect(decoded).toEqual(validConfig);
    });
  });
});
