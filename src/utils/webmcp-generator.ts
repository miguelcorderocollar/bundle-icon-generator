import { z } from "zod";
import { ICON_PACKS, type IconPack } from "../constants/app";
import type { CanvasEditorState } from "../types/canvas";
import { APP_LOCATIONS, type AppLocation } from "../types/app-location";
import type { ExportPreset, StylePreset } from "../types/preset";
import type { RestrictedStyle } from "../types/restriction";
import type {
  IconGeneratorActions,
  IconGeneratorState,
} from "../hooks/use-icon-generator";
import type { BackgroundValue } from "./gradients";
import {
  downloadFile,
  generateExportDownloadPayload,
  validateExport,
} from "./export-controller";
import { getIconById } from "./icon-catalog";
import {
  createWebMcpTools,
  toIconDetail,
  toPublicIconMetadata,
  WEBMCP_API_VERSION,
  type WebMcpInputSchema,
  type WebMcpToolDefinition,
  WebMcpToolError,
} from "./webmcp";
import { renderSvg } from "./renderer";

export const WEBMCP_GENERATOR_TOOL_NAMES = [
  "inspect_generator_state",
  "configure_generator",
  "render_current_icon",
  "export_icon_bundle",
] as const;

export type WebMcpGeneratorToolName =
  (typeof WEBMCP_GENERATOR_TOOL_NAMES)[number];

export interface WebMcpGeneratorBindings {
  getState: () => IconGeneratorState;
  getCanvasState: () => CanvasEditorState;
  getExportPresets: () => ExportPreset[];
  getSelectedExportPresetId: () => string;
  getStylePresets: () => StylePreset[];
  getSelectedStylePresetId: () => string | null;
  isIconPackAllowed: (pack: IconPack) => boolean;
  isExportPresetAllowed: (preset: ExportPreset) => boolean;
  isRestricted: () => boolean;
  getAllowedStyles: () => RestrictedStyle[];
  actions: IconGeneratorActions;
  selectExportPreset: (id: string) => void;
  selectStylePreset: (id: string | null) => void;
}

interface ExportPresetSummary {
  id: string;
  name: string;
  description: string;
  isBuiltIn: boolean;
  variants: Array<{
    filename: string;
    width: number;
    height: number;
    format: string;
  }>;
}

interface StylePresetSummary {
  id: string;
  name: string;
  isBuiltIn: boolean;
}

interface GeneratorStateSnapshot {
  apiVersion: string;
  selectedIconId: string | null;
  selectedIcon: ReturnType<typeof toPublicIconMetadata> | null;
  selectedPack: IconPack;
  selectedLocations: AppLocation[];
  customization: {
    backgroundColor: BackgroundValue;
    iconColor: string;
    iconSize: number;
    svgIconSize: number;
    cornerRadius: number;
    borderEnabled: boolean;
    borderColor: string;
    borderWidth: number;
  };
  selectedStylePresetId: string | null;
  stylePresets: StylePresetSummary[];
  restrictedStyles: Array<{ name: string }>;
  selectedExportPresetId: string | null;
  selectedExportPreset: ExportPresetSummary | null;
  exportPresets: ExportPresetSummary[];
  availableLocations: Array<{
    value: AppLocation;
    label: string;
    description: string;
  }>;
}

const hexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, {
  message: "Expected color in #RRGGBB format",
});

const gradientStopSchema = z.object({
  color: hexColorSchema,
  offset: z.number().min(0).max(100),
});

const backgroundSchema = z.union([
  hexColorSchema,
  z.object({
    type: z.literal("linear"),
    angle: z.number(),
    stops: z.array(gradientStopSchema).min(2),
  }),
  z.object({
    type: z.literal("radial"),
    centerX: z.number().min(0).max(100),
    centerY: z.number().min(0).max(100),
    radius: z.number().min(0).max(100),
    stops: z.array(gradientStopSchema).min(2),
  }),
]);

