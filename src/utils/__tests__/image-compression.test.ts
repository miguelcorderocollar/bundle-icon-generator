/**
 * Tests for image compression utility
 *
 * Note: Only JPEG and WebP are supported for max size compression.
 * PNG is not supported because it's lossless.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { compressToMaxSize } from "../image-compression";

// Mock canvas.toBlob since jsdom doesn't implement it properly
const mockToBlob = vi.fn();

describe("image-compression", () => {
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    // Create a mock canvas
    canvas = document.createElement("canvas");
    canvas.width = 100;
    canvas.height = 100;

    // Override toBlob
    canvas.toBlob = mockToBlob;
    mockToBlob.mockReset();
  });

  describe("compressToMaxSize", () => {
    it("should return blob immediately if under target size", async () => {
      const smallBlob = new Blob(["small"], { type: "image/jpeg" });

      mockToBlob.mockImplementation((callback) => {
        callback(smallBlob);
      });

      const result = await compressToMaxSize({
        targetMaxBytes: 1000,
        format: "jpeg",
        initialQuality: 0.92,
        canvas,
      });

      expect(result.blob).toBe(smallBlob);
      expect(result.targetAchieved).toBe(true);
      expect(result.iterations).toBe(0);
    });

    it("should reduce quality iteratively for JPEG", async () => {
      // First call returns large blob, second returns smaller
      let callCount = 0;
      mockToBlob.mockImplementation((callback) => {
        callCount++;
        if (callCount === 1) {
          callback(new Blob(["x".repeat(2000)], { type: "image/jpeg" }));
        } else {
          callback(new Blob(["x".repeat(500)], { type: "image/jpeg" }));
        }
      });

      const result = await compressToMaxSize({
        targetMaxBytes: 1000,
        format: "jpeg",
        initialQuality: 0.92,
        canvas,
      });

      expect(result.targetAchieved).toBe(true);
      expect(result.iterations).toBeGreaterThan(0);
      expect(result.finalQuality).toBeLessThan(0.92);
    });

    it("should reduce quality iteratively for WebP", async () => {
      let callCount = 0;
      mockToBlob.mockImplementation((callback) => {
        callCount++;
        if (callCount === 1) {
          callback(new Blob(["x".repeat(2000)], { type: "image/webp" }));
        } else {
          callback(new Blob(["x".repeat(500)], { type: "image/webp" }));
        }
      });

      const result = await compressToMaxSize({
        targetMaxBytes: 1000,
        format: "webp",
        initialQuality: 0.92,
        canvas,
      });

      expect(result.targetAchieved).toBe(true);
      expect(result.iterations).toBeGreaterThan(0);
    });

    it("should respect minimum quality threshold", async () => {
      // Always return large blob
      mockToBlob.mockImplementation((callback) => {
        callback(new Blob(["x".repeat(5000)], { type: "image/jpeg" }));
      });

      const result = await compressToMaxSize({
        targetMaxBytes: 100,
        format: "jpeg",
        initialQuality: 0.92,
        canvas,
      });

      // Should stop at minimum quality (0.1)
      expect(result.finalQuality).toBeCloseTo(0.1, 1);
      expect(result.targetAchieved).toBe(false);
    });

    it("should use initial quality as starting point", async () => {
      const smallBlob = new Blob(["small"], { type: "image/jpeg" });
      mockToBlob.mockImplementation((callback, _mimeType, quality) => {
        expect(quality).toBeCloseTo(0.7, 1);
        callback(smallBlob);
      });

      await compressToMaxSize({
        targetMaxBytes: 1000,
        format: "jpeg",
        initialQuality: 0.7,
        canvas,
      });
    });

    it("should return best result when target unachievable", async () => {
      const largeBlob = new Blob(["x".repeat(10000)], { type: "image/jpeg" });
      mockToBlob.mockImplementation((callback) => {
        callback(largeBlob);
      });

      const result = await compressToMaxSize({
        targetMaxBytes: 100,
        format: "jpeg",
        canvas,
      });

      expect(result.targetAchieved).toBe(false);
      expect(result.blob).toBeDefined();
    });
  });
});
