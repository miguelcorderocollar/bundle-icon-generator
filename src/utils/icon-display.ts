/**
 * Utilities for displaying SVG icons in the UI
 * Preserves original SVG structure to allow currentColor to work with themes
 */

/**
 * Prepare SVG for display by setting size attributes while preserving original structure
 * This allows currentColor to work and respect theme changes
 */
export function prepareSvgForDisplay(
  svgString: string,
  options: {
    width?: string | number;
    height?: string | number;
    className?: string;
  } = {}
): string | null {
  try {
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgString, "image/svg+xml");
    const svgElement = svgDoc.querySelector("svg");
    if (!svgElement) return null;

    // Set size attributes
    if (options.width !== undefined) {
      svgElement.setAttribute("width", String(options.width));
    }
    if (options.height !== undefined) {
      svgElement.setAttribute("height", String(options.height));
    }
    
    // Set optional attributes
    if (options.className) {
      svgElement.setAttribute("class", options.className);
    }
    svgElement.setAttribute("style", "display: block;");

    // Don't modify fill/stroke - preserve original SVG structure
    // The SVGs already use currentColor where appropriate

    return svgElement.outerHTML;
  } catch (error) {
    console.error("Error parsing SVG:", error);
    return null;
  }
}

