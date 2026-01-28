/**
 * Canvas editor types for multi-layer icon composition
 */

import type { BackgroundValue } from "@/src/utils/gradients";

/**
 * Layer types supported by the canvas editor
 */
export type LayerType = "icon" | "image" | "text";

/**
 * Base layer properties shared by all layer types
 */
export interface BaseLayer {
  /** Unique identifier for the layer */
  id: string;
  /** User-editable display name */
  name: string;
  /** Type discriminator */
  type: LayerType;
  /** Whether the layer is visible */
  visible: boolean;
  /** Whether the layer is locked (cannot be moved/edited) */
  locked: boolean;
  /** X position from left edge */
  left: number;
  /** Y position from top edge */
  top: number;
  /** Horizontal scale factor */
  scaleX: number;
  /** Vertical scale factor */
  scaleY: number;
  /** Rotation angle in degrees */
  angle: number;
  /** Layer opacity (0-1) */
  opacity: number;
}

/**
 * Icon layer - renders an icon from the catalog
 */
export interface IconLayer extends BaseLayer {
  type: "icon";
  /** Reference to icon in catalog */
  iconId: string;
  /** Fill color for the icon */
  color: string;
}

/**
 * Image layer - renders a custom uploaded image
 */
export interface ImageLayer extends BaseLayer {
  type: "image";
  /** Base64 data URL of the image */
  imageDataUrl: string;
}

/**
 * Text layer - renders custom text
 */
export interface TextLayer extends BaseLayer {
  type: "text";
  /** Text content */
  text: string;
  /** Font family name */
  fontFamily: string;
  /** Font size in pixels */
  fontSize: number;
  /** Text color */
  color: string;
  /** Whether text is bold */
  bold: boolean;
  /** Whether text is italic */
  italic: boolean;
}

/**
 * Union type for all layer types
 */
export type CanvasLayer = IconLayer | ImageLayer | TextLayer;

/**
 * Canvas editor state
 */
export interface CanvasEditorState {
  /** Ordered array of layers (index 0 = bottom, last = top) */
  layers: CanvasLayer[];
  /** ID of the currently selected layer */
  selectedLayerId?: string;
  /** Background color or gradient */
  backgroundColor: BackgroundValue;
  /** Internal canvas size for export quality */
  canvasSize: number;
}

/**
 * Default canvas editor state
 */
export const DEFAULT_CANVAS_STATE: CanvasEditorState = {
  layers: [],
  selectedLayerId: undefined,
  backgroundColor: "#063940",
  canvasSize: 1024,
};

/**
 * Available font families for text layers
 */
export const AVAILABLE_FONTS = [
  { value: "Arial", label: "Arial" },
  { value: "Helvetica", label: "Helvetica" },
  { value: "Georgia", label: "Georgia" },
  { value: "Times New Roman", label: "Times New Roman" },
  { value: "Courier New", label: "Courier New" },
  { value: "Verdana", label: "Verdana" },
  { value: "Tahoma", label: "Tahoma" },
  { value: "Impact", label: "Impact" },
] as const;

/**
 * Default font family for new text layers
 */
export const DEFAULT_FONT_FAMILY = "Arial";

/**
 * Default font size for new text layers
 */
export const DEFAULT_FONT_SIZE = 72;

/**
 * Type guard for IconLayer
 */
export function isIconLayer(layer: CanvasLayer): layer is IconLayer {
  return layer.type === "icon";
}

/**
 * Type guard for ImageLayer
 */
export function isImageLayer(layer: CanvasLayer): layer is ImageLayer {
  return layer.type === "image";
}

/**
 * Type guard for TextLayer
 */
export function isTextLayer(layer: CanvasLayer): layer is TextLayer {
  return layer.type === "text";
}
