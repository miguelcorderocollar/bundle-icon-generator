/**
 * Rendering utilities for generating SVG and PNG assets
 */

import type { IconMetadata } from "../types/icon";
import type { IconGeneratorState } from "../hooks/use-icon-generator";
import { SVG_SPECS } from "../constants/app";

/**
 * Render options for SVG generation
 */
export interface SvgRenderOptions {
  /** Icon metadata */
  icon: IconMetadata;
  /** Background color (hex) */
  backgroundColor: string;
  /** Icon color (hex) */
  iconColor: string;
  /** Artboard size used for the SVG viewBox */
  size: number;
  /** Padding around icon (for SVG) */
  padding?: number;
  /** Output width/height attribute (defaults to artboard size) */
  outputSize?: number;
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
  const inheritedStrokeWidth = strokeWidthMatch ? strokeWidthMatch[1] : undefined;
  const inheritedStrokeLinecap = strokeLinecapMatch ? strokeLinecapMatch[1] : undefined;
  const inheritedStrokeLinejoin = strokeLinejoinMatch ? strokeLinejoinMatch[1] : undefined;

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
function applySvgColor(svgContent: string, color: string): string {
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
  result = result.replace(/fill:\s*([^;]+)(;?)/gi, (match, fillValue, suffix) => {
    if (shouldPreserveValue(fillValue)) {
      return match; // Keep fill: none;
    }
    return `fill: ${color}${suffix}`;
  });

  // Replace stroke in inline styles, preserving transparent directives
  result = result.replace(/stroke:\s*([^;]+)(;?)/gi, (match, strokeValue, suffix) => {
    if (shouldPreserveValue(strokeValue)) {
      return match; // Keep stroke: none;
    }
    return `stroke: ${color}${suffix}`;
  });

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
  
  // Skip color transformation for rasterized icons (emojis)
  // Also check icon metadata flag as fallback
  const shouldSkipColorTransform = isRasterized || icon.isRasterized;
  const coloredContent = shouldSkipColorTransform ? content : applySvgColor(content, iconColor);

  // Calculate icon size within padded area
  const effectivePadding = Math.max(0, Math.min(padding, size / 2));
  const iconSize = size - effectivePadding * 2;
  const viewBoxParts = viewBox.split(/\s+/).map(Number);
  const vbWidth = viewBoxParts[2] || 24;
  const vbHeight = viewBoxParts[3] || 24;

  // For rasterized icons (emojis), render differently - embed the image directly
  if (shouldSkipColorTransform) {
    // Extract image element from content
    const imageMatch = content.match(/<image[^>]*>/i);
    if (imageMatch) {
      // Parse the image element to get its href and dimensions
      const imageTag = imageMatch[0];
      const hrefMatch = imageTag.match(/href=["']([^"']+)["']/i) || imageTag.match(/xlink:href=["']([^"']+)["']/i);
      const widthMatch = imageTag.match(/width=["']([^"']+)["']/i);
      const heightMatch = imageTag.match(/height=["']([^"']+)["']/i);
      
      const href = hrefMatch ? hrefMatch[1] : '';
      const imgWidth = widthMatch ? parseFloat(widthMatch[1]) : vbWidth;
      const imgHeight = heightMatch ? parseFloat(heightMatch[1]) : vbHeight;
      
      // Scale image to fit in padded area
      const scale = iconSize / Math.max(imgWidth, imgHeight);
      const scaledWidth = imgWidth * scale;
      const scaledHeight = imgHeight * scale;
      const iconX = effectivePadding + (iconSize - scaledWidth) / 2;
      const iconY = effectivePadding + (iconSize - scaledHeight) / 2;
      
      const finalSize = outputSize ?? size;
      
      return `<svg width="${finalSize}" height="${finalSize}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <rect width="${size}" height="${size}" fill="${backgroundColor}"/>
  <image href="${href}" width="${scaledWidth}" height="${scaledHeight}" x="${iconX}" y="${iconY}"/>
</svg>`;
    }
  }
  
  // Standard SVG rendering for vector icons
  // Calculate scale to fit icon in padded area
  const scale = iconSize / Math.max(vbWidth, vbHeight);
  const adjustedContent = coloredContent;
  
  // Center the icon
  const iconX = effectivePadding + (iconSize - vbWidth * scale) / 2;
  const iconY = effectivePadding + (iconSize - vbHeight * scale) / 2;

  // Apply inherited attributes from root SVG element to the group
  // This handles Feather icons that set fill="none" and stroke attributes on the root <svg> tag
  const groupAttrs: string[] = [];
  
  if (inheritedFill !== undefined) {
    // If the root SVG had fill="none", apply it to preserve transparency
    if (inheritedFill.toLowerCase().trim() === 'none') {
      groupAttrs.push('fill="none"');
    }
  }
  
  if (inheritedStroke !== undefined && inheritedStroke.toLowerCase().trim() === 'currentcolor') {
    // If root had stroke="currentColor", apply our color
    groupAttrs.push(`stroke="${iconColor}"`);
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

  const groupAttrString = groupAttrs.length > 0 ? ' ' + groupAttrs.join(' ') : '';

  const finalSize = outputSize ?? size;

  return `<svg width="${finalSize}" height="${finalSize}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="${backgroundColor}"/>
  <g transform="translate(${iconX}, ${iconY}) scale(${scale})"${groupAttrString}>
    ${adjustedContent}
  </g>
</svg>`;
}

/**
 * Create a canvas and render PNG
 */
export async function renderPng(options: PngRenderOptions): Promise<Blob> {
  const {
    icon,
    backgroundColor,
    iconColor,
    size,
    width,
    height,
  } = options;

  // Create canvas
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  // Fill background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);

  // Render icon as SVG first, then draw to canvas
  // Use the size option to control icon size, but render at canvas size for quality
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
  const sizePercent = Math.max(0.3, Math.min(1.0, (size - minSize) / (maxSize - minSize) * 0.7 + 0.3));
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
 * Generate all export assets from state
 */
export async function generateExportAssets(
  icon: IconMetadata,
  state: IconGeneratorState,
  variants: Array<{ filename: string; width: number; height: number; format: "png" | "svg" }>
): Promise<Map<string, Blob>> {
  const assets = new Map<string, Blob>();

  for (const variant of variants) {
    if (variant.format === "svg") {
      // SVG rendering
      const artboardSize = SVG_SPECS.PADDED_SIZE;
      const requestedSize = Math.max(variant.width, variant.height);
      const displaySize = Math.min(requestedSize, artboardSize);
      const padding = Math.max(0, (artboardSize - displaySize) / 2);

      const svgString = renderSvg({
        icon,
        backgroundColor: state.backgroundColor,
        iconColor: state.iconColor,
        size: artboardSize,
        padding,
        outputSize: displaySize,
      });
      const blob = new Blob([svgString], { type: "image/svg+xml" });
      assets.set(variant.filename, blob);
    } else {
      // PNG rendering
      const blob = await renderPng({
        icon,
        backgroundColor: state.backgroundColor,
        iconColor: state.iconColor,
        size: state.iconSize,
        width: variant.width,
        height: variant.height,
      });
      assets.set(variant.filename, blob);
    }
  }

  return assets;
}

