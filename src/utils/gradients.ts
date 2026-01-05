/**
 * Gradient utilities and preset definitions for backgrounds
 */

export interface LinearGradient {
  type: "linear";
  angle: number; // degrees (0 = top to bottom, 90 = left to right)
  stops: Array<{ color: string; offset: number }>; // offset 0-100
}

export interface RadialGradient {
  type: "radial";
  centerX: number; // 0-100 (percentage from left)
  centerY: number; // 0-100 (percentage from top)
  radius: number; // 0-100 (percentage of canvas size)
  stops: Array<{ color: string; offset: number }>; // offset 0-100
}

export type Gradient = LinearGradient | RadialGradient;
export type BackgroundValue = string | Gradient;

/**
 * Check if a background value is a gradient
 */
export function isGradient(value: BackgroundValue): value is Gradient {
  return typeof value === "object" && value !== null && "type" in value;
}

/**
 * Check if a background value is a linear gradient
 */
export function isLinearGradient(
  value: BackgroundValue
): value is LinearGradient {
  return isGradient(value) && value.type === "linear";
}

/**
 * Check if a background value is a radial gradient
 */
export function isRadialGradient(
  value: BackgroundValue
): value is RadialGradient {
  return isGradient(value) && value.type === "radial";
}

/**
 * Check if a background value is a solid color (hex string)
 */
export function isSolidColor(value: BackgroundValue): value is string {
  return typeof value === "string";
}

/**
 * Convert linear gradient to CSS linear-gradient string
 */
export function linearGradientToCss(gradient: LinearGradient): string {
  const angle = gradient.angle;
  const stops = gradient.stops
    .map((stop) => `${stop.color} ${stop.offset}%`)
    .join(", ");
  return `linear-gradient(${angle}deg, ${stops})`;
}

/**
 * Convert radial gradient to CSS radial-gradient string
 */
export function radialGradientToCss(gradient: RadialGradient): string {
  const centerX = gradient.centerX;
  const centerY = gradient.centerY;
  const radius = gradient.radius;
  const stops = gradient.stops
    .map((stop) => `${stop.color} ${stop.offset}%`)
    .join(", ");
  return `radial-gradient(circle ${radius}% at ${centerX}% ${centerY}%, ${stops})`;
}

/**
 * Convert gradient to CSS string
 */
export function gradientToCss(gradient: Gradient): string {
  if (gradient.type === "linear") {
    return linearGradientToCss(gradient);
  }
  return radialGradientToCss(gradient);
}

/**
 * Convert linear gradient to SVG gradient definition
 */
export function linearGradientToSvgDef(
  gradient: LinearGradient,
  id: string,
  _size: number
): string {
  // Calculate gradient coordinates based on angle
  const angleRad = (gradient.angle * Math.PI) / 180;

  // Convert angle to SVG coordinates (0-1 range)
  const x1 = 0.5 - Math.sin(angleRad) * 0.5;
  const y1 = 0.5 - Math.cos(angleRad) * 0.5;
  const x2 = 0.5 + Math.sin(angleRad) * 0.5;
  const y2 = 0.5 + Math.cos(angleRad) * 0.5;

  const stops = gradient.stops
    .map(
      (stop) => `<stop offset="${stop.offset}%" stop-color="${stop.color}" />`
    )
    .join("\n    ");

  return `<defs>
  <linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">
    ${stops}
  </linearGradient>
</defs>`;
}

/**
 * Convert radial gradient to SVG gradient definition
 */
export function radialGradientToSvgDef(
  gradient: RadialGradient,
  id: string,
  _size: number
): string {
  // Convert percentage to 0-1 range for SVG
  const cx = gradient.centerX / 100;
  const cy = gradient.centerY / 100;
  const r = gradient.radius / 100;

  const stops = gradient.stops
    .map(
      (stop) => `<stop offset="${stop.offset}%" stop-color="${stop.color}" />`
    )
    .join("\n    ");

  return `<defs>
  <radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">
    ${stops}
  </radialGradient>
</defs>`;
}

/**
 * Convert gradient to SVG gradient definition
 */
export function gradientToSvgDef(
  gradient: Gradient,
  id: string,
  size: number
): string {
  if (gradient.type === "linear") {
    return linearGradientToSvgDef(gradient, id, size);
  }
  return radialGradientToSvgDef(gradient, id, size);
}

/**
 * Create linear gradient for Canvas
 */
export function createLinearCanvasGradient(
  ctx: CanvasRenderingContext2D,
  gradient: LinearGradient,
  width: number,
  height: number
): CanvasGradient {
  const angleRad = (gradient.angle * Math.PI) / 180;

  // Calculate start and end points
  const centerX = width / 2;
  const centerY = height / 2;
  const length = Math.sqrt(width * width + height * height) / 2;

  const x1 = centerX - Math.sin(angleRad) * length;
  const y1 = centerY - Math.cos(angleRad) * length;
  const x2 = centerX + Math.sin(angleRad) * length;
  const y2 = centerY + Math.cos(angleRad) * length;

  const canvasGradient = ctx.createLinearGradient(x1, y1, x2, y2);

  gradient.stops.forEach((stop) => {
    canvasGradient.addColorStop(stop.offset / 100, stop.color);
  });

  return canvasGradient;
}

/**
 * Create radial gradient for Canvas
 */
