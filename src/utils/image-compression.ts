/**
 * Image compression utilities for enforcing max file size constraints
 *
 * Only supports lossy formats (JPEG, WebP) since PNG doesn't support
 * quality-based compression without external libraries or resizing.
 */

/**
 * Compression options for iterative size reduction
 */
export interface CompressOptions {
  /** Target maximum file size in bytes */
  targetMaxBytes: number;
  /** Output format - only JPEG and WebP are supported */
  format: "jpeg" | "webp";
  /** Initial quality (0-1, defaults to 0.92) */
  initialQuality?: number;
  /** Canvas element to compress */
  canvas: HTMLCanvasElement;
}

/**
 * Result of compression operation
 */
export interface CompressResult {
  /** The compressed blob */
  blob: Blob;
  /** Final quality used (0-1) */
  finalQuality: number;
  /** Whether target size was achieved */
  targetAchieved: boolean;
  /** Number of compression iterations */
  iterations: number;
}

/**
 * Minimum quality threshold to prevent unusable images
 */
const MIN_QUALITY = 0.1;

/**
 * Quality reduction step per iteration
 */
const QUALITY_STEP = 0.05;

/**
 * Convert canvas to blob with specified format and quality
 */
function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: "jpeg" | "webp",
  quality: number
): Promise<Blob> {
  const mimeType = format === "jpeg" ? "image/jpeg" : "image/webp";

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error(`Failed to convert canvas to ${format}`));
        }
      },
      mimeType,
      quality
    );
  });
}

/**
 * Compress image to meet max size target using iterative quality reduction.
 *
 * Only supports JPEG and WebP formats since they support lossy compression.
 * PNG is not supported because it's lossless and would require resizing
 * or external libraries to reduce file size.
 *
 * @param options Compression options
 * @returns Compression result with blob, final quality, and metadata
 */
export async function compressToMaxSize(
  options: CompressOptions
): Promise<CompressResult> {
  const { targetMaxBytes, format, initialQuality = 0.92, canvas } = options;

  let quality = Math.min(1, Math.max(MIN_QUALITY, initialQuality));
  let iterations = 0;
  let blob = await canvasToBlob(canvas, format, quality);

  // Iteratively reduce quality until under target or at minimum
  while (blob.size > targetMaxBytes && quality > MIN_QUALITY) {
    iterations++;
    quality = Math.max(MIN_QUALITY, quality - QUALITY_STEP);
    blob = await canvasToBlob(canvas, format, quality);
  }

  return {
    blob,
    finalQuality: quality,
    targetAchieved: blob.size <= targetMaxBytes,
    iterations,
  };
}
