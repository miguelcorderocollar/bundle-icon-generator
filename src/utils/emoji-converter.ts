/**
 * Emoji conversion utilities
 * Converts emoji characters to SVG format compatible with the icon system
 */

import type { IconMetadata } from "../types/icon";

// Cache for emoji data URLs to avoid re-rendering
const emojiDataUrlCache = new Map<string, string>();

/**
 * Check if a string contains valid emoji characters
 */
export function isValidEmoji(text: string): boolean {
  // Remove whitespace and check if remaining is emoji
  const trimmed = text.trim();
  if (!trimmed) return false;

  // Unicode emoji regex pattern (covers most emoji ranges)
  const emojiRegex =
    /^[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{2190}-\u{21FF}]|[\u{2300}-\u{23FF}]|[\u{2B50}-\u{2B55}]|[\u{3030}-\u{303F}]|[\u{3297}-\u{3299}]/u;

  // Check if the trimmed string matches emoji pattern
  // Also handle multi-codepoint emojis (like flags, skin tones, etc.)
  return emojiRegex.test(trimmed) || /[\u{1F300}-\u{1FAFF}]/u.test(trimmed);
}

/**
 * Extract emoji from text (get first emoji found)
 */
export function extractEmoji(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  // Try to match emoji pattern
  const emojiMatch = trimmed.match(
    /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{2190}-\u{21FF}]|[\u{2300}-\u{23FF}]|[\u{2B50}-\u{2B55}]|[\u{3030}-\u{303F}]|[\u{3297}-\u{3299}]/u
  );
  
  if (emojiMatch) {
    return emojiMatch[0];
  }

  // Fallback: check if entire string is emoji
  if (isValidEmoji(trimmed)) {
    return trimmed;
  }

  return null;
}

/**
 * Generate a unique ID for an emoji based on its unicode codepoints
 */
function generateEmojiId(emoji: string): string {
  // Convert emoji to codepoints and create a hash-like ID
  const codepoints = Array.from(emoji)
    .map((char) => char.codePointAt(0)?.toString(16))
    .filter(Boolean)
    .join("-");
  return `emoji-${codepoints}`;
}

/**
 * Get emoji name/description (simple fallback - could be enhanced with a library)
 */
function getEmojiName(emoji: string): string {
  // Simple approach - could use emoji-mart or similar for better names
  // For now, return a generic name with the emoji
  return `Emoji ${emoji}`;
}

/**
 * Render emoji to canvas and get data URL
 */
async function emojiToDataUrl(
  emoji: string,
  size: number = 256
): Promise<string> {
  // Check cache first
  const cacheKey = `${emoji}-${size}`;
  if (emojiDataUrlCache.has(cacheKey)) {
    return emojiDataUrlCache.get(cacheKey)!;
  }

  return new Promise((resolve, reject) => {
    // Create offscreen canvas for rendering
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject(new Error("Failed to get canvas context"));
      return;
    }

    // Clear canvas with transparent background
    ctx.clearRect(0, 0, size, size);

    // Set font size (use large size for crisp rendering)
    const fontSize = Math.floor(size * 0.8);
    ctx.font = `${fontSize}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "EmojiOne Color", "Android Emoji", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Draw emoji
    ctx.fillText(emoji, size / 2, size / 2);

    // Convert to data URL
    try {
      const dataUrl = canvas.toDataURL("image/png");
      emojiDataUrlCache.set(cacheKey, dataUrl);
      resolve(dataUrl);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Convert emoji to SVG wrapper compatible with icon system
 */
export async function emojiToSvgWrapper(
  emoji: string,
  size: number = 24
): Promise<string> {
  // Render emoji at high resolution for quality
  const renderSize = 256;
  const dataUrl = await emojiToDataUrl(emoji, renderSize);

  // Create SVG wrapper with image element
  // Use 24x24 viewBox to match standard icon size
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <image href="${dataUrl}" width="${size}" height="${size}" x="0" y="0"/>
</svg>`;
}

/**
 * Create IconMetadata from emoji
 */
export async function createEmojiMetadata(emoji: string): Promise<IconMetadata> {
  const id = generateEmojiId(emoji);
  const name = getEmojiName(emoji);
  const svg = await emojiToSvgWrapper(emoji);
  
  // Generate keywords for searchability
  const keywords = [
    "emoji",
    emoji,
    name.toLowerCase(),
    ...name.split(" ").map((w) => w.toLowerCase()),
  ];

  return {
    id,
    name,
    pack: "emoji",
    svg,
    keywords,
    size: 24,
    isRasterized: true,
  };
}

/**
 * Clear emoji cache (useful for memory management)
 */
export function clearEmojiCache(): void {
  emojiDataUrlCache.clear();
}