export function createRadialCanvasGradient(
  ctx: CanvasRenderingContext2D,
  gradient: RadialGradient,
  width: number,
  height: number
): CanvasGradient {
  const centerX = (gradient.centerX / 100) * width;
  const centerY = (gradient.centerY / 100) * height;
  const radius = (gradient.radius / 100) * Math.max(width, height);

  const canvasGradient = ctx.createRadialGradient(
    centerX,
    centerY,
    0,
    centerX,
    centerY,
    radius
  );

  gradient.stops.forEach((stop) => {
    canvasGradient.addColorStop(stop.offset / 100, stop.color);
  });

  return canvasGradient;
}

/**
 * Create gradient for Canvas
 */
export function createCanvasGradient(
  ctx: CanvasRenderingContext2D,
  gradient: Gradient,
  width: number,
  height: number
): CanvasGradient {
  if (gradient.type === "linear") {
    return createLinearCanvasGradient(ctx, gradient, width, height);
  }
  return createRadialCanvasGradient(ctx, gradient, width, height);
}

/**
 * Preset gradient definitions
 */
export const GRADIENT_PRESETS: Record<string, Gradient> = {
  "ocean-blue": {
    type: "linear",
    angle: 135,
    stops: [
      { color: "#0ea5e9", offset: 0 },
      { color: "#0284c7", offset: 100 },
    ],
  },
  sunset: {
    type: "linear",
    angle: 135,
    stops: [
      { color: "#f97316", offset: 0 },
      { color: "#ea580c", offset: 100 },
    ],
  },
  "purple-dream": {
    type: "linear",
    angle: 135,
    stops: [
      { color: "#a855f7", offset: 0 },
      { color: "#9333ea", offset: 100 },
    ],
  },
  "forest-green": {
    type: "linear",
    angle: 135,
    stops: [
      { color: "#22c55e", offset: 0 },
      { color: "#16a34a", offset: 100 },
    ],
  },
  "rose-pink": {
    type: "linear",
    angle: 135,
    stops: [
      { color: "#f43f5e", offset: 0 },
      { color: "#e11d48", offset: 100 },
    ],
  },
  "dark-night": {
    type: "linear",
    angle: 135,
    stops: [
      { color: "#1e293b", offset: 0 },
      { color: "#0f172a", offset: 100 },
    ],
  },
  "warm-sunset": {
    type: "linear",
    angle: 45,
    stops: [
      { color: "#fbbf24", offset: 0 },
      { color: "#f59e0b", offset: 50 },
      { color: "#d97706", offset: 100 },
    ],
  },
  "cool-mint": {
    type: "linear",
    angle: 90,
    stops: [
      { color: "#06b6d4", offset: 0 },
      { color: "#0891b2", offset: 100 },
    ],
  },
  "violet-sky": {
    type: "linear",
    angle: 180,
    stops: [
      { color: "#8b5cf6", offset: 0 },
      { color: "#6366f1", offset: 100 },
    ],
  },
  "emerald-shine": {
    type: "linear",
    angle: 45,
    stops: [
      { color: "#10b981", offset: 0 },
      { color: "#059669", offset: 100 },
    ],
  },
  "radial-sunset": {
    type: "radial",
    centerX: 50,
    centerY: 50,
    radius: 70,
    stops: [
      { color: "#fbbf24", offset: 0 },
      { color: "#f97316", offset: 100 },
    ],
  },
  "radial-ocean": {
    type: "radial",
    centerX: 50,
    centerY: 50,
    radius: 80,
    stops: [
      { color: "#0ea5e9", offset: 0 },
      { color: "#0284c7", offset: 100 },
    ],
  },
  "radial-purple": {
    type: "radial",
    centerX: 30,
    centerY: 30,
    radius: 60,
    stops: [
      { color: "#a855f7", offset: 0 },
      { color: "#6366f1", offset: 100 },
    ],
  },
};

/**
 * Get gradient preset by name
 */
export function getGradientPreset(name: string): Gradient | undefined {
  return GRADIENT_PRESETS[name];
}

/**
 * Get all gradient preset names
 */
export function getGradientPresetNames(): string[] {
  return Object.keys(GRADIENT_PRESETS);
}

/**
 * Convert background value to a display string
 */
export function backgroundValueToString(value: BackgroundValue): string {
  if (isSolidColor(value)) {
    return value;
  }
  return gradientToCss(value);
}

/**
 * Kale color palette
 */
export const KALE_COLORS = {
  "100": "#ecf9f9",
  "200": "#daeded",
  "300": "#cbe2e1",
  "400": "#97bfbf",
  "500": "#6ba4a5",
  "600": "#4a9999",
  "700": "#40787a",
  "800": "#16494f",
  "900": "#063940",
  "1000": "#03252a",
  "1100": "#061517",
  "1200": "#060e0e",
} as const;

/**
 * Create a default linear gradient using Kale colors
 * From dark to less dark (but not white) for good contrast with white icons
 */
export function createDefaultLinearGradient(): LinearGradient {
  return {
    type: "linear",
    angle: 135,
    stops: [
      { color: KALE_COLORS["900"], offset: 0 }, // Dark start
      { color: KALE_COLORS["500"], offset: 100 }, // Medium end (not white)
    ],
  };
}

/**
 * Create a default radial gradient using Kale colors
 * From dark to less dark (but not white) for good contrast with white icons
 */
export function createDefaultRadialGradient(): RadialGradient {
  return {
    type: "radial",
    centerX: 50,
    centerY: 50,
    radius: 70,
    stops: [
      { color: KALE_COLORS["800"], offset: 0 }, // Dark center
      { color: KALE_COLORS["500"], offset: 100 }, // Medium edge (not white)
    ],
  };
}
