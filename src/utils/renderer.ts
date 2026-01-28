/**
 * Rendering utilities for generating SVG and PNG assets
 */

import type { IconMetadata } from "../types/icon";
import type { IconGeneratorState } from "../hooks/use-icon-generator";
import { SVG_SPECS } from "../constants/app";
import type { BackgroundValue } from "./gradients";
import {
  isGradient,
  gradientToSvgDef,
  createCanvasGradient,
} from "./gradients";

/**
 * Render options for SVG generation
 */
export interface SvgRenderOptions {
  /** Icon metadata */
  icon: IconMetadata;
  /** Background color (hex) or gradient */
  backgroundColor: BackgroundValue;
  /** Icon color (hex) */
  iconColor: string;
  /** Artboard size used for the SVG viewBox */
  size: number;
  /** Padding around icon (for SVG) */
  padding?: number;
  /** Output width/height attribute (defaults to artboard size) */
  outputSize?: number;
  /**
   * When true, renders SVG for Zendesk location icons (top_bar, ticket_editor, nav_bar).
   * - No background element (transparent)
   * - No hardcoded fill colors (preserves currentColor for Zendesk styling)
   * This matches Zendesk requirements: https://developer.zendesk.com/documentation/apps/app-developer-guide/styling/
   */
  zendeskLocationMode?: boolean;
}

/**
 * Render options for PNG generation
 */
export interface PngRenderOptions extends SvgRenderOptions {
  /** Canvas width */
  width: number;
  /** Canvas height */
  height: number;
}

/**
 * Check if SVG content contains an image element (emoji indicator)
 */
function isRasterizedSvg(content: string): boolean {
  return /<image[^>]*>/i.test(content);
}

/**
 * Bounding box result from visual content analysis
 */
interface VisualBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  /** Center X of the visual content */
  centerX: number;
  /** Center Y of the visual content */
  centerY: number;
}

/**
 * Calculate the visual bounding box of SVG content using the browser's getBBox() API.
 * This accounts for the actual rendered content position, not just the viewBox.
 *
 * Some icon libraries (e.g., Zendesk Garden) have icons where visual content is
 * intentionally not centered within the viewBox (for pixel-perfect rendering at small sizes).
 * This function detects such cases and returns the true visual bounds.
 *
 * @param svgContent - The inner SVG content (paths, circles, etc.)
 * @param viewBoxWidth - The viewBox width
 * @param viewBoxHeight - The viewBox height
 * @param inheritedAttrs - Optional inherited attributes from the root SVG element
 * @returns The visual bounding box, or null if calculation fails
 */
export function getVisualBoundingBox(
  svgContent: string,
  viewBoxWidth: number,
  viewBoxHeight: number,
  inheritedAttrs?: {
    fill?: string;
    stroke?: string;
    strokeWidth?: string;
  }
): VisualBoundingBox | null {
  // Check if we're in a browser environment with DOM support
  if (typeof document === "undefined") {
    return null;
  }

  try {
    // Create a temporary hidden SVG element to measure the content
    const svgNS = "http://www.w3.org/2000/svg";
    const tempSvg = document.createElementNS(svgNS, "svg");
    tempSvg.setAttribute("width", String(viewBoxWidth));
    tempSvg.setAttribute("height", String(viewBoxHeight));
    tempSvg.setAttribute("viewBox", `0 0 ${viewBoxWidth} ${viewBoxHeight}`);
    tempSvg.style.position = "absolute";
    tempSvg.style.visibility = "hidden";
    tempSvg.style.pointerEvents = "none";

    // Create a group to hold the content and apply inherited attributes
    const group = document.createElementNS(svgNS, "g");

    // Apply inherited attributes that affect bounding box
    if (inheritedAttrs?.fill) {
      group.setAttribute("fill", inheritedAttrs.fill);
    }
    if (inheritedAttrs?.stroke) {
      group.setAttribute("stroke", inheritedAttrs.stroke);
    }
    if (inheritedAttrs?.strokeWidth) {
      group.setAttribute("stroke-width", inheritedAttrs.strokeWidth);
    }

    group.innerHTML = svgContent;
    tempSvg.appendChild(group);

    // Append to document to enable getBBox()
    document.body.appendChild(tempSvg);

    // Get the bounding box of the content group
    const bbox = group.getBBox();

    // Clean up
    document.body.removeChild(tempSvg);

    // Account for stroke width extending beyond path bounds
    // getBBox() returns geometric bounds, not visual bounds with strokes
    const strokeWidth = inheritedAttrs?.strokeWidth
      ? parseFloat(inheritedAttrs.strokeWidth)
      : 0;
    const strokePadding = strokeWidth / 2;

    const visualBox: VisualBoundingBox = {
      x: bbox.x - strokePadding,
      y: bbox.y - strokePadding,
      width: bbox.width + strokeWidth,
      height: bbox.height + strokeWidth,
      centerX: bbox.x + bbox.width / 2,
      centerY: bbox.y + bbox.height / 2,
    };

    return visualBox;
  } catch (error) {
    // If getBBox fails (e.g., empty content, invalid SVG), return null
    console.warn("Failed to calculate visual bounding box:", error);
    return null;
  }
}

