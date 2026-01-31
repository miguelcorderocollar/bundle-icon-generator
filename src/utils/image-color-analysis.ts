/**
 * Image color analysis utilities
 * Detects dominant colors in images and determines if they have a uniform single color
 */

export interface ColorAnalysisResult {
  /** The dominant color in the image (hex) */
  dominantColor: string;
  /** Confidence score (0-1) - how uniform the color is across the image */
  uniformity: number;
  /** Whether the image is considered to have a uniform color (uniformity > threshold) */
  hasUniformColor: boolean;
  /** Total non-transparent pixels analyzed */
  pixelCount: number;
}

/** Minimum uniformity score to consider an image as having a uniform color */
const UNIFORMITY_THRESHOLD = 0.6;

/** Minimum alpha value to consider a pixel as non-transparent */
const ALPHA_THRESHOLD = 128;

/** Color distance threshold for considering colors as "same" */
const COLOR_DISTANCE_THRESHOLD = 50;

/**
 * Convert RGB to hex color string
 */
function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((c) => {
        const hex = Math.round(c).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  );
}

/**
 * Calculate Euclidean distance between two colors in RGB space
 */
function colorDistance(
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number
): number {
  return Math.sqrt(
    Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2)
  );
}

/**
 * Analyze an image to detect its dominant color and uniformity
 * @param imageDataUrl - Base64 data URL of the image
 * @returns Promise resolving to color analysis result
 */
export async function analyzeImageColors(
  imageDataUrl: string
): Promise<ColorAnalysisResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        // Create canvas to extract pixel data
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        // Use a smaller size for faster analysis (max 100x100)
        const maxSize = 100;
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const width = Math.floor(img.width * scale);
        const height = Math.floor(img.height * scale);

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        // Collect non-transparent pixels
        const colors: { r: number; g: number; b: number }[] = [];

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          // Only consider non-transparent pixels
          if (a >= ALPHA_THRESHOLD) {
            colors.push({ r, g, b });
          }
        }

        if (colors.length === 0) {
          // Fully transparent image
          resolve({
            dominantColor: "#000000",
            uniformity: 0,
            hasUniformColor: false,
            pixelCount: 0,
          });
          return;
        }

        // Calculate average color (dominant color approximation)
        let totalR = 0,
          totalG = 0,
          totalB = 0;
        for (const color of colors) {
          totalR += color.r;
          totalG += color.g;
          totalB += color.b;
        }
        const avgR = totalR / colors.length;
        const avgG = totalG / colors.length;
        const avgB = totalB / colors.length;

        // Calculate uniformity: percentage of pixels within threshold of average
        let matchingPixels = 0;
        for (const color of colors) {
          const distance = colorDistance(
            color.r,
            color.g,
            color.b,
            avgR,
            avgG,
            avgB
          );
          if (distance <= COLOR_DISTANCE_THRESHOLD) {
            matchingPixels++;
          }
        }

        const uniformity = matchingPixels / colors.length;
        const dominantColor = rgbToHex(avgR, avgG, avgB);

        resolve({
          dominantColor,
          uniformity,
          hasUniformColor: uniformity >= UNIFORMITY_THRESHOLD,
          pixelCount: colors.length,
        });
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error("Failed to load image for color analysis"));
    };

    img.src = imageDataUrl;
  });
}

/**
 * Storage key suffix for color analysis data
 */
export const COLOR_ANALYSIS_SUFFIX = "-color-analysis";

/**
 * Storage key suffix for color override data
 */
export const COLOR_OVERRIDE_SUFFIX = "-color-override";

/**
 * Store color analysis result for a custom image
 */
export function storeColorAnalysis(
  imageId: string,
  result: ColorAnalysisResult
): void {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(
      imageId + COLOR_ANALYSIS_SUFFIX,
      JSON.stringify(result)
    );
  }
}

/**
 * Get color analysis result for a custom image
 */
export function getColorAnalysis(imageId: string): ColorAnalysisResult | null {
  if (typeof window === "undefined") return null;
  const stored = sessionStorage.getItem(imageId + COLOR_ANALYSIS_SUFFIX);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as ColorAnalysisResult;
  } catch {
    return null;
  }
}

/**
 * Store color override for a custom image
 * @param imageId - The custom image ID
 * @param overrideColor - The color to use as replacement, or null to disable
 */
export function storeColorOverride(
  imageId: string,
  overrideColor: string | null
): void {
  if (typeof window !== "undefined") {
    if (overrideColor === null) {
      sessionStorage.removeItem(imageId + COLOR_OVERRIDE_SUFFIX);
    } else {
      sessionStorage.setItem(imageId + COLOR_OVERRIDE_SUFFIX, overrideColor);
    }
  }
}

/**
 * Get color override for a custom image
 */
export function getColorOverride(imageId: string): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(imageId + COLOR_OVERRIDE_SUFFIX);
}
