import * as fs from "fs";
import * as path from "path";
import type { IconMetadata, IconPackLicense } from "../types/icon";

const PACK_NAME = "feather" as const;

/**
 * License information for Feather icons
 */
export const LICENSE: IconPackLicense = {
  name: "MIT",
  type: "MIT",
  url: "https://github.com/feathericons/feather/blob/master/LICENSE",
};

/**
 * Extract keywords from icon name
 * Converts "alert-circle" -> ["alert", "circle"]
 */
function extractKeywords(name: string): string[] {
  return name.split("-").map((part) => part.toLowerCase());
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

  // Remove class attribute (feather-specific)
  normalized = normalized.replace(/\s*class="[^"]*"/g, "");

  return normalized.trim();
}

/**
 * Generate icon ID
 */
function generateId(name: string): string {
  return `${PACK_NAME}-${name}`;
}

/**
 * Read and process Feather icons from node_modules
 */
export function ingestFeatherIcons(nodeModulesPath: string): IconMetadata[] {
  const icons: IconMetadata[] = [];
  const featherPath = path.join(
    nodeModulesPath,
    "feather-icons",
    "dist",
    "icons"
  );

  if (!fs.existsSync(featherPath)) {
    console.warn(`Feather icons not found at ${featherPath}`);
    return icons;
  }

  const files = fs.readdirSync(featherPath);
  const svgFiles = files.filter((file) => file.endsWith(".svg"));

  for (const file of svgFiles) {
    try {
      const filePath = path.join(featherPath, file);
      const svgContent = fs.readFileSync(filePath, "utf-8");
      const nameWithoutExt = file.replace(/\.svg$/, "");
      const keywords = extractKeywords(nameWithoutExt);

      // Feather icons are typically 24x24
      keywords.push("24px");

      const icon: IconMetadata = {
        id: generateId(nameWithoutExt),
        name: nameWithoutExt
          .split("-")
          .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
          .join(" "),
        pack: PACK_NAME,
        svg: normalizeSVG(svgContent),
        keywords,
        size: 24,
      };

      icons.push(icon);
    } catch (error) {
      console.error(`Error processing ${file}:`, error);
    }
  }

  return icons;
}