/**
 * Parse SVG string and extract viewBox/paths
 */
function parseSvg(svgString: string): {
  viewBox: string;
  content: string;
  inheritedFill?: string;
  inheritedStroke?: string;
  inheritedStrokeWidth?: string;
  inheritedStrokeLinecap?: string;
  inheritedStrokeLinejoin?: string;
  isRasterized?: boolean;
} {
  // Remove XML declaration and extract SVG content
  const svgMatch = svgString.match(/<svg[^>]*>([\s\S]*)<\/svg>/i);
  if (!svgMatch) {
    throw new Error("Invalid SVG format");
  }

  const svgTag = svgString.match(/<svg[^>]*>/i)?.[0] || "";

  // Try to get viewBox first
  let viewBox = "0 0 24 24";
  const viewBoxMatch = svgTag.match(/viewBox=["']([^"']+)["']/i);
  if (viewBoxMatch) {
    viewBox = viewBoxMatch[1];
  } else {
    // Fallback to width/height attributes
    const widthMatch = svgTag.match(/width=["']([^"']+)["']/i);
    const heightMatch = svgTag.match(/height=["']([^"']+)["']/i);
    if (widthMatch && heightMatch) {
      const width = parseFloat(widthMatch[1]) || 24;
      const height = parseFloat(heightMatch[1]) || 24;
      viewBox = `0 0 ${width} ${height}`;
    }
  }

  // Extract stroke-related attributes from root SVG element (Feather icons use this pattern)
  const fillMatch = svgTag.match(/fill=["']([^"']*)["']/i);
  const strokeMatch = svgTag.match(/stroke=["']([^"']*)["']/i);
  const strokeWidthMatch = svgTag.match(/stroke-width=["']([^"']*)["']/i);
  const strokeLinecapMatch = svgTag.match(/stroke-linecap=["']([^"']*)["']/i);
  const strokeLinejoinMatch = svgTag.match(/stroke-linejoin=["']([^"']*)["']/i);

  const inheritedFill = fillMatch ? fillMatch[1] : undefined;
  const inheritedStroke = strokeMatch ? strokeMatch[1] : undefined;
  const inheritedStrokeWidth = strokeWidthMatch
    ? strokeWidthMatch[1]
    : undefined;
  const inheritedStrokeLinecap = strokeLinecapMatch
    ? strokeLinecapMatch[1]
    : undefined;
  const inheritedStrokeLinejoin = strokeLinejoinMatch
    ? strokeLinejoinMatch[1]
    : undefined;

  // Extract inner content (paths, circles, etc.)
  const content = svgMatch[1];
  const isRasterized = isRasterizedSvg(content);

  return {
    viewBox,
    content,
    inheritedFill,
    inheritedStroke,
    inheritedStrokeWidth,
    inheritedStrokeLinecap,
    inheritedStrokeLinejoin,
    isRasterized,
  };
}

/**
 * Apply color transformation to SVG content
 */