const iconPackSchema = z.enum([
  "all",
  "garden",
  "feather",
  "remixicon",
  "emoji",
  "custom-svg",
  "custom-image",
  "canvas",
]);

const appLocationSchema = z.enum([
  "all_locations",
  "ticket_sidebar",
  "new_ticket_sidebar",
  "ticket_editor",
  "user_sidebar",
  "organization_sidebar",
  "nav_bar",
  "top_bar",
  "background",
  "modal",
]);

const emptyInputSchema: WebMcpInputSchema = {
  type: "object",
  properties: {},
  additionalProperties: false,
};

const configureGeneratorInputSchema = z
  .object({
    iconId: z.string().min(1).max(160).optional(),
    pack: iconPackSchema.optional(),
    locations: z.array(appLocationSchema).max(10).optional(),
    stylePresetId: z.string().min(1).max(160).optional(),
    restrictedStyleName: z.string().min(1).max(160).optional(),
    backgroundColor: backgroundSchema.optional(),
    iconColor: hexColorSchema.optional(),
    iconSize: z.number().int().min(16).max(4096).optional(),
    svgIconSize: z.number().int().min(16).max(4096).optional(),
    cornerRadius: z.number().min(0).max(100).optional(),
    borderEnabled: z.boolean().optional(),
    borderColor: hexColorSchema.optional(),
    borderWidth: z.number().min(0).max(64).optional(),
    exportPresetId: z.string().min(1).max(160).optional(),
  })
  .strict()
  .refine((input) => Object.keys(input).length > 0, {
    message: "Provide at least one generator setting to change.",
  });

const configureGeneratorInputJsonSchema: WebMcpInputSchema = {
  type: "object",
  properties: {
    iconId: {
      type: "string",
      minLength: 1,
      maxLength: 160,
      description: "The exact icon ID returned by search_icons.",
    },
    pack: {
      type: "string",
      enum: [
        "all",
        "garden",
        "feather",
        "remixicon",
        "emoji",
        "custom-svg",
        "custom-image",
        "canvas",
      ],
      description: "The icon pack shown in the generator.",
    },
    locations: {
      type: "array",
      maxItems: 10,
      items: {
        type: "string",
        enum: [
          "all_locations",
          "ticket_sidebar",
          "new_ticket_sidebar",
          "ticket_editor",
          "user_sidebar",
          "organization_sidebar",
          "nav_bar",
          "top_bar",
          "background",
          "modal",
        ],
      },
      description: "Zendesk app locations to include in an export.",
    },
    stylePresetId: {
      type: "string",
      description: "An existing style preset ID to apply before overrides.",
    },
    restrictedStyleName: {
      type: "string",
      description:
        "Name of an allowed restricted-mode style. Use this instead of direct color or border settings when the page is restricted.",
    },
    backgroundColor: {
      description: "A #RRGGBB color or a linear/radial gradient object.",
      oneOf: [
        { type: "string", pattern: "^#[0-9a-fA-F]{6}$" },
        { type: "object" },
      ],
    },
    iconColor: {
      type: "string",
      pattern: "^#[0-9a-fA-F]{6}$",
      description: "The icon color in #RRGGBB format.",
    },
    iconSize: {
      type: "integer",
      minimum: 16,
      maximum: 4096,
      description: "PNG artboard size.",
    },
    svgIconSize: {
      type: "integer",
      minimum: 16,
      maximum: 4096,
      description: "SVG artboard size.",
    },
    cornerRadius: {
      type: "number",
      minimum: 0,
      maximum: 100,
      description: "Background corner radius as a percentage.",
    },
    borderEnabled: {
      type: "boolean",
      description: "Whether to draw a border around the background.",
    },
    borderColor: {
      type: "string",
      pattern: "^#[0-9a-fA-F]{6}$",
      description: "The border color in #RRGGBB format.",
    },
    borderWidth: {
      type: "number",
      minimum: 0,
      maximum: 64,
      description: "The border width in normalized artboard units.",
    },
    exportPresetId: {
      type: "string",
      description: "An export preset ID to select for future exports.",
    },
  },
  additionalProperties: false,
};

