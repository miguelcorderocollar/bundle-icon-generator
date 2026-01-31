/**
 * SVG manipulation utilities
 *
 * Functions for parsing, transforming, and normalizing SVG content.
 */

/**
 * Apply color replacement to SVG content
 * Replaces fill and stroke attributes (excluding 'none' and gradient urls)
 * Also replaces 'currentColor' references
 */
export function applySvgColor(svgContent: string, color: string): string {
  let result = svgContent.replace(
    /fill="(?!none|url)([^"]*)"/gi,
    `fill="${color}"`
  );
  result = result.replace(
    /stroke="(?!none|url)([^"]*)"/gi,
    `stroke="${color}"`
  );
  result = result.replace(/currentColor/gi, color);
  return result;
}

/**
 * Normalize SVG to have explicit width/height from viewBox
 * This fixes issues with SVGs that only have viewBox (like RemixIcon)
 *
 * @param svgContent - The SVG string to normalize
 * @returns Object containing the normalized SVG string and its dimensions
 */
export function normalizeSvgDimensions(svgContent: string): {
  svg: string;
  width: number;
  height: number;
} {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgContent, "image/svg+xml");
  const svgEl = doc.querySelector("svg");

  if (!svgEl) {
    return { svg: svgContent, width: 24, height: 24 };
  }

  // Try to get dimensions from viewBox first
  const viewBox = svgEl.getAttribute("viewBox");
  let width = 24;
  let height = 24;

  if (viewBox) {
    const parts = viewBox.split(/\s+|,/).map(Number);
    if (parts.length >= 4) {
      width = parts[2] || 24;
      height = parts[3] || 24;
    }
  }

  // Check for explicit width/height attributes
  const attrWidth = svgEl.getAttribute("width");
  const attrHeight = svgEl.getAttribute("height");

  if (attrWidth && !attrWidth.includes("%")) {
    width = parseFloat(attrWidth) || width;
  }
  if (attrHeight && !attrHeight.includes("%")) {
    height = parseFloat(attrHeight) || height;
  }

  // Set explicit width/height on the SVG element
  svgEl.setAttribute("width", String(width));
  svgEl.setAttribute("height", String(height));

  // Ensure viewBox is set
  if (!viewBox) {
    svgEl.setAttribute("viewBox", `0 0 ${width} ${height}`);
  }

  return {
    svg: new XMLSerializer().serializeToString(svgEl),
    width,
    height,
  };
}

/**
 * Extract viewBox from SVG content
 *
 * @param svgContent - The SVG string
 * @returns The viewBox object or null if not found
 */
export function extractViewBox(
  svgContent: string
): { x: number; y: number; width: number; height: number } | null {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgContent, "image/svg+xml");
  const svgEl = doc.querySelector("svg");

  if (!svgEl) return null;

  const viewBox = svgEl.getAttribute("viewBox");
  if (!viewBox) return null;

  const parts = viewBox.split(/\s+|,/).map(Number);
  if (parts.length >= 4) {
    return {
      x: parts[0],
      y: parts[1],
      width: parts[2],
      height: parts[3],
    };
  }

  return null;
}

/**
 * Get SVG dimensions (from viewBox or width/height attributes)
 *
 * @param svgContent - The SVG string
 * @returns Object with width and height
 */
export function getSvgDimensions(svgContent: string): {
  width: number;
  height: number;
} {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgContent, "image/svg+xml");
  const svgEl = doc.querySelector("svg");

  if (!svgEl) {
    return { width: 24, height: 24 };
  }

  // Try viewBox first
  const viewBox = svgEl.getAttribute("viewBox");
  if (viewBox) {
    const parts = viewBox.split(/\s+|,/).map(Number);
    if (parts.length >= 4) {
      return { width: parts[2] || 24, height: parts[3] || 24 };
    }
  }

  // Fall back to attributes
  const attrWidth = svgEl.getAttribute("width");
  const attrHeight = svgEl.getAttribute("height");

  return {
    width:
      attrWidth && !attrWidth.includes("%") ? parseFloat(attrWidth) || 24 : 24,
    height:
      attrHeight && !attrHeight.includes("%")
        ? parseFloat(attrHeight) || 24
        : 24,
  };
}