export function applySvgColor(svgContent: string, color: string): string {
  // Replace fill and stroke attributes with the desired color
  // Preserve transparent/negative-space directives like "none" or "url(#foo)"
  let result = svgContent;

  const shouldPreserveValue = (rawValue: string): boolean => {
    const normalized = rawValue.trim().toLowerCase();
    if (!normalized) {
      return false;
    }

    // Preserve transparent or masked regions
    if (normalized === "none" || normalized === "transparent") {
      return true;
    }

    // Preserve gradients / pattern references defined via url(...)
    if (normalized.startsWith("url(")) {
      return true;
    }

    return false;
  };

  // Replace fill attributes (handles both "currentColor" and explicit colors)
  result = result.replace(/fill=["']([^"']*)["']/gi, (match, fillValue) => {
    if (shouldPreserveValue(fillValue)) {
      return match; // Keep directives like fill="none"
    }
    return `fill="${color}"`;
  });

  // Replace stroke attributes (handles both "currentColor" and explicit colors)
  result = result.replace(/stroke=["']([^"']*)["']/gi, (match, strokeValue) => {
    if (shouldPreserveValue(strokeValue)) {
      return match; // Keep stroke="none" or url(...)
    }
    return `stroke="${color}"`;
  });

  // Replace fill in inline styles, preserving transparent directives
  result = result.replace(
    /fill:\s*([^;]+)(;?)/gi,
    (match, fillValue, suffix) => {
      if (shouldPreserveValue(fillValue)) {
        return match; // Keep fill: none;
      }
      return `fill: ${color}${suffix}`;
    }
  );

  // Replace stroke in inline styles, preserving transparent directives
  result = result.replace(
    /stroke:\s*([^;]+)(;?)/gi,
    (match, strokeValue, suffix) => {
      if (shouldPreserveValue(strokeValue)) {
        return match; // Keep stroke: none;
      }
      return `stroke: ${color}${suffix}`;
    }
  );

  // Also handle remaining occurrences of currentColor
  result = result.replace(/\bcurrentColor\b/gi, color);

  return result;
}

/**
 * Render SVG with customization
 */
