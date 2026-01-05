/**
 * Utility for managing color history in local storage
 */

const STORAGE_KEY_BACKGROUND = "zdk-icon-generator:bg-colors";
const STORAGE_KEY_ICON = "zdk-icon-generator:icon-colors";
const MAX_HISTORY_SIZE = 5;

export type ColorType = "background" | "icon";

function getStorageKey(type: ColorType): string {
  return type === "background" ? STORAGE_KEY_BACKGROUND : STORAGE_KEY_ICON;
}

/**
 * Get recent colors from local storage
 */
export function getRecentColors(type: ColorType): string[] {
  if (typeof window === "undefined") return [];

  try {
    const key = getStorageKey(type);
    const stored = localStorage.getItem(key);
    if (!stored) return [];

    const colors = JSON.parse(stored) as string[];
    // Validate that all items are valid hex colors
    return colors.filter((color) => /^#[0-9A-Fa-f]{6}$/.test(color));
  } catch (error) {
    console.error(`Error reading color history for ${type}:`, error);
    return [];
  }
}

/**
 * Add a color to the history (most recent first)
 */
export function addColorToHistory(type: ColorType, color: string): void {
  if (typeof window === "undefined") return;

  // Validate color format
  if (!/^#[0-9A-Fa-f]{6}$/.test(color)) return;

  try {
    const key = getStorageKey(type);
    const current = getRecentColors(type);

    // Remove the color if it already exists (to avoid duplicates)
    const filtered = current.filter(
      (c) => c.toLowerCase() !== color.toLowerCase()
    );

    // Add the new color at the beginning
    const updated = [color, ...filtered].slice(0, MAX_HISTORY_SIZE);

    localStorage.setItem(key, JSON.stringify(updated));
  } catch (error) {
    console.error(`Error saving color history for ${type}:`, error);
  }
}
