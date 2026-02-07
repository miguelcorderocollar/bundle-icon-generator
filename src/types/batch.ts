/**
 * Batch generator type definitions
 * Used for bulk icon generation with CSV import support
 */

import type { BackgroundValue } from "@/src/utils/gradients";

/**
 * Valid sources for batch icons
 */
export type BatchIconSource =
  | "zendesk-garden"
  | "feather"
  | "remixicon"
  | "emoji"
  | "upload";

/**
 * All valid batch icon sources
 */
export const BATCH_ICON_SOURCES: BatchIconSource[] = [
  "zendesk-garden",
  "feather",
  "remixicon",
  "emoji",
  "upload",
];

/**
 * Check if a string is a valid batch icon source
 */
export function isBatchIconSource(value: string): value is BatchIconSource {
  return BATCH_ICON_SOURCES.includes(value as BatchIconSource);
}

/**
 * Single batch row configuration
 */
export interface BatchIconConfig {
  /** Unique row ID (UUID) */
  id: string;
  /** Folder name in ZIP output */
  projectName: string;
  /** Where the icon comes from */
  source: BatchIconSource;
  /** Icon ID (from catalog) or uploaded filename */
  iconName: string;
  /** Resolved icon catalog ID (may differ from iconName for uploads) */
  iconId?: string;
  /** Style preset ID for colors */
  stylePresetId: string;
  /** Per-row format preset override (undefined = use global) */
  formatPresetId?: string;
  /** Icon size percentage (0-100) */
  iconSize: number;
  /** Resolved background color from style preset */
  resolvedBackgroundColor?: BackgroundValue;
  /** Resolved icon color from style preset */
  resolvedIconColor?: string;
}

/**
 * Uploaded asset reference for batch generator
 */
export interface UploadedAsset {
  /** User-visible name (filename without extension) */
  name: string;
  /** Original filename with extension */
  filename: string;
  /** Detected asset type */
  type: "svg" | "image";
  /** Base64 data URL */
  dataUrl: string;
  /** Generated icon ID for catalog lookup */
  iconId: string;
  /** SVG content if type is svg */
  svgContent?: string;
}

/**
 * Batch page state
 */
export interface BatchState {
  /** Uploaded images/SVGs for batch use */
  uploadedAssets: UploadedAsset[];
  /** Configured batch rows */
  configs: BatchIconConfig[];
  /** Global default format preset ID */
  globalFormatPresetId: string;
}

/**
 * Default batch state
 */
export const DEFAULT_BATCH_STATE: BatchState = {
  uploadedAssets: [],
  configs: [],
  globalFormatPresetId: "zendesk-app",
};

/**
 * CSV column names (in order)
 */
export const CSV_COLUMNS = [
  "project",
  "format_preset",
  "source",
  "icon_name",
  "style",
  "icon_size",
] as const;

export type CsvColumnName = (typeof CSV_COLUMNS)[number];

/**
 * CSV parsing error for a specific row/column
 */
export interface CsvParseError {
  /** 1-based row number in CSV */
  row: number;
  /** Column name that has the error */
  column: CsvColumnName | "general";
  /** Human-readable error message */
  message: string;
}

/**
 * Result of parsing a CSV file
 */
export interface CsvParseResult {
  /** Whether parsing was successful (no errors) */
  success: boolean;
  /** Parsed configurations (may be partial if errors occurred) */
  configs: BatchIconConfig[];
  /** Errors encountered during parsing */
  errors: CsvParseError[];
  /** Non-fatal warnings */
  warnings: string[];
}

/**
 * Options for a single CSV option entry
 */
export interface CsvOptionEntry {
  /** Option type (format_preset, source, style) */
  optionType: "format_preset" | "source" | "style";
  /** Option ID to use in CSV */
  optionId: string;
  /** Human-readable name */
  optionName: string;
  /** Description of the option */
  description: string;
}

/**
 * Batch export validation result
 */
export interface BatchValidationResult {
  /** Whether all configs are valid */
  valid: boolean;
  /** Errors by config ID */
  errors: Map<string, string[]>;
  /** Global errors (not specific to a config) */
  globalErrors: string[];
}

/**
 * Batch export progress
 */
export interface BatchExportProgress {
  /** Current phase of export */
  phase: "validating" | "rendering" | "packaging" | "complete" | "error";
  /** Current item being processed (0-based index) */
  currentIndex: number;
  /** Total number of items to process */
  totalItems: number;
  /** Current item name being processed */
  currentItemName?: string;
  /** Error message if phase is 'error' */
  error?: string;
}

/**
 * Batch manifest included in ZIP export
 */
export interface BatchManifest {
  /** Export timestamp (ISO string) */
  exportedAt: string;
  /** Manifest version */
  version: string;
  /** Number of projects exported */
  projectCount: number;
  /** Details for each project */
  projects: BatchManifestProject[];
}

/**
 * Single project entry in batch manifest
 */
export interface BatchManifestProject {
  /** Project/folder name */
  name: string;
  /** Icon source */
  source: BatchIconSource;
  /** Icon name/ID */
  iconName: string;
  /** Style preset used */
  style: string;
  /** Format preset used */
  formatPreset: string;
  /** Icon size percentage */
  iconSize: number;
}