export function renderSvg(options: SvgRenderOptions): string {
  const {
    icon,
    backgroundColor,
    iconColor,
    size,
    padding = 0,
    outputSize,
    zendeskLocationMode = false,
  } = options;

  const {
    viewBox,
    content,
    inheritedFill,
    inheritedStroke,
    inheritedStrokeWidth,
    inheritedStrokeLinecap,
    inheritedStrokeLinejoin,
    isRasterized,
  } = parseSvg(icon.svg);

  // Skip color transformation for:
  // - Rasterized icons (emojis)
  // - Icons with color override disabled
  // - Zendesk location mode (top_bar, ticket_editor, nav_bar) - preserves currentColor for Zendesk styling
  const shouldSkipColorTransform =
    zendeskLocationMode ||
    isRasterized ||
    icon.isRasterized ||
    icon.allowColorOverride === false;
  const coloredContent = shouldSkipColorTransform
    ? content
    : applySvgColor(content, iconColor);

  // Calculate icon size within padded area
  // Allow negative padding for larger icons that overflow the artboard
  const effectivePadding = Math.min(padding, size / 2);
  const iconSize = size - effectivePadding * 2;
  const viewBoxParts = viewBox.split(/\s+/).map(Number);
  const vbMinX = viewBoxParts[0] || 0;
  const vbMinY = viewBoxParts[1] || 0;
  const vbWidth = viewBoxParts[2] || 24;
  const vbHeight = viewBoxParts[3] || 24;

  // Render background (solid color or gradient)
  // In Zendesk location mode, skip background entirely for transparent SVG
  let backgroundElement: string = "";
  let gradientDef: string = "";

  if (!zendeskLocationMode) {
    if (isGradient(backgroundColor)) {
      const gradientId = `bg-gradient-${Math.random().toString(36).substr(2, 9)}`;
      gradientDef = gradientToSvgDef(backgroundColor, gradientId, size);
      backgroundElement = `<rect width="${size}" height="${size}" fill="url(#${gradientId})"/>`;
    } else {
      backgroundElement = `<rect width="${size}" height="${size}" fill="${backgroundColor}"/>`;
    }
  }

  // For rasterized icons (emojis), render differently - embed the image directly
  if (shouldSkipColorTransform) {
    // Extract image element from content
    const imageMatch = content.match(/<image[^>]*>/i);
    if (imageMatch) {
      // Parse the image element to get its href and dimensions
      const imageTag = imageMatch[0];
      const hrefMatch =
        imageTag.match(/href=["']([^"']+)["']/i) ||
        imageTag.match(/xlink:href=["']([^"']+)["']/i);
      const widthMatch = imageTag.match(/width=["']([^"']+)["']/i);
      const heightMatch = imageTag.match(/height=["']([^"']+)["']/i);

      const href = hrefMatch ? hrefMatch[1] : "";
      const imgWidth = widthMatch ? parseFloat(widthMatch[1]) : vbWidth;
      const imgHeight = heightMatch ? parseFloat(heightMatch[1]) : vbHeight;

      // Scale image to fit in padded area
      const scale = iconSize / Math.max(imgWidth, imgHeight);
      const scaledWidth = imgWidth * scale;
      const scaledHeight = imgHeight * scale;
      const iconX = effectivePadding + (iconSize - scaledWidth) / 2;
      const iconY = effectivePadding + (iconSize - scaledHeight) / 2;

      const finalSize = outputSize ?? size;

      // Build background elements string (empty in Zendesk location mode)
      const rasterBgElements = backgroundElement
        ? `${gradientDef ? gradientDef + "\n" : ""}  ${backgroundElement}\n`
        : "";

      return `<svg width="${finalSize}" height="${finalSize}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
${rasterBgElements}  <image href="${href}" width="${scaledWidth}" height="${scaledHeight}" x="${iconX}" y="${iconY}"/>
</svg>`;
    }
  }

  // Standard SVG rendering for vector icons
  // Calculate scale to fit icon in padded area
  const scale = iconSize / Math.max(vbWidth, vbHeight);
  const adjustedContent = coloredContent;

  // Calculate the visual bounding box to detect off-center icon content
  // Some icon libraries (e.g., Zendesk Garden) have icons where visual content
  // is intentionally not centered within the viewBox for pixel-perfect rendering
  const visualBBox = getVisualBoundingBox(content, vbWidth, vbHeight, {
    fill: inheritedFill,
    stroke: inheritedStroke,
    strokeWidth: inheritedStrokeWidth,
  });

  // Calculate centering offset based on visual content position
  // If the visual content is off-center within the viewBox, we compensate
  let visualCenterOffsetX = 0;
  let visualCenterOffsetY = 0;

  if (visualBBox) {
    // Calculate where the visual center is relative to the viewBox center
    const vbCenterX = vbWidth / 2;
    const vbCenterY = vbHeight / 2;

    // The offset is how much the visual center deviates from the viewBox center
    // We apply the inverse to bring visual content to true center
    visualCenterOffsetX = vbCenterX - visualBBox.centerX;
    visualCenterOffsetY = vbCenterY - visualBBox.centerY;
  }

  // Center the icon - calculate position to center the scaled icon in the padded area
  // Apply the visual center offset to correct for off-center icon designs
  const baseIconX = effectivePadding + (iconSize - vbWidth * scale) / 2;
  const baseIconY = effectivePadding + (iconSize - vbHeight * scale) / 2;
  const iconX = baseIconX + visualCenterOffsetX * scale;
  const iconY = baseIconY + visualCenterOffsetY * scale;
  const needsViewBoxOffset = vbMinX !== 0 || vbMinY !== 0;

  // Apply inherited attributes from root SVG element to the group
  // This handles Feather icons that set fill="none" and stroke attributes on the root <svg> tag
  // Also handles RemixIcon that sets fill="currentColor" on the root <svg> tag
  const groupAttrs: string[] = [];

  if (inheritedFill !== undefined) {
    const fillValue = inheritedFill.toLowerCase().trim();
    // If the root SVG had fill="none", apply it to preserve transparency
    if (fillValue === "none") {
      groupAttrs.push('fill="none"');
    } else if (fillValue === "currentcolor" || fillValue === "current-color") {
      // In Zendesk location mode, preserve currentColor for Zendesk's CSS styling
      // Otherwise, apply our icon color
      if (zendeskLocationMode) {
        groupAttrs.push('fill="currentColor"');
      } else {
        groupAttrs.push(`fill="${iconColor}"`);
      }
    }
  }

  if (
    inheritedStroke !== undefined &&
    inheritedStroke.toLowerCase().trim() === "currentcolor"
  ) {
    // In Zendesk location mode, preserve currentColor for Zendesk's CSS styling
    // Otherwise, apply our icon color
    if (zendeskLocationMode) {
      groupAttrs.push('stroke="currentColor"');
    } else {
      groupAttrs.push(`stroke="${iconColor}"`);
    }
  }

  if (inheritedStrokeWidth !== undefined) {
    groupAttrs.push(`stroke-width="${inheritedStrokeWidth}"`);
  }

  if (inheritedStrokeLinecap !== undefined) {
    // Preserve stroke-linecap (e.g., "round")
    groupAttrs.push(`stroke-linecap="${inheritedStrokeLinecap}"`);
  }

  if (inheritedStrokeLinejoin !== undefined) {
    // Preserve stroke-linejoin (e.g., "round")
    groupAttrs.push(`stroke-linejoin="${inheritedStrokeLinejoin}"`);
  }

  const groupAttrString =
    groupAttrs.length > 0 ? " " + groupAttrs.join(" ") : "";

  // Combine transforms for precise centering
  // Order: translate to center position, then scale, then offset viewBox origin if needed
  // SVG applies transforms right-to-left, so we write: translate(center) scale() translate(-viewBoxOffset)
  const transformParts: string[] = [
    `translate(${iconX}, ${iconY})`,
    `scale(${scale})`,
  ];
  if (needsViewBoxOffset) {
    transformParts.push(`translate(${-vbMinX}, ${-vbMinY})`);
  }
  const combinedTransform = transformParts.join(" ");

  const finalSize = outputSize ?? size;

  // Build background elements string (empty in Zendesk location mode)
  const bgElements = backgroundElement
    ? `${gradientDef ? gradientDef + "\n" : ""}  ${backgroundElement}\n`
    : "";

  return `<svg width="${finalSize}" height="${finalSize}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
${bgElements}  <g transform="${combinedTransform}"${groupAttrString}>
    ${adjustedContent}
  </g>
</svg>`;
}

