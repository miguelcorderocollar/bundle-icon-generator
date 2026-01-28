/**
 * Built-in export and style presets
 */

import type { ExportPreset, StylePreset } from "@/src/types/preset";
import {
  GRADIENT_PRESETS,
  KALE_COLORS,
  createDefaultLinearGradient,
} from "./gradients";

/**
 * Built-in export presets for various platforms
 */
export const BUILTIN_EXPORT_PRESETS: ExportPreset[] = [
  {
    id: "zendesk-app",
    name: "Zendesk App",
    description: "Icon bundle for Zendesk marketplace apps",
    isBuiltIn: true,
    variants: [
      {
        filename: "logo.png",
        width: 320,
        height: 320,
        format: "png",
        description: "Large icon displayed in Zendesk admin pages",
      },
      {
        filename: "logo-small.png",
        width: 128,
        height: 128,
        format: "png",
        description: "Small icon displayed in Zendesk headers",
      },
      {
        filename: "icon_nav_bar.svg",
        width: 18,
        height: 18,
        format: "svg",
        description: "Icon for navigation bar (18×18 display)",
      },
      {
        filename: "icon_top_bar.svg",
        width: 18,
        height: 18,
        format: "svg",
        description: "Icon for top bar (18×18 display)",
      },
      {
        filename: "icon_ticket_editor.svg",
        width: 18,
        height: 18,
        format: "svg",
        description: "Icon for ticket editor toolbar (18×18 display)",
      },
    ],
  },
  {
    id: "zendesk-png-only",
    name: "Zendesk PNG Only",
    description: "PNG icons only for Zendesk apps (no SVG locations)",
    isBuiltIn: true,
    variants: [
      {
        filename: "logo.png",
        width: 320,
        height: 320,
        format: "png",
        description: "Large icon displayed in Zendesk admin pages",
      },
      {
        filename: "logo-small.png",
        width: 128,
        height: 128,
        format: "png",
        description: "Small icon displayed in Zendesk headers",
      },
    ],
  },
  {
    id: "raycast-extension",
    name: "Raycast Extension",
    description: "Icon for Raycast extensions (512×512 PNG)",
    isBuiltIn: true,
    variants: [
      {
        filename: "icon.png",
        width: 512,
        height: 512,
        format: "png",
        description: "Extension icon for Raycast Store",
      },
    ],
  },
  {
    id: "favicon-bundle",
    name: "Favicon Bundle",
    description: "Complete favicon set for websites",
    isBuiltIn: true,
    variants: [
      {
        filename: "favicon-16x16.png",
        width: 16,
        height: 16,
        format: "png",
        description: "Standard favicon (16×16)",
      },
      {
        filename: "favicon-32x32.png",
        width: 32,
        height: 32,
        format: "png",
        description: "Standard favicon (32×32)",
      },
      {
        filename: "apple-touch-icon.png",
        width: 180,
        height: 180,
        format: "png",
        description: "iOS home screen icon",
      },
      {
        filename: "android-chrome-192x192.png",
        width: 192,
        height: 192,
        format: "png",
        description: "Android home screen icon",
      },
      {
        filename: "android-chrome-512x512.png",
        width: 512,
        height: 512,
        format: "png",
        description: "Android splash screen icon",
      },
      {
        filename: "favicon.ico",
        width: 32,
        height: 32,
        format: "ico",
        description: "Multi-size ICO favicon (16×16, 32×32)",
      },
    ],
  },
  {
    id: "pwa-icons",
    name: "PWA Icons",
    description: "Progressive Web App icon set",
    isBuiltIn: true,
    variants: [
      {
        filename: "icon-192x192.png",
        width: 192,
        height: 192,
        format: "png",
        description: "PWA minimum required icon",
      },
      {
        filename: "icon-512x512.png",
        width: 512,
        height: 512,
        format: "png",
        description: "PWA splash screen icon",
      },
      {
        filename: "icon-144x144.png",
        width: 144,
        height: 144,
        format: "png",
        description: "PWA icon for Windows tiles",
      },
      {
        filename: "icon-384x384.png",
        width: 384,
        height: 384,
        format: "png",
        description: "PWA icon for high-DPI displays",
      },
    ],
  },
  {
    id: "macos-app-icon",
    name: "macOS App Icon",
    description: "Complete macOS application icon set",
    isBuiltIn: true,
    variants: [
      {
        filename: "icon_16x16.png",
        width: 16,
        height: 16,
        format: "png",
        description: "Smallest icon for lists",
      },
      {
        filename: "icon_16x16@2x.png",
        width: 32,
        height: 32,
        format: "png",
        description: "Retina version of 16×16",
      },
      {
        filename: "icon_32x32.png",
        width: 32,
        height: 32,
        format: "png",
        description: "Standard list view icon",
      },
      {
        filename: "icon_32x32@2x.png",
        width: 64,
        height: 64,
        format: "png",
        description: "Retina version of 32×32",
      },
      {
        filename: "icon_128x128.png",
        width: 128,
        height: 128,
        format: "png",
        description: "Finder icon",
      },
      {
        filename: "icon_128x128@2x.png",
        width: 256,
        height: 256,
        format: "png",
        description: "Retina version of 128×128",
      },
      {
        filename: "icon_256x256.png",
        width: 256,
        height: 256,
        format: "png",
        description: "Large Finder icon",
      },
      {
        filename: "icon_256x256@2x.png",
        width: 512,
        height: 512,
        format: "png",
        description: "Retina version of 256×256",
      },
      {
        filename: "icon_512x512.png",
        width: 512,
        height: 512,
        format: "png",
        description: "App preview icon",
      },
      {
        filename: "icon_512x512@2x.png",
        width: 1024,
        height: 1024,
        format: "png",
        description: "App Store & high-resolution displays",
      },
    ],
  },
  {
    id: "social-media",
    name: "Social Media",
    description: "Icons for social media profiles and sharing",
    isBuiltIn: true,
    variants: [
      {
        filename: "og-image.png",
        width: 1200,
        height: 630,
        format: "png",
        description: "Open Graph image for link sharing",
      },
      {
        filename: "twitter-card.png",
        width: 1200,
        height: 600,
        format: "png",
        description: "Twitter card image",
      },
      {
        filename: "profile-400.png",
        width: 400,
        height: 400,
        format: "png",
        description: "Profile picture (square)",
      },
      {
        filename: "profile-200.png",
        width: 200,
        height: 200,
        format: "png",
        description: "Small profile picture",
      },
    ],
  },
  {
    id: "single-png",
    name: "Single PNG",
    description: "Export a single PNG at custom size",
    isBuiltIn: true,
    variants: [
      {
        filename: "icon.png",
        width: 512,
        height: 512,
        format: "png",
        description: "Custom PNG export",
      },
    ],
  },
  {
    id: "single-svg",
    name: "Single SVG",
    description: "Export a single SVG",
    isBuiltIn: true,
    variants: [
      {
        filename: "icon.svg",
        width: 512,
        height: 512,
        format: "svg",
        description: "Scalable vector icon",
      },
    ],
  },
];

