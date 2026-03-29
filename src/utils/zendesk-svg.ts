/**
 * Utilities for Zendesk location SVG handling.
 *
 * These helpers are used only for Zendesk location icon exports
 * (icon_top_bar.svg, icon_nav_bar.svg, icon_ticket_editor.svg).
 */

export const ZENDESK_LOCATION_SVG_FILES = [
  "icon_top_bar.svg",
  "icon_ticket_editor.svg",
  "icon_nav_bar.svg",
];

export function isZendeskLocationSvgFile(filename: string): boolean {
  return ZENDESK_LOCATION_SVG_FILES.includes(filename);
}

export interface ZendeskSvgAnalysis {
  hasSymbolElements: boolean;
  hasDefaultSymbol: boolean;
  hasRasterImage: boolean;
  hasHardcodedPaint: boolean;
  hasUnsupportedPaintServers: boolean;
}

interface ParsedSvgRoot {
  openTag: string;
  innerContent: string;
}

interface ParsedSymbol {
  attrs: string;
  innerContent: string;
}

function parseSvgRoot(svg: string): ParsedSvgRoot | null {
  const openTagMatch = svg.match(/<svg\b[^>]*>/i);
  const rootMatch = svg.match(/<svg\b[^>]*>([\s\S]*?)<\/svg>/i);
  if (!openTagMatch || !rootMatch) {
    return null;
  }

  return {
    openTag: openTagMatch[0],
    innerContent: rootMatch[1],
  };
}

function parseDefaultSymbol(svg: string): ParsedSymbol | null {
  const symbolRegex = /<symbol\b([^>]*)>([\s\S]*?)<\/symbol>/gi;
  let match: RegExpExecArray | null;

  while ((match = symbolRegex.exec(svg)) !== null) {
    const attrs = match[1] ?? "";
    const idMatch = attrs.match(/\bid=["']([^"']+)["']/i);
    const id = idMatch?.[1]?.trim().toLowerCase();
    if (id === "default") {
      return {
        attrs,
        innerContent: match[2] ?? "",
      };
    }
  }

  return null;
}

function hasAttr(tag: string, attrName: string): boolean {
  const regex = new RegExp(`\\b${attrName}=["'][^"']*["']`, "i");
  return regex.test(tag);
}

function getAttr(tag: string, attrName: string): string | null {
  const regex = new RegExp(`\\b${attrName}=["']([^"']*)["']`, "i");
  const match = tag.match(regex);
  return match?.[1] ?? null;
}

function withAttr(tag: string, attrName: string, attrValue: string): string {
  const attrRegex = new RegExp(`\\b${attrName}=["'][^"']*["']`, "i");
  if (attrRegex.test(tag)) {
    return tag.replace(attrRegex, `${attrName}="${attrValue}"`);
  }
  return tag.replace(/>$/, ` ${attrName}="${attrValue}">`);
}

function isPreservedPaintValue(rawValue: string): boolean {
  const value = rawValue.trim().toLowerCase();
  if (!value) return false;
  if (value === "none" || value === "transparent") return true;
  if (value.startsWith("url(")) return true;
  return false;
}

function isCurrentColorValue(rawValue: string): boolean {
  const value = rawValue.trim().toLowerCase();
  return value === "currentcolor" || value === "current-color";
}

function normalizePaintAttributesToCurrentColor(input: string): string {
  let result = input;

  result = result.replace(/fill=["']([^"']*)["']/gi, (match, fillValue) => {
    if (
      isPreservedPaintValue(fillValue) ||
      isCurrentColorValue(fillValue) ||
      fillValue.trim() === ""
    ) {
      return match;
    }
    return 'fill="currentColor"';
  });

  result = result.replace(/stroke=["']([^"']*)["']/gi, (match, strokeValue) => {
    if (
      isPreservedPaintValue(strokeValue) ||
      isCurrentColorValue(strokeValue) ||
      strokeValue.trim() === ""
    ) {
      return match;
    }
    return 'stroke="currentColor"';
  });

  result = result.replace(
    /fill:\s*([^;]+)(;?)/gi,
    (match, fillValue: string, suffix: string) => {
      if (
        isPreservedPaintValue(fillValue) ||
        isCurrentColorValue(fillValue) ||
        fillValue.trim() === ""
      ) {
        return match;
      }
      return `fill: currentColor${suffix}`;
    }
  );

  result = result.replace(
    /stroke:\s*([^;]+)(;?)/gi,
    (match, strokeValue: string, suffix: string) => {
      if (
        isPreservedPaintValue(strokeValue) ||
        isCurrentColorValue(strokeValue) ||
        strokeValue.trim() === ""
      ) {
        return match;
      }
      return `stroke: currentColor${suffix}`;
    }
  );

  return result;
}

function detectHardcodedPaint(input: string): boolean {
  const attrRegex = /(fill|stroke)=["']([^"']*)["']/gi;
  let attrMatch: RegExpExecArray | null;
  while ((attrMatch = attrRegex.exec(input)) !== null) {
    const value = attrMatch[2] ?? "";
    if (
      value.trim() !== "" &&
      !isPreservedPaintValue(value) &&
      !isCurrentColorValue(value)
    ) {
      return true;
    }
  }

  const styleRegex = /(fill|stroke)\s*:\s*([^;]+)(;?)/gi;
  let styleMatch: RegExpExecArray | null;
  while ((styleMatch = styleRegex.exec(input)) !== null) {
    const value = styleMatch[2] ?? "";
    if (
      value.trim() !== "" &&
      !isPreservedPaintValue(value) &&
      !isCurrentColorValue(value)
    ) {
      return true;
    }
  }

  return false;
}

export function analyzeZendeskSvg(svg: string): ZendeskSvgAnalysis {
  const hasSymbolElements = /<symbol\b/i.test(svg);
  const hasDefaultSymbol = /<symbol\b[^>]*\bid=["']default["'][^>]*>/i.test(
    svg
  );
  const hasRasterImage = /<image\b/i.test(svg);
  const hasUnsupportedPaintServers =
    /<(linearGradient|radialGradient|pattern|filter)\b/i.test(svg);
  const hasHardcodedPaint = detectHardcodedPaint(svg);

  return {
    hasSymbolElements,
    hasDefaultSymbol,
    hasRasterImage,
    hasHardcodedPaint,
    hasUnsupportedPaintServers,
  };
}

export function toZendeskStaticSvgSource(svg: string): string {
  const root = parseSvgRoot(svg);
  if (!root) {
    throw new Error("Invalid SVG format");
  }

  let openTag = root.openTag;
  let content = root.innerContent;

  const defaultSymbol = parseDefaultSymbol(svg);
  if (defaultSymbol) {
    // Promote <symbol id="default"> to a plain <svg> source for static export.
    openTag = `<svg${defaultSymbol.attrs ? ` ${defaultSymbol.attrs.trim()}` : ""}>`;
    content = defaultSymbol.innerContent;

    // Carry the root viewBox when the symbol doesn't provide one.
    if (!hasAttr(openTag, "viewBox")) {
      const rootViewBox = getAttr(root.openTag, "viewBox");
      if (rootViewBox) {
        openTag = withAttr(openTag, "viewBox", rootViewBox);
      }
    }
  }

  const normalizedOpenTag = normalizePaintAttributesToCurrentColor(openTag);
  const normalizedContent = normalizePaintAttributesToCurrentColor(content);

  return `${normalizedOpenTag}${normalizedContent}</svg>`;
}