/**
 * Create a canvas and render PNG
 */
export async function renderPng(options: PngRenderOptions): Promise<Blob> {
  const { icon, backgroundColor, iconColor, size, width, height } = options;

  // Create canvas
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  // Fill background (solid color or gradient)
  if (isGradient(backgroundColor)) {
    const gradient = createCanvasGradient(ctx, backgroundColor, width, height);
    ctx.fillStyle = gradient;
  } else {
    ctx.fillStyle = backgroundColor;
  }
  ctx.fillRect(0, 0, width, height);

  // Render icon as SVG first, then draw to canvas
  // Use the size option to control icon size, but render at canvas size for quality
  // Always use transparent background in SVG since we're filling the canvas background separately
  const canvasSize = Math.min(width, height);
  const svgString = renderSvg({
    icon,
    backgroundColor: "transparent",
    iconColor,
    size: canvasSize,
  });

  // Convert SVG to image
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const blob = new Blob([svgString], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = reject;
    image.src = url;
  });

  // Use the size option to control the actual icon size on canvas
  // Scale it relative to canvas size (size is in pixels, typically 48-200)
  // Map it to a percentage of canvas: 48px = 30%, 200px = 100% of canvas
  const minSize = 48;
  const maxSize = 200;
  const sizePercent = Math.max(
    0.3,
    Math.min(1.0, ((size - minSize) / (maxSize - minSize)) * 0.7 + 0.3)
  );
  const iconSize = canvasSize * sizePercent;
  const iconX = (width - iconSize) / 2;
  const iconY = (height - iconSize) / 2;

  // Draw icon
  ctx.drawImage(img, iconX, iconY, iconSize, iconSize);

  // Convert to blob
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to convert canvas to blob"));
        }
      },
      "image/png",
      1.0
    );
  });
}

/**
 * Render options with format and quality support
 */
export interface RasterRenderOptions extends PngRenderOptions {
  /** Output format (defaults to png) */
  format?: "png" | "jpeg" | "webp";
  /** Quality for JPEG/WebP (0-1, defaults to 0.92) */
  quality?: number;
}

/**
 * Render icon to raster format (PNG, JPEG, or WebP)
 */