/**
 * Built-in style presets
 */
export const BUILTIN_STYLE_PRESETS: StylePreset[] = [
  {
    id: "zendesk-kale",
    name: "Zendesk Kale",
    backgroundColor: KALE_COLORS["900"],
    iconColor: "#ffffff",
    isBuiltIn: true,
    colorPalette: [
      { id: "kale-primary", name: "Primary", color: "#ffffff" },
      { id: "kale-secondary", name: "Secondary", color: KALE_COLORS["100"] },
      { id: "kale-tertiary", name: "Tertiary", color: KALE_COLORS["300"] },
      { id: "kale-accent", name: "Accent", color: KALE_COLORS["600"] },
    ],
  },
  {
    id: "dark-mode",
    name: "Dark Mode",
    backgroundColor: "#1e1e1e",
    iconColor: "#ffffff",
    isBuiltIn: true,
    colorPalette: [
      { id: "dark-primary", name: "Primary", color: "#ffffff" },
      { id: "dark-secondary", name: "Secondary", color: "#a0a0a0" },
      { id: "dark-tertiary", name: "Tertiary", color: "#666666" },
      { id: "dark-accent", name: "Accent", color: "#3b82f6" },
    ],
  },
  {
    id: "light-mode",
    name: "Light Mode",
    backgroundColor: "#ffffff",
    iconColor: "#000000",
    isBuiltIn: true,
    colorPalette: [
      { id: "light-primary", name: "Primary", color: "#000000" },
      { id: "light-secondary", name: "Secondary", color: "#333333" },
      { id: "light-tertiary", name: "Tertiary", color: "#666666" },
      { id: "light-accent", name: "Accent", color: "#2563eb" },
    ],
  },
  {
    id: "ocean-gradient",
    name: "Ocean Gradient",
    backgroundColor: GRADIENT_PRESETS["ocean-blue"],
    iconColor: "#ffffff",
    isBuiltIn: true,
    colorPalette: [
      { id: "ocean-primary", name: "Primary", color: "#ffffff" },
      { id: "ocean-secondary", name: "Secondary", color: "#bae6fd" },
      { id: "ocean-tertiary", name: "Tertiary", color: "#7dd3fc" },
      { id: "ocean-accent", name: "Accent", color: "#0284c7" },
    ],
  },
  {
    id: "sunset-gradient",
    name: "Sunset Gradient",
    backgroundColor: GRADIENT_PRESETS["warm-sunset"],
    iconColor: "#ffffff",
    isBuiltIn: true,
    colorPalette: [
      { id: "sunset-primary", name: "Primary", color: "#ffffff" },
      { id: "sunset-secondary", name: "Secondary", color: "#fef3c7" },
      { id: "sunset-tertiary", name: "Tertiary", color: "#fcd34d" },
      { id: "sunset-accent", name: "Accent", color: "#b45309" },
    ],
  },
  {
    id: "forest-gradient",
    name: "Forest Gradient",
    backgroundColor: GRADIENT_PRESETS["forest-green"],
    iconColor: "#ffffff",
    isBuiltIn: true,
    colorPalette: [
      { id: "forest-primary", name: "Primary", color: "#ffffff" },
      { id: "forest-secondary", name: "Secondary", color: "#bbf7d0" },
      { id: "forest-tertiary", name: "Tertiary", color: "#86efac" },
      { id: "forest-accent", name: "Accent", color: "#15803d" },
    ],
  },
  {
    id: "purple-dream",
    name: "Purple Dream",
    backgroundColor: GRADIENT_PRESETS["purple-dream"],
    iconColor: "#ffffff",
    isBuiltIn: true,
    colorPalette: [
      { id: "purple-primary", name: "Primary", color: "#ffffff" },
      { id: "purple-secondary", name: "Secondary", color: "#e9d5ff" },
      { id: "purple-tertiary", name: "Tertiary", color: "#d8b4fe" },
      { id: "purple-accent", name: "Accent", color: "#7e22ce" },
    ],
  },
  {
    id: "rose-pink",
    name: "Rose Pink",
    backgroundColor: GRADIENT_PRESETS["rose-pink"],
    iconColor: "#ffffff",
    isBuiltIn: true,
    colorPalette: [
      { id: "rose-primary", name: "Primary", color: "#ffffff" },
      { id: "rose-secondary", name: "Secondary", color: "#fecdd3" },
      { id: "rose-tertiary", name: "Tertiary", color: "#fda4af" },
      { id: "rose-accent", name: "Accent", color: "#be123c" },
    ],
  },
  {
    id: "kale-gradient",
    name: "Kale Gradient",
    backgroundColor: createDefaultLinearGradient(),
    iconColor: "#ffffff",
    isBuiltIn: true,
    colorPalette: [
      { id: "kaleg-primary", name: "Primary", color: "#ffffff" },
      { id: "kaleg-secondary", name: "Secondary", color: KALE_COLORS["200"] },
      { id: "kaleg-tertiary", name: "Tertiary", color: KALE_COLORS["400"] },
      { id: "kaleg-accent", name: "Accent", color: KALE_COLORS["700"] },
    ],
  },
  {
    id: "midnight",
    name: "Midnight",
    backgroundColor: GRADIENT_PRESETS["dark-night"],
    iconColor: "#ffffff",
    isBuiltIn: true,
    colorPalette: [
      { id: "midnight-primary", name: "Primary", color: "#ffffff" },
      { id: "midnight-secondary", name: "Secondary", color: "#94a3b8" },
      { id: "midnight-tertiary", name: "Tertiary", color: "#64748b" },
      { id: "midnight-accent", name: "Accent", color: "#6366f1" },
    ],
  },
];

/**
 * Get all built-in export presets
 */
export function getBuiltinExportPresets(): ExportPreset[] {
  return BUILTIN_EXPORT_PRESETS;
}

/**
 * Get all built-in style presets
 */
export function getBuiltinStylePresets(): StylePreset[] {
  return BUILTIN_STYLE_PRESETS;
}

/**
 * Get a built-in export preset by ID
 */
export function getBuiltinExportPreset(id: string): ExportPreset | undefined {
  return BUILTIN_EXPORT_PRESETS.find((preset) => preset.id === id);
}

/**
 * Get a built-in style preset by ID
 */
export function getBuiltinStylePreset(id: string): StylePreset | undefined {
  return BUILTIN_STYLE_PRESETS.find((preset) => preset.id === id);
}

/**
 * Default export preset ID
 */
export const DEFAULT_EXPORT_PRESET_ID = "zendesk-app";

/**
 * Default style preset ID
 */
export const DEFAULT_STYLE_PRESET_ID = "zendesk-kale";
