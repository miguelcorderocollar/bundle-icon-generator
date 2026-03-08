/**
 * Server-safe SVG renderer.
 *
 * This version intentionally avoids DOM-dependent measurements (getBBox) and
 * uses viewBox-based centering, which is stable in Node.js API routes.
 */

import type { IconMetadata } from "@/src/types/icon";
import type { BackgroundValue } from "@/src/utils/gradients";
import { gradientToSvgDef, isGradient } from "@/src/utils/gradients";
import { applySvgColor } from "@/src/utils/renderer";

export interface ServerSvgRenderOptions {
  icon: IconMetadata;
  backgroundColor: BackgroundValue;
  iconColor: string;
  size: number;
  padding?: number;
  outputSize?: number;
  zendeskLocationMode?: boolean;
}

function isRasterizedSvg(content: string): boolean {
  return /<image[^>]*>/i.test(content);
}

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
  const svgMatch = svgString.match(/<svg[^>]*>([\s\S]*)<\/svg>/i);
  if (!svgMatch) {
    throw new Error("Invalid SVG format");
  }

  const svgTag = svgString.match(/<svg[^>]*>/i)?.[0] ?? "";

  let viewBox = "0 0 24 24";
  const viewBoxMatch = svgTag.match(/viewBox=["']([^"']+)["']/i);
  if (viewBoxMatch) {
    viewBox = viewBoxMatch[1];
  } else {
    const widthMatch = svgTag.match(/width=["']([^"']+)["']/i);
    const heightMatch = svgTag.match(/height=["']([^"']+)["']/i);
    if (widthMatch && heightMatch) {
      const width = parseFloat(widthMatch[1]) || 24;
      const height = parseFloat(heightMatch[1]) || 24;
      viewBox = `0 0 ${width} ${height}`;
    }
  }

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

export function renderSvgServer(options: ServerSvgRenderOptions): string {
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

  const shouldSkipColorTransform =
    zendeskLocationMode ||
    isRasterized ||
    icon.isRasterized ||
    icon.allowColorOverride === false;
  const coloredContent = shouldSkipColorTransform
    ? content
    : applySvgColor(content, iconColor);

  const effectivePadding = Math.min(padding, size / 2);
  const iconSize = size - effectivePadding * 2;
  const viewBoxParts = viewBox.split(/\s+/).map(Number);
  const vbMinX = viewBoxParts[0] || 0;
  const vbMinY = viewBoxParts[1] || 0;
  const vbWidth = viewBoxParts[2] || 24;
  const vbHeight = viewBoxParts[3] || 24;

  let backgroundElement = "";
  let gradientDef = "";

  if (!zendeskLocationMode) {
    if (isGradient(backgroundColor)) {
      const gradientId = `bg-gradient-${Math.random().toString(36).slice(2, 11)}`;
      gradientDef = gradientToSvgDef(backgroundColor, gradientId, size);
      backgroundElement = `<rect width="${size}" height="${size}" fill="url(#${gradientId})"/>`;
    } else {
      backgroundElement = `<rect width="${size}" height="${size}" fill="${backgroundColor}"/>`;
    }
  }

  if (shouldSkipColorTransform) {
    const imageMatch = content.match(/<image[^>]*>/i);
    if (imageMatch) {
      const imageTag = imageMatch[0];
      const hrefMatch =
        imageTag.match(/href=["']([^"']+)["']/i) ||
        imageTag.match(/xlink:href=["']([^"']+)["']/i);
      const widthMatch = imageTag.match(/width=["']([^"']+)["']/i);
      const heightMatch = imageTag.match(/height=["']([^"']+)["']/i);

      const href = hrefMatch ? hrefMatch[1] : "";
      const imgWidth = widthMatch ? parseFloat(widthMatch[1]) : vbWidth;
      const imgHeight = heightMatch ? parseFloat(heightMatch[1]) : vbHeight;

      const scale = iconSize / Math.max(imgWidth, imgHeight);
      const scaledWidth = imgWidth * scale;
      const scaledHeight = imgHeight * scale;
      const iconX = effectivePadding + (iconSize - scaledWidth) / 2;
      const iconY = effectivePadding + (iconSize - scaledHeight) / 2;
      const finalSize = outputSize ?? size;

      const rasterBgElements = backgroundElement
        ? `${gradientDef ? `${gradientDef}\n` : ""}  ${backgroundElement}\n`
        : "";

      return `<svg width="${finalSize}" height="${finalSize}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
${rasterBgElements}  <image href="${href}" width="${scaledWidth}" height="${scaledHeight}" x="${iconX}" y="${iconY}"/>
</svg>`;
    }
  }

  const scale = iconSize / Math.max(vbWidth, vbHeight);
  const baseIconX = effectivePadding + (iconSize - vbWidth * scale) / 2;
  const baseIconY = effectivePadding + (iconSize - vbHeight * scale) / 2;
  const needsViewBoxOffset = vbMinX !== 0 || vbMinY !== 0;

  const groupAttrs: string[] = [];

  if (inheritedFill !== undefined) {
    const fillValue = inheritedFill.toLowerCase().trim();
    if (fillValue === "none") {
      groupAttrs.push('fill="none"');
    } else if (fillValue === "currentcolor" || fillValue === "current-color") {
      groupAttrs.push(
        zendeskLocationMode ? 'fill="currentColor"' : `fill="${iconColor}"`
      );
    }
  }

  if (
    inheritedStroke !== undefined &&
    inheritedStroke.toLowerCase().trim() === "currentcolor"
  ) {
    groupAttrs.push(
      zendeskLocationMode ? 'stroke="currentColor"' : `stroke="${iconColor}"`
    );
  }

  if (inheritedStrokeWidth !== undefined) {
    groupAttrs.push(`stroke-width="${inheritedStrokeWidth}"`);
  }
  if (inheritedStrokeLinecap !== undefined) {
    groupAttrs.push(`stroke-linecap="${inheritedStrokeLinecap}"`);
  }
  if (inheritedStrokeLinejoin !== undefined) {
    groupAttrs.push(`stroke-linejoin="${inheritedStrokeLinejoin}"`);
  }

  const groupAttrString =
    groupAttrs.length > 0 ? ` ${groupAttrs.join(" ")}` : "";

  const transformParts: string[] = [
    `translate(${baseIconX}, ${baseIconY})`,
    `scale(${scale})`,
  ];
  if (needsViewBoxOffset) {
    transformParts.push(`translate(${-vbMinX}, ${-vbMinY})`);
  }
  const combinedTransform = transformParts.join(" ");

  const finalSize = outputSize ?? size;
  const bgElements = backgroundElement
    ? `${gradientDef ? `${gradientDef}\n` : ""}  ${backgroundElement}\n`
    : "";

  return `<svg width="${finalSize}" height="${finalSize}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
${bgElements}  <g transform="${combinedTransform}"${groupAttrString}>
    ${coloredContent}
  </g>
</svg>`;
}