export async function renderRaster(
  options: RasterRenderOptions
): Promise<Blob> {
  const {
    icon,
    backgroundColor,
    iconColor,
    size,
    width,
    height,
    format = "png",
    quality = 0.92,
  } = options;

  // Create canvas
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  // For JPEG, fill with background first since JPEG doesn't support transparency
  // For PNG/WebP with transparent background, clear to transparent
  if (format === "jpeg" || backgroundColor !== "transparent") {
    if (isGradient(backgroundColor)) {
      const gradient = createCanvasGradient(
        ctx,
        backgroundColor,
        width,
        height
      );
      ctx.fillStyle = gradient;
    } else {
      ctx.fillStyle = backgroundColor;
    }
    ctx.fillRect(0, 0, width, height);
  }

  // Render icon as SVG first, then draw to canvas
  const canvasSize = Math.min(width, height);
  const svgString = renderSvg({
    icon,
    backgroundColor: "transparent",
    iconColor,
    size: canvasSize,
  });

  // Convert SVG to image
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const blob = new Blob([svgString], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = reject;
    image.src = url;
  });

  // Use the size option to control the actual icon size on canvas
  const minSize = 48;
  const maxSize = 200;
  const sizePercent = Math.max(
    0.3,
    Math.min(1.0, ((size - minSize) / (maxSize - minSize)) * 0.7 + 0.3)
  );
  const iconSize = canvasSize * sizePercent;
  const iconX = (width - iconSize) / 2;
  const iconY = (height - iconSize) / 2;

  // Draw icon
  ctx.drawImage(img, iconX, iconY, iconSize, iconSize);

  // Get MIME type
  const mimeType =
    format === "jpeg"
      ? "image/jpeg"
      : format === "webp"
        ? "image/webp"
        : "image/png";

  // Convert to blob
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
      format === "png" ? undefined : quality
    );
  });
}

/**
 * Render options for raster from custom image with format support
 */
export interface ImageRasterRenderOptions extends ImageRenderOptions {
  /** Output format (defaults to png) */
  format?: "png" | "jpeg" | "webp";
  /** Quality for JPEG/WebP (0-1, defaults to 0.92) */
  quality?: number;
}

/**
 * Render custom image to raster format (PNG, JPEG, or WebP)
 */
export async function renderRasterFromImage(
  options: ImageRasterRenderOptions
): Promise<Blob> {
  const {
    imageDataUrl,
    backgroundColor,
    size,
    width,
    height,
    format = "png",
    quality = 0.92,
  } = options;

  // Create canvas
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  // Fill background (solid color or gradient)
  if (isGradient(backgroundColor)) {
    const gradient = createCanvasGradient(ctx, backgroundColor, width, height);
    ctx.fillStyle = gradient;
  } else {
    ctx.fillStyle = backgroundColor;
  }
  ctx.fillRect(0, 0, width, height);

  // Load the image from data URL
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load custom image"));
    image.src = imageDataUrl;
  });

  // Calculate target size based on slider
  const canvasSize = Math.min(width, height);
  const minSize = 48;
  const maxSize = 200;
  const sizePercent = Math.max(
    0.3,
    Math.min(1.0, ((size - minSize) / (maxSize - minSize)) * 0.7 + 0.3)
  );
  const targetSize = canvasSize * sizePercent;

  // Calculate scale to fit image within target size while preserving aspect ratio
  const imgAspect = img.width / img.height;
  let drawWidth: number;
  let drawHeight: number;

  if (imgAspect >= 1) {
    drawWidth = targetSize;
    drawHeight = targetSize / imgAspect;
  } else {
    drawHeight = targetSize;
    drawWidth = targetSize * imgAspect;
  }

  // Center the image on the canvas
  const drawX = (width - drawWidth) / 2;
  const drawY = (height - drawHeight) / 2;

  // Draw the image
  ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

  // Get MIME type
  const mimeType =
    format === "jpeg"
      ? "image/jpeg"
      : format === "webp"
        ? "image/webp"
        : "image/png";

  // Convert to blob
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
      format === "png" ? undefined : quality
    );
  });
}

/**
 * Render options for PNG from custom image
 */
export interface ImageRenderOptions {
  /** Base64 data URL of the image */
  imageDataUrl: string;
  /** Background color (hex) or gradient */
  backgroundColor: BackgroundValue;
  /** Size slider value (48-200), controls fill percentage */
  size: number;
  /** Canvas width */
  width: number;
  /** Canvas height */
  height: number;
}

