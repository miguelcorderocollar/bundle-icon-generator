import * as fs from "fs";
import * as path from "path";
import type { IconMetadata, IconPackLicense } from "../types/icon";

const PACK_NAME = "remixicon" as const;

/**
 * License information for RemixIcon
 */
export const LICENSE: IconPackLicense = {
  name: "Apache-2.0",
  type: "Apache-2.0",
  url: "https://github.com/Remix-Design/RemixIcon/blob/master/License",
};

/**
 * Extract keywords from icon name
 * Converts "24-hours-fill" -> ["24", "hours"]
 * Removes variant suffixes (-fill, -line)
 */
function extractKeywords(name: string): string[] {
  return name
    .replace(/-fill$/, "")
    .replace(/-line$/, "")
    .split("-")
    .map((part) => part.toLowerCase());
}

/**
 * Normalize SVG content
 * Ensures consistent format and removes unnecessary attributes
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

  // Remove fill="currentColor" if present (we'll handle color separately)
  // Actually, keep it as it's useful for theming, but ensure it's consistent
  normalized = normalized.replace(
    /\s*fill="currentColor"/g,
    ' fill="currentColor"'
  );

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

  if (nameWithoutExt.endsWith("-fill")) {
    return {
      baseName: nameWithoutExt.replace(/-fill$/, ""),
      variant: "fill",
    };
  }

  if (nameWithoutExt.endsWith("-line")) {
    return {
      baseName: nameWithoutExt.replace(/-line$/, ""),
      variant: "line",
    };
  }

  return {
    baseName: nameWithoutExt,
    variant: "default",
  };
}

/**
 * Generate icon ID
 */
function generateId(baseName: string, variant: string): string {
  const parts = [PACK_NAME, baseName];
  if (variant !== "default") {
    parts.push(variant);
  }
  return parts.join("-");
}

/**
 * Read and process RemixIcon icons from node_modules
 */
export function ingestRemixIconIcons(nodeModulesPath: string): IconMetadata[] {
  const icons: IconMetadata[] = [];
  const remixiconPath = path.join(nodeModulesPath, "remixicon", "icons");

  if (!fs.existsSync(remixiconPath)) {
    console.warn(`RemixIcon icons not found at ${remixiconPath}`);
    return icons;
  }

  // Get all category directories
  const categoryDirs = fs
    .readdirSync(remixiconPath, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  for (const categoryDir of categoryDirs) {
    const categoryPath = path.join(remixiconPath, categoryDir);
    const files = fs.readdirSync(categoryPath);
    const svgFiles = files.filter((file) => file.endsWith(".svg"));

    for (const file of svgFiles) {
      try {
        const filePath = path.join(categoryPath, file);
        const svgContent = fs.readFileSync(filePath, "utf-8");
        const { baseName, variant } = parseIconName(file);
        const keywords = extractKeywords(baseName);

        // Add category and variant to keywords for better searchability
        keywords.push(categoryDir.toLowerCase());
        if (variant !== "default") {
          keywords.push(variant);
        }
        // RemixIcon icons are 24x24
        keywords.push("24px");

        const icon: IconMetadata = {
          id: generateId(baseName, variant),
          name: baseName
            .split("-")
            .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
            .join(" "),
          pack: PACK_NAME,
          variant,
          svg: normalizeSVG(svgContent),
          keywords,
          category: categoryDir, // Store the category explicitly
          size: 24,
        };

        icons.push(icon);
      } catch (error) {
        console.error(`Error processing ${file}:`, error);
      }
    }
  }

  return icons;
}
