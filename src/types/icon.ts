/**
 * Icon pack metadata
 */
export type IconPack = 'zendesk-garden' | 'feather' | 'remixicon' | 'emoji' | 'custom-svg' | 'custom-image';

/**
 * Icon pack license information
 */
export interface IconPackLicense {
  name: string;
  type: string;
  url: string;
}

/**
 * Normalized icon metadata
 */
export interface IconMetadata {
  /** Unique identifier for the icon (pack-name-variant) */
  id: string;
  /** Display name (human-readable) */
  name: string;
  /** Icon pack source */
  pack: IconPack;
  /** Variant identifier (e.g., 'fill', 'stroke', '12', '16') */
  variant?: string;
  /** SVG content (required for SVG icons, empty string for custom images) */
  svg: string;
  /** Searchable keywords */
  keywords: string[];
  /** Category (e.g., for RemixIcon: 'Arrows', 'Buildings', etc.) */
  category?: string;
  /** Original size if applicable (e.g., 12, 16, 24) */
  size?: number;
  /** Whether this icon is rasterized (e.g., emoji) and cannot have colors customized */
  isRasterized?: boolean;
  /** Whether color customization should be applied (for custom SVGs) */
  allowColorOverride?: boolean;
  /** Whether this is a custom uploaded image (PNG/JPG/WebP) - only for PNG export */
  isCustomImage?: boolean;
  /** Base64 data URL for custom images */
  imageDataUrl?: string;
}

/**
 * Icon catalog structure
 */
export interface IconCatalog {
  /** Metadata about the catalog */
  meta: {
    version: string;
    generatedAt: string;
    totalIcons: number;
  };
  /** License information for each pack */
  licenses: Record<IconPack, IconPackLicense>;
  /** All icons indexed by ID */
  icons: Record<string, IconMetadata>;
  /** Icons grouped by pack */
  byPack: Record<IconPack, string[]>;
}

