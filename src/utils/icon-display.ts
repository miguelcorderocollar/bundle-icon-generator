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
    preserveAspectRatio?: boolean;
  } = {}
): string | null {
  try {
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgString, "image/svg+xml");
    const svgElement = svgDoc.querySelector("svg");
    if (!svgElement) return null;

    // If preserveAspectRatio is true, use max-width/max-height instead of fixed dimensions
    if (options.preserveAspectRatio) {
      const style = svgElement.getAttribute("style") || "";
      const maxWidth = options.width !== undefined ? `max-width: ${options.width}px;` : "";
      const maxHeight = options.height !== undefined ? `max-height: ${options.height}px;` : "";
      svgElement.setAttribute("style", `${style} ${maxWidth} ${maxHeight} display: block;`.trim());
    } else {
      // Set size attributes
      if (options.width !== undefined) {
        svgElement.setAttribute("width", String(options.width));
      }
      if (options.height !== undefined) {
        svgElement.setAttribute("height", String(options.height));
      }
      svgElement.setAttribute("style", "display: block;");
    }
    
    // Set optional attributes
    if (options.className) {
      svgElement.setAttribute("class", options.className);
    }

    // Don't modify fill/stroke - preserve original SVG structure
    // The SVGs already use currentColor where appropriate

    return svgElement.outerHTML;
  } catch (error) {
    console.error("Error parsing SVG:", error);
    return null;
  }
}

