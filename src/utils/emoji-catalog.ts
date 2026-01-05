/**
 * Emoji catalog storage utilities
 * Manages user-added emojis in localStorage
 */

import type { IconMetadata } from "../types/icon";
import { createEmojiMetadata } from "./emoji-converter";

const STORAGE_PREFIX = "zdk-icon-generator";
const EMOJI_CATALOG_KEY = `${STORAGE_PREFIX}:emoji-catalog`;

/**
 * Get all user emojis from localStorage
 */
export function getUserEmojis(): IconMetadata[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = localStorage.getItem(EMOJI_CATALOG_KEY);
    if (!stored) {
      return [];
    }
    const emojis = JSON.parse(stored);
    return Array.isArray(emojis) ? emojis : [];
  } catch (error) {
    console.error("Error reading emoji catalog from localStorage:", error);
    return [];
  }
}

/**
 * Get emoji by ID
 */
export function getEmojiById(id: string): IconMetadata | null {
  const emojis = getUserEmojis();
  return emojis.find((emoji) => emoji.id === id) || null;
}

/**
 * Add emoji to catalog
 */
export async function addEmoji(emoji: string): Promise<IconMetadata> {
  if (typeof window === "undefined") {
    throw new Error("Cannot add emoji: window is not available");
  }

  try {
    // Create metadata for the emoji
    const metadata = await createEmojiMetadata(emoji);

    // Check if already exists
    const existing = getUserEmojis();
    const exists = existing.some((e) => e.id === metadata.id);

    if (exists) {
      // Return existing emoji
      return existing.find((e) => e.id === metadata.id)!;
    }

    // Add to catalog
    const updated = [...existing, metadata];
    localStorage.setItem(EMOJI_CATALOG_KEY, JSON.stringify(updated));

    return metadata;
  } catch (error) {
    console.error("Error adding emoji to catalog:", error);
    throw error;
  }
}

/**
 * Remove emoji from catalog
 */
export function removeEmoji(emojiId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const emojis = getUserEmojis();
    const filtered = emojis.filter((emoji) => emoji.id !== emojiId);
    localStorage.setItem(EMOJI_CATALOG_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Error removing emoji from catalog:", error);
  }
}

/**
 * Clear all emojis from catalog
 */
export function clearEmojiCatalog(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.removeItem(EMOJI_CATALOG_KEY);
  } catch (error) {
    console.error("Error clearing emoji catalog:", error);
  }
}

/**
 * Check if emoji exists in catalog
 */
export function hasEmoji(emojiId: string): boolean {
  return getUserEmojis().some((emoji) => emoji.id === emojiId);
}
