/**
 * Effect types and configurations
 */

export const EFFECT_TYPES = {
  NONE: "none",
  DARKENING_3D: "darkening_3d",
  WIP_GUIDELINES: "wip_guidelines",
} as const;

export type EffectType = typeof EFFECT_TYPES[keyof typeof EFFECT_TYPES];

export interface EffectConfig {
  id: EffectType;
  label: string;
  description: string;
}

export const EFFECT_CONFIGS: EffectConfig[] = [
  {
    id: EFFECT_TYPES.NONE,
    label: "None",
    description: "No effects applied",
  },
  {
    id: EFFECT_TYPES.DARKENING_3D,
    label: "3D Darkening",
    description: "Add corner darkening to create a 3D effect",
  },
  {
    id: EFFECT_TYPES.WIP_GUIDELINES,
    label: "WIP Guidelines",
    description: "Add guidelines to make it look like work in progress",
  },
];

/**
 * Effect-specific settings
 */
export interface Darkening3DSettings {
  intensity: number; // 0-100
  cornerRadius: number; // 0-50
}

export interface WipGuidelinesSettings {
  opacity: number; // 0-100
  gridSize: number; // 4-32
  showCrosshair: boolean;
}

export const DEFAULT_DARKENING_3D: Darkening3DSettings = {
  intensity: 30,
  cornerRadius: 10,
};

export const DEFAULT_WIP_GUIDELINES: WipGuidelinesSettings = {
  opacity: 50,
  gridSize: 8,
  showCrosshair: true,
};