/**
 * Render PNG from a custom uploaded image (PNG/JPG/WebP)
 * This is used for custom images that can't be converted to SVG
 */
export async function renderPngFromImage(
  options: ImageRenderOptions
): Promise<Blob> {
  const { imageDataUrl, backgroundColor, size, width, height } = options;

  // Create canvas
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  // Fill background (solid color or gradient)
  if (isGradient(backgroundColor)) {
    const gradient = createCanvasGradient(ctx, backgroundColor, width, height);
    ctx.fillStyle = gradient;
  } else {
    ctx.fillStyle = backgroundColor;
  }
  ctx.fillRect(0, 0, width, height);

  // Load the image from data URL
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load custom image"));
    image.src = imageDataUrl;
  });

  // Calculate target size based on slider (same formula as icons)
  // Map size (48-200) to percentage (30%-100%)
  const canvasSize = Math.min(width, height);
  const minSize = 48;
  const maxSize = 200;
  const sizePercent = Math.max(
    0.3,
    Math.min(1.0, ((size - minSize) / (maxSize - minSize)) * 0.7 + 0.3)
  );
  const targetSize = canvasSize * sizePercent;

  // Calculate scale to fit image within target size while preserving aspect ratio
  const imgAspect = img.width / img.height;
  let drawWidth: number;
  let drawHeight: number;

  if (imgAspect >= 1) {
    // Image is wider than tall (or square)
    drawWidth = targetSize;
    drawHeight = targetSize / imgAspect;
  } else {
    // Image is taller than wide
    drawHeight = targetSize;
    drawWidth = targetSize * imgAspect;
  }

  // Center the image on the canvas
  const drawX = (width - drawWidth) / 2;
  const drawY = (height - drawHeight) / 2;

  // Draw the image
  ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

  // Convert to blob
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to convert canvas to blob"));
        }
      },
      "image/png",
      1.0
    );
  });
}

/**
 * Zendesk location SVG filenames that require transparent backgrounds
 * and no hardcoded fill colors (uses currentColor for Zendesk CSS styling)
 */
const ZENDESK_LOCATION_SVG_FILES = [
  "icon_top_bar.svg",
  "icon_ticket_editor.svg",
  "icon_nav_bar.svg",
];

/**
 * Supported export format type
 */
export type ExportFormatType = "png" | "jpeg" | "webp" | "svg" | "ico";

/**
 * Export variant with extended format support
 */
export interface ExportVariantSpec {
  filename: string;
  width: number;
  height: number;
  format: ExportFormatType;
  quality?: number;
  description?: string;
}

/**
 * Generate all export assets from state with extended format support
 */
