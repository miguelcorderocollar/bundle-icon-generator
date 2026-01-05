import * as fs from "fs";
import * as path from "path";
import type { IconMetadata, IconPackLicense } from "../types/icon";

const PACK_NAME = "zendesk-garden" as const;

/**
 * License information for Zendesk Garden icons
 */
export const LICENSE: IconPackLicense = {
  name: "Apache-2.0",
  type: "Apache-2.0",
  url: "https://github.com/zendeskgarden/svg-icons/blob/main/LICENSE.md",
};

/**
 * Extract keywords from icon name
 * Converts "alert-error-fill" -> ["alert", "error", "fill"]
 */
function extractKeywords(name: string): string[] {
  return name
    .split("-")
    .filter((part) => part !== "fill" && part !== "stroke")
    .map((part) => part.toLowerCase());
}

/**
 * Normalize SVG content
 * Removes unnecessary attributes and ensures consistent format
 */
function normalizeSVG(svgContent: string): string {
  // Remove XML declaration if present
  let normalized = svgContent.replace(/<\?xml[^>]*\?>/g, "").trim();

  // Ensure SVG has proper namespace
  if (!normalized.includes("xmlns=")) {
    normalized = normalized.replace(
      /<svg/,
      '<svg xmlns="http://www.w3.org/2000/svg"'
    );
  }

  // Remove focusable attribute if present (not needed for our use case)
  normalized = normalized.replace(/\s*focusable="[^"]*"/g, "");

  return normalized.trim();
}

/**
 * Parse icon name to extract base name and variant
 */
function parseIconName(filename: string): {
  baseName: string;
  variant: string;
} {
  const nameWithoutExt = filename.replace(/\.svg$/, "");
  const parts = nameWithoutExt.split("-");
  const lastPart = parts[parts.length - 1];

  if (lastPart === "fill" || lastPart === "stroke") {
    return {
      baseName: parts.slice(0, -1).join("-"),
      variant: lastPart,
    };
  }

  return {
    baseName: nameWithoutExt,
    variant: "default",
  };
}

/**
 * Extract size from directory path (12 or 16)
 */
function extractSize(dirPath: string): number | undefined {
  // Match the size directory name (e.g., "12" or "16")
  const match = dirPath.match(/(?:^|\/)(\d+)(?:\/|$)/);
  return match ? parseInt(match[1], 10) : undefined;
}

/**
 * Generate icon ID
 */
function generateId(baseName: string, variant: string, size?: number): string {
  const parts = [PACK_NAME, baseName];
  if (variant !== "default") {
    parts.push(variant);
  }
  if (size) {
    parts.push(size.toString());
  }
  return parts.join("-");
}

/**
 * Read and process Zendesk Garden icons from node_modules
 * Deduplicates icons by base name and variant, preferring 16px over 12px
 */
export function ingestZendeskGardenIcons(
  nodeModulesPath: string
): IconMetadata[] {
  const icons: IconMetadata[] = [];
  const iconMap = new Map<string, IconMetadata>();
  const gardenPath = path.join(
    nodeModulesPath,
    "@zendeskgarden/svg-icons",
    "src"
  );

  if (!fs.existsSync(gardenPath)) {
    console.warn(`Zendesk Garden icons not found at ${gardenPath}`);
    return icons;
  }

  // Process 16px first (preferred), then 12px (as fallback)
  // This ensures we prefer 16px when duplicates exist
  const sizeDirs = ["16", "12"];

  for (const sizeDir of sizeDirs) {
    const sizePath = path.join(gardenPath, sizeDir);

    if (!fs.existsSync(sizePath)) {
      continue;
    }

    const files = fs.readdirSync(sizePath);
    const svgFiles = files.filter((file) => file.endsWith(".svg"));

    for (const file of svgFiles) {
      try {
        const filePath = path.join(sizePath, file);
        const svgContent = fs.readFileSync(filePath, "utf-8");
        const { baseName, variant } = parseIconName(file);
        const size = extractSize(sizePath);
        const keywords = extractKeywords(baseName);

        // Create a unique key for deduplication (baseName + variant, without size)
        const dedupeKey = `${baseName}-${variant}`;

        // Skip if we already have this icon (prefer 16px which we process first)
        if (iconMap.has(dedupeKey)) {
          continue;
        }

        // Add variant and size to keywords for better searchability
        if (variant !== "default") {
          keywords.push(variant);
        }
        if (size) {
          keywords.push(`${size}px`);
        }

        const icon: IconMetadata = {
          id: generateId(baseName, variant, size),
          name: baseName
            .split("-")
            .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
            .join(" "),
          pack: PACK_NAME,
          variant,
          svg: normalizeSVG(svgContent),
          keywords,
          size,
        };

        iconMap.set(dedupeKey, icon);
      } catch (error) {
        console.error(`Error processing ${file}:`, error);
      }
    }
  }

  // Convert map values to array
  return Array.from(iconMap.values());
}