const exportIconBundleInputSchema = z
  .object({
    exportPresetId: z.string().min(1).max(160).optional(),
    locations: z.array(appLocationSchema).max(10).optional(),
  })
  .strict();

const exportIconBundleInputJsonSchema: WebMcpInputSchema = {
  type: "object",
  properties: {
    exportPresetId: {
      type: "string",
      description:
        "Optional export preset ID; defaults to the selected preset.",
    },
    locations: configureGeneratorInputJsonSchema.properties.locations,
  },
  additionalProperties: false,
};

function parseToolInput<T>(schema: z.ZodType<T>, inputObject: unknown): T {
  const result = schema.safeParse(inputObject);
  if (!result.success) {
    throw new WebMcpToolError(
      "invalid_input",
      "The tool input did not match the expected schema.",
      result.error.flatten()
    );
  }
  return result.data;
}

function throwIfAborted(signal: AbortSignal): void {
  if (signal.aborted) {
    const error = new Error("The tool execution was cancelled.");
    error.name = "AbortError";
    throw error;
  }
}

function waitForStateCommit(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function iconNotFound(iconId: string): WebMcpToolError {
  return new WebMcpToolError(
    "icon_not_found",
    "Icon '" + iconId + "' was not found in the current catalog."
  );
}

function toUiIconPack(pack: string): IconPack {
  if (pack === "zendesk-garden") return ICON_PACKS.GARDEN;
  if (pack === "feather") return ICON_PACKS.FEATHER;
  if (pack === "remixicon") return ICON_PACKS.REMIXICON;
  if (pack === "emoji") return ICON_PACKS.EMOJI;
  if (pack === "custom-svg") return ICON_PACKS.CUSTOM_SVG;
  if (pack === "custom-image") return ICON_PACKS.CUSTOM_IMAGE;
  return ICON_PACKS.ALL;
}

function normalizeLocations(locations: AppLocation[]): AppLocation[] {
  const uniqueLocations = [...new Set(locations)];
  return uniqueLocations.includes("all_locations")
    ? ["all_locations"]
    : uniqueLocations;
}

function toExportPresetSummary(preset: ExportPreset): ExportPresetSummary {
  return {
    id: preset.id,
    name: preset.name,
    description: preset.description,
    isBuiltIn: preset.isBuiltIn,
    variants: preset.variants.map((variant) => ({
      filename: variant.filename,
      width: variant.width,
      height: variant.height,
      format: variant.format,
    })),
  };
}

function toStylePresetSummary(preset: StylePreset): StylePresetSummary {
  return {
    id: preset.id,
    name: preset.name,
    isBuiltIn: preset.isBuiltIn,
  };
}

function getExportPreset(
  bindings: WebMcpGeneratorBindings,
  requestedId?: string
): ExportPreset | null {
  const presets = bindings.getExportPresets();
  const selectedId = requestedId ?? bindings.getSelectedExportPresetId();
  return (
    presets.find((preset) => preset.id === selectedId) ??
    (requestedId ? null : (presets[0] ?? null))
  );
}

async function getGeneratorStateSnapshot(
  bindings: WebMcpGeneratorBindings
): Promise<GeneratorStateSnapshot> {
  const state = bindings.getState();
  const selectedIcon = state.selectedIconId
    ? await getIconById(state.selectedIconId)
    : null;
  const presets = bindings.getExportPresets();
  const selectedExportPreset = getExportPreset(bindings);
  const stylePresets = bindings.getStylePresets();
  const restrictedStyles = bindings.getAllowedStyles();

  return {
    apiVersion: WEBMCP_API_VERSION,
    selectedIconId: state.selectedIconId ?? null,
    selectedIcon: selectedIcon ? toPublicIconMetadata(selectedIcon) : null,
    selectedPack: state.selectedPack,
    selectedLocations: state.selectedLocations,
    customization: {
      backgroundColor: state.backgroundColor,
      iconColor: state.iconColor,
      iconSize: state.iconSize,
      svgIconSize: state.svgIconSize,
      cornerRadius: state.cornerRadius,
      borderEnabled: state.borderEnabled,
      borderColor: state.borderColor,
      borderWidth: state.borderWidth,
    },
    selectedStylePresetId: bindings.getSelectedStylePresetId(),
    stylePresets: stylePresets.map(toStylePresetSummary),
    restrictedStyles: restrictedStyles.map(({ name }) => ({ name })),
    selectedExportPresetId: selectedExportPreset?.id ?? null,
    selectedExportPreset: selectedExportPreset
      ? toExportPresetSummary(selectedExportPreset)
      : null,
    exportPresets: presets.map(toExportPresetSummary),
    availableLocations: APP_LOCATIONS.map(({ value, label, description }) => ({
      value,
      label,
      description,
    })),
  };
}

function getCurrentSvgSettings(state: IconGeneratorState) {
  return {
    backgroundColor: state.backgroundColor,
    iconColor: state.iconColor,
    size: state.svgIconSize,
    outputSize: state.svgIconSize,
    cornerRadius: state.cornerRadius,
    borderEnabled: state.borderEnabled,
    borderColor: state.borderColor,
    borderWidth: state.borderWidth,
  };
}

export function createGeneratorWebMcpTools(
  bindings: WebMcpGeneratorBindings
): WebMcpToolDefinition[] {
  const baseTools = createWebMcpTools();

  const generatorTools: WebMcpToolDefinition[] = [
    {
      name: "inspect_generator_state",
      title: "Inspect generator state",
      description:
        "Read the current icon, customization, selected locations, available style choices, and export presets.",
      inputSchema: emptyInputSchema,
      annotations: { readOnlyHint: true },
      execute: async (_inputObject, options) => {
        throwIfAborted(options.signal);
        const snapshot = await getGeneratorStateSnapshot(bindings);
        throwIfAborted(options.signal);
        return snapshot;
      },
    },
    {
      name: "configure_generator",
      title: "Configure icon generator",
      description:
        "Select an icon and apply customization, location, style preset, and export preset choices to the visible generator.",
      inputSchema: configureGeneratorInputJsonSchema,
      annotations: { readOnlyHint: false },
      execute: async (inputObject, options) => {
        throwIfAborted(options.signal);
        const input = parseToolInput(
          configureGeneratorInputSchema,
          inputObject
        );
        const currentState = bindings.getState();
        const isRestricted = bindings.isRestricted();
        const stylePreset = input.stylePresetId
          ? bindings
              .getStylePresets()
              .find((preset) => preset.id === input.stylePresetId)
          : undefined;

        if (input.restrictedStyleName && !isRestricted) {
          throw new WebMcpToolError(
            "restricted_style_not_available",
            "Restricted styles are only available when the page is in restricted mode."
          );
        }

        if (input.stylePresetId && isRestricted) {
          throw new WebMcpToolError(
            "style_preset_not_allowed",
            "Style presets are unavailable in restricted mode. Use restrictedStyleName with a name from inspect_generator_state."
          );
        }

        if (input.stylePresetId && !stylePreset) {
          throw new WebMcpToolError(
            "style_preset_not_found",
            "Style preset '" + input.stylePresetId + "' was not found."
          );
        }

        const restrictedStyle = input.restrictedStyleName
          ? bindings
              .getAllowedStyles()
              .find(
                (style) =>
                  style.name.toLowerCase() ===
                  input.restrictedStyleName?.toLowerCase()
              )
          : undefined;

        if (input.restrictedStyleName && !restrictedStyle) {
          throw new WebMcpToolError(
            "restricted_style_not_found",
            "Restricted style '" +
              input.restrictedStyleName +
              "' was not found in the allowed styles."
          );
        }

        const directCustomizationKeys = [
          "backgroundColor",
          "iconColor",
          "cornerRadius",
          "borderEnabled",
          "borderColor",
          "borderWidth",
        ] as const;
        if (
          isRestricted &&
          directCustomizationKeys.some((key) => input[key] !== undefined)
        ) {
          throw new WebMcpToolError(
            "customization_not_allowed",
            "Direct color and border customization is unavailable in restricted mode. Use restrictedStyleName with a name from inspect_generator_state."
          );
        }

        if (input.pack && !bindings.isIconPackAllowed(input.pack)) {
          throw new WebMcpToolError(
            "icon_pack_not_allowed",
            "The requested icon pack is not available in the current app configuration."
          );
        }

        let selectedIcon = null;
        if (input.iconId) {
          selectedIcon = await getIconById(input.iconId);
          if (!selectedIcon) {
            throw iconNotFound(input.iconId);
          }

          if (!bindings.isIconPackAllowed(toUiIconPack(selectedIcon.pack))) {
            throw new WebMcpToolError(
              "icon_pack_not_allowed",
              "The requested icon belongs to a pack that is not available in the current app configuration."
            );
          }
        }

        const selectedExportPreset = input.exportPresetId
          ? getExportPreset(bindings, input.exportPresetId)
          : undefined;
        if (input.exportPresetId && !selectedExportPreset) {
          throw new WebMcpToolError(
            "export_preset_not_found",
            "Export preset '" + input.exportPresetId + "' was not found."
          );
        }
        if (
          selectedExportPreset &&
          !bindings.isExportPresetAllowed(selectedExportPreset)
        ) {
          throw new WebMcpToolError(
            "export_preset_not_allowed",
            "The requested export preset is not available in the current app configuration."
          );
        }

        const styleValues = stylePreset
          ? {
              backgroundColor: stylePreset.backgroundColor,
              iconColor: stylePreset.iconColor,
              cornerRadius: stylePreset.cornerRadius,
              borderEnabled: stylePreset.borderEnabled,
              borderColor: stylePreset.borderColor,
              borderWidth: stylePreset.borderWidth,
            }
          : {};
        const restrictedStyleValues = restrictedStyle
          ? {
              backgroundColor: restrictedStyle.backgroundColor,
              iconColor: restrictedStyle.iconColor,
            }
          : {};
        const nextState = {
          ...currentState,
          ...styleValues,
          ...restrictedStyleValues,
          ...(input.backgroundColor === undefined
            ? {}
            : { backgroundColor: input.backgroundColor }),
          ...(input.iconColor === undefined
            ? {}
            : { iconColor: input.iconColor }),
          ...(input.iconSize === undefined ? {} : { iconSize: input.iconSize }),
          ...(input.svgIconSize === undefined
            ? {}
            : { svgIconSize: input.svgIconSize }),
          ...(input.cornerRadius === undefined
            ? {}
            : { cornerRadius: input.cornerRadius }),
          ...(input.borderEnabled === undefined
            ? {}
            : { borderEnabled: input.borderEnabled }),
          ...(input.borderColor === undefined
            ? {}
            : { borderColor: input.borderColor }),
          ...(input.borderWidth === undefined
            ? {}
            : { borderWidth: input.borderWidth }),
          ...(input.locations === undefined
            ? {}
            : { selectedLocations: normalizeLocations(input.locations) }),
          ...(input.iconId === undefined
            ? {}
            : { selectedIconId: input.iconId }),
          ...(input.pack === undefined ? {} : { selectedPack: input.pack }),
        };

        if (stylePreset) {
          bindings.selectStylePreset(stylePreset.id);
        }
        if (restrictedStyle) {
          bindings.selectStylePreset(null);
          bindings.actions.setBackgroundColor(restrictedStyle.backgroundColor);
          bindings.actions.setIconColor(restrictedStyle.iconColor);
        }
        if (input.iconId) {
          bindings.actions.setSelectedIconId(input.iconId);
        }
        if (input.pack) {
          bindings.actions.setSelectedPack(input.pack);
        }
        if (input.locations) {
          bindings.actions.setSelectedLocations(
            normalizeLocations(input.locations)
          );
        }
        if (input.backgroundColor !== undefined) {
          bindings.actions.setBackgroundColor(input.backgroundColor);
        }
        if (input.iconColor !== undefined) {
          bindings.actions.setIconColor(input.iconColor);
        }
        if (input.iconSize !== undefined) {
          bindings.actions.setIconSize(input.iconSize);
        }
        if (input.svgIconSize !== undefined) {
          bindings.actions.setSvgIconSize(input.svgIconSize);
        }
        if (input.cornerRadius !== undefined) {
          bindings.actions.setCornerRadius(input.cornerRadius);
        }
        if (input.borderEnabled !== undefined) {
          bindings.actions.setBorderEnabled(input.borderEnabled);
        }
        if (input.borderColor !== undefined) {
          bindings.actions.setBorderColor(input.borderColor);
        }
        if (input.borderWidth !== undefined) {
          bindings.actions.setBorderWidth(input.borderWidth);
        }
        if (stylePreset) {
          bindings.actions.setBackgroundColor(stylePreset.backgroundColor);
          bindings.actions.setIconColor(stylePreset.iconColor);
          bindings.actions.setCornerRadius(stylePreset.cornerRadius);
          bindings.actions.setBorderEnabled(stylePreset.borderEnabled);
          bindings.actions.setBorderColor(stylePreset.borderColor);
          bindings.actions.setBorderWidth(stylePreset.borderWidth);
          if (input.backgroundColor !== undefined) {
            bindings.actions.setBackgroundColor(input.backgroundColor);
          }
          if (input.iconColor !== undefined) {
            bindings.actions.setIconColor(input.iconColor);
          }
          if (input.cornerRadius !== undefined) {
            bindings.actions.setCornerRadius(input.cornerRadius);
          }
          if (input.borderEnabled !== undefined) {
            bindings.actions.setBorderEnabled(input.borderEnabled);
          }
          if (input.borderColor !== undefined) {
            bindings.actions.setBorderColor(input.borderColor);
          }
          if (input.borderWidth !== undefined) {
            bindings.actions.setBorderWidth(input.borderWidth);
          }
        }
        if (selectedExportPreset) {
          bindings.selectExportPreset(selectedExportPreset.id);
        }

        await waitForStateCommit();
        throwIfAborted(options.signal);

        const projectedBindings: WebMcpGeneratorBindings = {
          ...bindings,
          getState: () => nextState,
          getSelectedExportPresetId: () =>
            selectedExportPreset?.id ?? bindings.getSelectedExportPresetId(),
          getSelectedStylePresetId: () =>
            restrictedStyle
              ? null
              : (stylePreset?.id ?? bindings.getSelectedStylePresetId()),
        };

        return {
          apiVersion: WEBMCP_API_VERSION,
          applied: {
            iconId: selectedIcon?.id ?? input.iconId ?? null,
            pack: input.pack ?? null,
            locations:
              input.locations === undefined
                ? null
                : normalizeLocations(input.locations),
            stylePresetId: stylePreset?.id ?? null,
            restrictedStyleName: restrictedStyle?.name ?? null,
            exportPresetId: selectedExportPreset?.id ?? null,
            customization: {
              backgroundColor:
                input.backgroundColor ??
                styleValues.backgroundColor ??
                restrictedStyleValues.backgroundColor ??
                null,
              iconColor:
                input.iconColor ??
                styleValues.iconColor ??
                restrictedStyleValues.iconColor ??
                null,
              iconSize: input.iconSize ?? null,
              svgIconSize: input.svgIconSize ?? null,
              cornerRadius:
                input.cornerRadius ?? styleValues.cornerRadius ?? null,
              borderEnabled:
                input.borderEnabled ?? styleValues.borderEnabled ?? null,
              borderColor: input.borderColor ?? styleValues.borderColor ?? null,
              borderWidth: input.borderWidth ?? styleValues.borderWidth ?? null,
            },
          },
          state: await getGeneratorStateSnapshot(projectedBindings),
        };
      },
    },
    {
      name: "render_current_icon",
      title: "Render current icon",
      description:
        "Render the selected icon using the visible generator customization without downloading or changing the page.",
      inputSchema: emptyInputSchema,
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: async (_inputObject, options) => {
        throwIfAborted(options.signal);
        const state = bindings.getState();
        if (!state.selectedIconId) {
          throw new WebMcpToolError(
            "no_icon_selected",
            "Select an icon before rendering the current configuration."
          );
        }
        const icon = await getIconById(state.selectedIconId);
        throwIfAborted(options.signal);
        if (!icon) {
          throw iconNotFound(state.selectedIconId);
        }
        if (!icon.svg) {
          throw new WebMcpToolError(
            "svg_not_available",
            "The selected icon does not have SVG source available."
          );
        }

        const settings = getCurrentSvgSettings(state);
        return {
          apiVersion: WEBMCP_API_VERSION,
          icon: toIconDetail(icon),
          settings,
          svg: renderSvg({
            icon,
            backgroundColor: settings.backgroundColor,
            iconColor: settings.iconColor,
            size: settings.size,
            outputSize: settings.outputSize,
            cornerRadius: settings.cornerRadius,
            borderEnabled: settings.borderEnabled,
            borderColor: settings.borderColor,
            borderWidth: settings.borderWidth,
          }),
        };
      },
    },
    {
      name: "export_icon_bundle",
      title: "Export icon bundle",
      description:
        "Generate and download the configured icon bundle using the selected export preset and locations. This starts a browser download.",
      inputSchema: exportIconBundleInputJsonSchema,
      annotations: { readOnlyHint: false, untrustedContentHint: true },
      execute: async (inputObject, options) => {
        throwIfAborted(options.signal);
        const input = parseToolInput(exportIconBundleInputSchema, inputObject);
        const currentState = bindings.getState();
        const selectedLocations = input.locations
          ? normalizeLocations(input.locations)
          : currentState.selectedLocations;
        const preset = getExportPreset(bindings, input.exportPresetId);

        if (input.exportPresetId && !preset) {
          throw new WebMcpToolError(
            "export_preset_not_found",
            "Export preset '" + input.exportPresetId + "' was not found."
          );
        }
        if (preset && !bindings.isExportPresetAllowed(preset)) {
          throw new WebMcpToolError(
            "export_preset_not_allowed",
            "The requested export preset is not available in the current app configuration."
          );
        }

        if (input.locations) {
          bindings.actions.setSelectedLocations(selectedLocations);
        }
        if (preset && preset.id !== bindings.getSelectedExportPresetId()) {
          bindings.selectExportPreset(preset.id);
        }

        const validation = validateExport(currentState, selectedLocations);
        if (!validation.valid) {
          throw new WebMcpToolError(
            "export_invalid",
            "The current generator configuration cannot be exported.",
            validation
          );
        }

        const payload = await generateExportDownloadPayload(
          input.locations
            ? { ...currentState, selectedLocations }
            : currentState,
          selectedLocations,
          currentState.selectedPack === ICON_PACKS.CANVAS
            ? bindings.getCanvasState()
            : undefined,
          preset ? { preset } : undefined
        );
        throwIfAborted(options.signal);
        downloadFile(payload.blob, payload.filename);

        return {
          apiVersion: WEBMCP_API_VERSION,
          downloaded: true,
          filename: payload.filename,
          isZip: payload.isZip,
          filenames: payload.filenames,
          metadata: payload.metadata,
          warnings: validation.warnings,
        };
      },
    },
  ];

  return [...baseTools, ...generatorTools];
}
