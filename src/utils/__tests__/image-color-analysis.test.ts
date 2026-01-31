/**
 * Tests for image color analysis utilities
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  analyzeImageColors,
  storeColorAnalysis,
  getColorAnalysis,
  storeColorOverride,
  getColorOverride,
  COLOR_ANALYSIS_SUFFIX,
  COLOR_OVERRIDE_SUFFIX,
  type ColorAnalysisResult,
} from "../image-color-analysis";

// Mock canvas and image for Node.js environment
function createMockCanvas(
  pixelData: number[]
): HTMLCanvasElement & { __pixelData: number[] } {
  const mockCanvas = {
    width: 0,
    height: 0,
    __pixelData: pixelData,
    getContext: vi.fn().mockReturnValue({
      drawImage: vi.fn(),
      getImageData: vi.fn().mockImplementation((_x, _y, _w, _h) => ({
        data: new Uint8ClampedArray(pixelData),
      })),
    }),
  } as unknown as HTMLCanvasElement & { __pixelData: number[] };
  return mockCanvas;
}

describe("image-color-analysis", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  describe("storeColorAnalysis and getColorAnalysis", () => {
    it("should store and retrieve color analysis result", () => {
      const imageId = "custom-image-123";
      const result: ColorAnalysisResult = {
        dominantColor: "#ff0000",
        uniformity: 0.85,
        hasUniformColor: true,
        pixelCount: 1000,
      };

      storeColorAnalysis(imageId, result);
      const retrieved = getColorAnalysis(imageId);

      expect(retrieved).toEqual(result);
    });

    it("should return null for non-existent image", () => {
      const result = getColorAnalysis("non-existent-id");
      expect(result).toBeNull();
    });

    it("should use correct storage key suffix", () => {
      const imageId = "custom-image-456";
      const result: ColorAnalysisResult = {
        dominantColor: "#00ff00",
        uniformity: 0.9,
        hasUniformColor: true,
        pixelCount: 500,
      };

      storeColorAnalysis(imageId, result);

      const storedValue = sessionStorage.getItem(
        imageId + COLOR_ANALYSIS_SUFFIX
      );
      expect(storedValue).not.toBeNull();
      expect(JSON.parse(storedValue!)).toEqual(result);
    });

    it("should handle invalid JSON gracefully", () => {
      const imageId = "custom-image-789";
      sessionStorage.setItem(imageId + COLOR_ANALYSIS_SUFFIX, "invalid json{");

      const result = getColorAnalysis(imageId);
      expect(result).toBeNull();
    });
  });

  describe("storeColorOverride and getColorOverride", () => {
    it("should store and retrieve color override", () => {
      const imageId = "custom-image-123";
      const overrideColor = "#ffffff";

      storeColorOverride(imageId, overrideColor);
      const retrieved = getColorOverride(imageId);

      expect(retrieved).toBe(overrideColor);
    });

    it("should return null for non-existent override", () => {
      const result = getColorOverride("non-existent-id");
      expect(result).toBeNull();
    });

    it("should remove override when set to null", () => {
      const imageId = "custom-image-456";

      storeColorOverride(imageId, "#ff0000");
      expect(getColorOverride(imageId)).toBe("#ff0000");

      storeColorOverride(imageId, null);
      expect(getColorOverride(imageId)).toBeNull();
    });

    it("should use correct storage key suffix", () => {
      const imageId = "custom-image-789";
      const overrideColor = "#0000ff";

      storeColorOverride(imageId, overrideColor);

      const storedValue = sessionStorage.getItem(
        imageId + COLOR_OVERRIDE_SUFFIX
      );
      expect(storedValue).toBe(overrideColor);
    });
  });

  describe("analyzeImageColors", () => {
    // We need to mock the Image and canvas APIs for these tests
    let originalCreateElement: typeof document.createElement;
    let originalImage: typeof Image;

    beforeEach(() => {
      originalCreateElement = document.createElement.bind(document);
      originalImage = global.Image;
    });

    afterEach(() => {
      document.createElement = originalCreateElement;
      global.Image = originalImage;
    });

    it("should detect uniform black color", async () => {
      // Create pixel data for a 2x2 image with all black pixels (RGBA)
      const blackPixels = [
        0,
        0,
        0,
        255, // pixel 1: black, fully opaque
        0,
        0,
        0,
        255, // pixel 2: black, fully opaque
        0,
        0,
        0,
        255, // pixel 3: black, fully opaque
        0,
        0,
        0,
        255, // pixel 4: black, fully opaque
      ];

      // Mock document.createElement to return our mock canvas
      vi.spyOn(document, "createElement").mockImplementation((tagName) => {
        if (tagName === "canvas") {
          return createMockCanvas(blackPixels);
        }
        return originalCreateElement(tagName);
      });

      // Mock Image
      class MockImage {
        width = 2;
        height = 2;
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        private _src = "";

        get src() {
          return this._src;
        }
        set src(value: string) {
          this._src = value;
          // Trigger onload asynchronously
          setTimeout(() => this.onload?.(), 0);
        }
      }
      global.Image = MockImage as unknown as typeof Image;

      const result = await analyzeImageColors("data:image/png;base64,test");

      expect(result.dominantColor).toBe("#000000");
      expect(result.uniformity).toBe(1); // All pixels are identical
      expect(result.hasUniformColor).toBe(true);
      expect(result.pixelCount).toBe(4);
    });

    it("should detect uniform white color", async () => {
      const whitePixels = [
        255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
        255, 255,
      ];

      vi.spyOn(document, "createElement").mockImplementation((tagName) => {
        if (tagName === "canvas") {
          return createMockCanvas(whitePixels);
        }
        return originalCreateElement(tagName);
      });

      class MockImage {
        width = 2;
        height = 2;
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        private _src = "";
        get src() {
          return this._src;
        }
        set src(value: string) {
          this._src = value;
          setTimeout(() => this.onload?.(), 0);
        }
      }
      global.Image = MockImage as unknown as typeof Image;

      const result = await analyzeImageColors("data:image/png;base64,test");

      expect(result.dominantColor).toBe("#ffffff");
      expect(result.uniformity).toBe(1);
      expect(result.hasUniformColor).toBe(true);
    });

    it("should ignore transparent pixels", async () => {
      // Mix of opaque black and transparent pixels
      const mixedPixels = [
        0,
        0,
        0,
        255, // black, opaque
        0,
        0,
        0,
        0, // transparent (should be ignored)
        0,
        0,
        0,
        255, // black, opaque
        255,
        255,
        255,
        0, // white but transparent (should be ignored)
      ];

      vi.spyOn(document, "createElement").mockImplementation((tagName) => {
        if (tagName === "canvas") {
          return createMockCanvas(mixedPixels);
        }
        return originalCreateElement(tagName);
      });

      class MockImage {
        width = 2;
        height = 2;
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        private _src = "";
        get src() {
          return this._src;
        }
        set src(value: string) {
          this._src = value;
          setTimeout(() => this.onload?.(), 0);
        }
      }
      global.Image = MockImage as unknown as typeof Image;

      const result = await analyzeImageColors("data:image/png;base64,test");

      expect(result.dominantColor).toBe("#000000");
      expect(result.pixelCount).toBe(2); // Only 2 opaque pixels
      expect(result.uniformity).toBe(1); // Both opaque pixels are black
      expect(result.hasUniformColor).toBe(true);
    });

    it("should detect non-uniform colors", async () => {
      // Half red, half blue pixels
      const mixedColorPixels = [
        255,
        0,
        0,
        255, // red
        255,
        0,
        0,
        255, // red
        0,
        0,
        255,
        255, // blue
        0,
        0,
        255,
        255, // blue
      ];

      vi.spyOn(document, "createElement").mockImplementation((tagName) => {
        if (tagName === "canvas") {
          return createMockCanvas(mixedColorPixels);
        }
        return originalCreateElement(tagName);
      });

      class MockImage {
        width = 2;
        height = 2;
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        private _src = "";
        get src() {
          return this._src;
        }
        set src(value: string) {
          this._src = value;
          setTimeout(() => this.onload?.(), 0);
        }
      }
      global.Image = MockImage as unknown as typeof Image;

      const result = await analyzeImageColors("data:image/png;base64,test");

      // Average of red (255,0,0) and blue (0,0,255) would be purple-ish (127,0,127)
      // Neither red nor blue pixels are within 50 distance of the average
      expect(result.uniformity).toBeLessThan(0.6);
      expect(result.hasUniformColor).toBe(false);
      expect(result.pixelCount).toBe(4);
    });

    it("should handle fully transparent image", async () => {
      const transparentPixels = [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      ];

      vi.spyOn(document, "createElement").mockImplementation((tagName) => {
        if (tagName === "canvas") {
          return createMockCanvas(transparentPixels);
        }
        return originalCreateElement(tagName);
      });

      class MockImage {
        width = 2;
        height = 2;
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        private _src = "";
        get src() {
          return this._src;
        }
        set src(value: string) {
          this._src = value;
          setTimeout(() => this.onload?.(), 0);
        }
      }
      global.Image = MockImage as unknown as typeof Image;

      const result = await analyzeImageColors("data:image/png;base64,test");

      expect(result.pixelCount).toBe(0);
      expect(result.hasUniformColor).toBe(false);
      expect(result.uniformity).toBe(0);
    });

    it("should reject on image load error", async () => {
      class MockImage {
        width = 0;
        height = 0;
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        private _src = "";
        get src() {
          return this._src;
        }
        set src(value: string) {
          this._src = value;
          // Trigger error instead of load
          setTimeout(() => this.onerror?.(), 0);
        }
      }
      global.Image = MockImage as unknown as typeof Image;

      await expect(
        analyzeImageColors("data:image/png;base64,invalid")
      ).rejects.toThrow("Failed to load image for color analysis");
    });

    it("should handle similar but not identical colors as uniform", async () => {
      // Slightly different shades of black (within threshold)
      const similarBlackPixels = [
        0,
        0,
        0,
        255, // pure black
        5,
        5,
        5,
        255, // very dark gray
        10,
        10,
        10,
        255, // slightly lighter
        15,
        15,
        15,
        255, // still very dark
      ];

      vi.spyOn(document, "createElement").mockImplementation((tagName) => {
        if (tagName === "canvas") {
          return createMockCanvas(similarBlackPixels);
        }
        return originalCreateElement(tagName);
      });

      class MockImage {
        width = 2;
        height = 2;
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        private _src = "";
        get src() {
          return this._src;
        }
        set src(value: string) {
          this._src = value;
          setTimeout(() => this.onload?.(), 0);
        }
      }
      global.Image = MockImage as unknown as typeof Image;

      const result = await analyzeImageColors("data:image/png;base64,test");

      // All pixels should be within the color distance threshold of the average
      expect(result.uniformity).toBeGreaterThanOrEqual(0.6);
      expect(result.hasUniformColor).toBe(true);
    });
  });

  describe("ColorAnalysisResult type", () => {
    it("should correctly represent uniform color result", () => {
      const result: ColorAnalysisResult = {
        dominantColor: "#1a1a1a",
        uniformity: 0.95,
        hasUniformColor: true,
        pixelCount: 10000,
      };

      expect(result.dominantColor).toMatch(/^#[0-9a-f]{6}$/);
      expect(result.uniformity).toBeGreaterThanOrEqual(0);
      expect(result.uniformity).toBeLessThanOrEqual(1);
      expect(typeof result.hasUniformColor).toBe("boolean");
      expect(typeof result.pixelCount).toBe("number");
    });
  });
});