export async function generateExportAssets(
  icon: IconMetadata,
  state: IconGeneratorState,
  variants: ExportVariantSpec[]
): Promise<Map<string, Blob>> {
  const assets = new Map<string, Blob>();

  // Collect PNG blobs for ICO generation (16x16 and 32x32)
  const icoPngBlobs: { variant: ExportVariantSpec; blob: Blob }[] = [];

  for (const variant of variants) {
    if (variant.format === "svg") {
      // SVG rendering
      const artboardSize = SVG_SPECS.PADDED_SIZE;

      // Check if this is a Zendesk location SVG (top_bar, ticket_editor, nav_bar)
      // These require transparent backgrounds and no hardcoded fill colors
      const isZendeskLocationSvg = ZENDESK_LOCATION_SVG_FILES.includes(
        variant.filename
      );

      // Use svgIconSize for SVG exports to control icon density within the artboard
      // Map svgIconSize (48-300px) to padding (6px to -6px range)
      // Negative padding makes icon larger than artboard (overflow)
      const minSize = 48;
      const maxSize = 300;
      const maxPadding = 6;
      const minPadding = -6; // Allow overflow
      const svgSize = state.svgIconSize ?? state.iconSize;
      const padding =
        maxPadding -
        ((svgSize - minSize) / (maxSize - minSize)) * (maxPadding - minPadding);

      const requestedSize = Math.max(variant.width, variant.height);
      const displaySize = Math.min(requestedSize, artboardSize);

      const svgString = renderSvg({
        icon,
        backgroundColor: state.backgroundColor,
        iconColor: state.iconColor,
        size: artboardSize,
        padding,
        outputSize: displaySize,
        zendeskLocationMode: isZendeskLocationSvg,
      });
      const blob = new Blob([svgString], { type: "image/svg+xml" });
      assets.set(variant.filename, blob);
    } else if (variant.format === "ico") {
      // ICO rendering - collect PNG blobs first, generate ICO at the end
      // For ICO, we need 16x16 and 32x32 PNGs
      const sizes = [16, 32];
      for (const size of sizes) {
        const blob = await renderRaster({
          icon,
          backgroundColor: state.backgroundColor,
          iconColor: state.iconColor,
          size: state.iconSize,
          width: size,
          height: size,
          format: "png",
        });
        icoPngBlobs.push({ variant, blob });
      }
    } else {
      // Raster rendering (PNG, JPEG, WebP)
      const blob = await renderRaster({
        icon,
        backgroundColor: state.backgroundColor,
        iconColor: state.iconColor,
        size: state.iconSize,
        width: variant.width,
        height: variant.height,
        format: variant.format,
        quality: variant.quality ? variant.quality / 100 : undefined,
      });
      assets.set(variant.filename, blob);
    }
  }

  // Generate ICO files from collected PNGs
  if (icoPngBlobs.length > 0) {
    // Group by variant filename
    const icoVariants = new Map<string, Blob[]>();
    for (const { variant, blob } of icoPngBlobs) {
      const existing = icoVariants.get(variant.filename) || [];
      existing.push(blob);
      icoVariants.set(variant.filename, existing);
    }

    // Generate ICO for each variant
    for (const [filename, pngBlobs] of icoVariants.entries()) {
      const icoBlob = await generateIcoFromPngs(pngBlobs);
      assets.set(filename, icoBlob);
    }
  }

  return assets;
}

/**
 * Generate ICO file from PNG blobs
 * ICO format: Header (6 bytes) + Image entries (16 bytes each) + Image data
 */
async function generateIcoFromPngs(pngBlobs: Blob[]): Promise<Blob> {
  const images: { width: number; height: number; data: ArrayBuffer }[] = [];

  for (const blob of pngBlobs) {
    const arrayBuffer = await blob.arrayBuffer();

    // Parse PNG header to get dimensions
    const view = new DataView(arrayBuffer);
    // PNG width is at offset 16-19, height at 20-23 (big-endian)
    const width = view.getUint32(16, false);
    const height = view.getUint32(20, false);

    images.push({
      width: width > 255 ? 0 : width, // 0 means 256 in ICO format
      height: height > 255 ? 0 : height,
      data: arrayBuffer,
    });
  }

  // Sort by size (smallest first)
  images.sort((a, b) => (a.width || 256) - (b.width || 256));

  // Build ICO file
  const headerSize = 6;
  const entrySize = 16;
  const dataOffset = headerSize + entrySize * images.length;

  // Calculate total size
  let totalSize = dataOffset;
  for (const img of images) {
    totalSize += img.data.byteLength;
  }

  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);

  // ICO Header
  view.setUint16(0, 0, true); // Reserved
  view.setUint16(2, 1, true); // Type: 1 = ICO
  view.setUint16(4, images.length, true); // Image count

  // Image entries and data
  let currentOffset = dataOffset;
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const entryOffset = headerSize + i * entrySize;

    // Image entry
    view.setUint8(entryOffset, img.width); // Width
    view.setUint8(entryOffset + 1, img.height); // Height
    view.setUint8(entryOffset + 2, 0); // Color palette
    view.setUint8(entryOffset + 3, 0); // Reserved
    view.setUint16(entryOffset + 4, 1, true); // Color planes
    view.setUint16(entryOffset + 6, 32, true); // Bits per pixel
    view.setUint32(entryOffset + 8, img.data.byteLength, true); // Size
    view.setUint32(entryOffset + 12, currentOffset, true); // Offset

    // Copy image data
    const dest = new Uint8Array(buffer, currentOffset, img.data.byteLength);
    dest.set(new Uint8Array(img.data));
    currentOffset += img.data.byteLength;
  }

  return new Blob([buffer], { type: "image/x-icon" });
}
