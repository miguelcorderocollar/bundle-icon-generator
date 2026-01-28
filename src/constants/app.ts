/**
 * Application-wide constants
 */

export const APP_NAME = "App Icon Generator";
export const APP_DESCRIPTION = "Generate icon bundles for any platform";

/**
 * Icon pack identifiers
 */
export const ICON_PACKS = {
  ALL: "all",
  GARDEN: "garden",
  FEATHER: "feather",
  REMIXICON: "remixicon",
  EMOJI: "emoji",
  CUSTOM_SVG: "custom-svg",
  CUSTOM_IMAGE: "custom-image",
  CANVAS: "canvas",
} as const;

export type IconPack = (typeof ICON_PACKS)[keyof typeof ICON_PACKS];

/**
 * Preview types
 */
export const PREVIEW_TYPES = {
  PNG: "png",
  SVG: "svg",
} as const;

export type PreviewType = (typeof PREVIEW_TYPES)[keyof typeof PREVIEW_TYPES];

/**
 * PNG file specifications
 */
export const PNG_SPECS = {
  LOGO: {
    filename: "logo.png",
    width: 320,
    height: 320,
    description: "Large icon displayed in Zendesk admin pages",
  },
  LOGO_SMALL: {
    filename: "logo-small.png",
    width: 128,
    height: 128,
    description: "Small icon displayed in the header of the app",
  },
} as const;

/**
 * SVG file specifications
 */
export const SVG_SPECS = {
  DISPLAY_SIZE: 18,
  PADDED_SIZE: 30,
  DESCRIPTION: "Optimized for 18×18 display",
} as const;

/**
 * Default color values
 */
export const DEFAULT_COLORS = {
  BACKGROUND: "#063940",
  ICON: "#ffffff",
} as const;

/**
 * Layout breakpoints and sizing
 */
export const LAYOUT = {
  MOBILE_MIN_HEIGHT: 400,
  PANE_WIDTH_DESKTOP: "1/3",
} as const;

/**
 * Icon grid defaults
 */
export const ICON_GRID = {
  DEFAULT_ICON_SIZE: 64, // px - sensible default size for icons (smaller = more columns fit)
  MIN_ICON_SIZE: 48, // px - minimum icon size
  GAP: 8, // px - gap between icons
} as const;
