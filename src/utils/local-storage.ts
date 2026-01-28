/**
 * localStorage utilities for icon preferences
 * Namespaced to avoid collisions with other apps
 */

import type { BackgroundValue } from "./gradients";

const STORAGE_PREFIX = "zdk-icon-generator";
const FAVORITES_KEY = `${STORAGE_PREFIX}:favorites`;
const RECENT_KEY = `${STORAGE_PREFIX}:recent`;
const MAX_RECENT_ITEMS = 20;

/**
 * Get favorites from localStorage
 */
export function getFavorites(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    if (!stored) {
      return [];
    }
    const favorites = JSON.parse(stored);
    return Array.isArray(favorites) ? favorites : [];
  } catch (error) {
    console.error("Error reading favorites from localStorage:", error);
    return [];
  }
}

/**
 * Add an icon to favorites
 */
export function addFavorite(iconId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const favorites = getFavorites();
    if (!favorites.includes(iconId)) {
      favorites.push(iconId);
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    }
  } catch (error) {
    console.error("Error adding favorite to localStorage:", error);
  }
}

/**
 * Remove an icon from favorites
 */
export function removeFavorite(iconId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const favorites = getFavorites();
    const filtered = favorites.filter((id) => id !== iconId);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Error removing favorite from localStorage:", error);
  }
}

/**
 * Toggle favorite status of an icon
 */
export function toggleFavorite(iconId: string): boolean {
  const favorites = getFavorites();
  const isFavorite = favorites.includes(iconId);

  if (isFavorite) {
    removeFavorite(iconId);
    return false;
  } else {
    addFavorite(iconId);
    return true;
  }
}

/**
 * Check if an icon is favorited
 */
export function isFavorite(iconId: string): boolean {
  return getFavorites().includes(iconId);
}

/**
 * Get recent icons from localStorage
 */
export function getRecentIcons(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = localStorage.getItem(RECENT_KEY);
    if (!stored) {
      return [];
    }
    const recent = JSON.parse(stored);
    return Array.isArray(recent) ? recent : [];
  } catch (error) {
    console.error("Error reading recent icons from localStorage:", error);
    return [];
  }
}

/**
 * Add an icon to recent list (most recent first)
 */
export function addRecentIcon(iconId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const recent = getRecentIcons();
    // Remove if already exists (will be re-added at the front)
    const filtered = recent.filter((id) => id !== iconId);
    // Add to front
    filtered.unshift(iconId);
    // Keep only the most recent items
    const trimmed = filtered.slice(0, MAX_RECENT_ITEMS);
    localStorage.setItem(RECENT_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error("Error adding recent icon to localStorage:", error);
  }
}

/**
 * Clear recent icons
 */
export function clearRecentIcons(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.removeItem(RECENT_KEY);
  } catch (error) {
    console.error("Error clearing recent icons from localStorage:", error);
  }
}

/**
 * Generator state persistence
 */
const GENERATOR_STATE_KEY = `${STORAGE_PREFIX}:generator-state`;

export interface PersistedGeneratorState {
  selectedLocations: string[];
  selectedIconId?: string;
  backgroundColor: BackgroundValue;
  iconColor: string;
  selectedPack: string;
  iconSize: number;
  svgIconSize?: number;
}

/**
 * Save generator state to localStorage
 */
export function saveGeneratorState(state: PersistedGeneratorState): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(GENERATOR_STATE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Error saving generator state to localStorage:", error);
  }
}

/**
 * Load generator state from localStorage
 */
export function loadGeneratorState(): PersistedGeneratorState | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = localStorage.getItem(GENERATOR_STATE_KEY);
    if (!stored) {
      return null;
    }
    return JSON.parse(stored) as PersistedGeneratorState;
  } catch (error) {
    console.error("Error loading generator state from localStorage:", error);
    return null;
  }
}

/**
 * Clear generator state from localStorage
 */
export function clearGeneratorState(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.removeItem(GENERATOR_STATE_KEY);
  } catch (error) {
    console.error("Error clearing generator state from localStorage:", error);
  }
}

/**
 * Welcome modal persistence
 */
const WELCOME_SEEN_KEY = `${STORAGE_PREFIX}:welcome-seen`;

/**
 * Check if user has seen the welcome modal
 */
export function hasSeenWelcome(): boolean {
  if (typeof window === "undefined") {
    return true; // Default to true on server to avoid showing modal during SSR
  }

  try {
    return localStorage.getItem(WELCOME_SEEN_KEY) === "true";
  } catch (error) {
    console.error("Error reading welcome state from localStorage:", error);
    return false;
  }
}

/**
 * Mark welcome modal as seen
 */
export function markWelcomeSeen(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(WELCOME_SEEN_KEY, "true");
  } catch (error) {
    console.error("Error marking welcome as seen:", error);
  }
}

/**
 * Reset welcome modal (for testing/debugging)
 */
export function resetWelcome(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.removeItem(WELCOME_SEEN_KEY);
  } catch (error) {
    console.error("Error resetting welcome state:", error);
  }
}

/**
 * Admin restriction config persistence
 */
const ADMIN_CONFIG_KEY = `${STORAGE_PREFIX}:admin-config`;

/**
 * Save admin restriction config to localStorage
 */
export function saveAdminConfig(config: unknown): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(ADMIN_CONFIG_KEY, JSON.stringify(config));
  } catch (error) {
    console.error("Error saving admin config to localStorage:", error);
  }
}

/**
 * Load admin restriction config from localStorage
 */
export function loadAdminConfig(): unknown | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = localStorage.getItem(ADMIN_CONFIG_KEY);
    if (!stored) {
      return null;
    }
    return JSON.parse(stored);
  } catch (error) {
    console.error("Error loading admin config from localStorage:", error);
    return null;
  }
}

/**
 * Clear admin restriction config from localStorage
 */
export function clearAdminConfig(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.removeItem(ADMIN_CONFIG_KEY);
  } catch (error) {
    console.error("Error clearing admin config from localStorage:", error);
  }
}
