import { z } from "zod";
import { filterIconsByPack, getIconById, searchIcons } from "./icon-catalog";
import { renderSvg } from "./renderer";
import type { IconMetadata } from "../types/icon";

export const WEBMCP_API_VERSION = "0.1.0";

export const WEBMCP_TOOL_NAMES = [
  "search_icons",
  "get_icon",
  "generate_icon_svg",
] as const;

export type WebMcpToolName = (typeof WEBMCP_TOOL_NAMES)[number];

export interface WebMcpInputSchema {
  type: "object";
  properties: Record<string, unknown>;
  required?: string[];
  additionalProperties?: boolean;
}

export interface WebMcpToolAnnotations {
  readOnlyHint?: boolean;
  untrustedContentHint?: boolean;
}

export interface WebMcpToolExecuteOptions {
  signal: AbortSignal;
}

export interface WebMcpToolDefinition {
  name: string;
  title: string;
  description: string;
  inputSchema: WebMcpInputSchema;
  annotations?: WebMcpToolAnnotations;
  execute: (
    inputObject: Record<string, unknown>,
    options: WebMcpToolExecuteOptions
  ) => Promise<unknown>;
}

export interface WebMcpModelContext {
  registerTool(
    tool: WebMcpToolDefinition,
    options?: { signal?: AbortSignal }
  ): Promise<void>;
}

interface DocumentWithModelContext extends Document {
  modelContext?: WebMcpModelContext;
}

export interface WebMcpRegistration {
  toolNames: string[];
  dispose: () => void;
}

export interface PublicIconMetadata {
  id: string;
  name: string;
  pack: IconMetadata["pack"];
  variant?: string;
  category?: string;
  size?: number;
  isRasterized: boolean;
}

export interface IconDetail extends PublicIconMetadata {
  svg: string;
}

export interface GeneratedIconSvgResult {
  apiVersion: string;
  icon: IconDetail;
  settings: {
    backgroundColor: string | Record<string, unknown>;
    iconColor: string;
    size: number;
    padding: number;
    outputSize: number;
    cornerRadius: number;
    borderEnabled: boolean;
    borderColor: string;
    borderWidth: number;
  };
  svg: string;
}

export class WebMcpToolError extends Error {
  readonly code: string;
  readonly details?: unknown;

  constructor(code: string, message: string, details?: unknown) {
    super(message);
    this.name = "WebMcpToolError";
    this.code = code;
    this.details = details;
  }
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

const searchIconsInputSchema = z.object({
  query: z.string().max(120).default(""),
  pack: z
    .enum([
      "all",
      "zendesk-garden",
      "feather",
      "remixicon",
      "emoji",
      "custom-svg",
      "custom-image",
    ])
    .default("all"),
  limit: z.number().int().min(1).max(25).default(10),
});

const getIconInputSchema = z.object({
  iconId: z.string().min(1).max(160),
});

const generateIconSvgInputSchema = z.object({
  iconId: z.string().min(1).max(160),
  backgroundColor: backgroundSchema.default("#063940"),
  iconColor: hexColorSchema.default("#ffffff"),
  size: z.number().int().min(48).max(300).default(128),
  padding: z.number().min(-200).max(200).default(8),
  outputSize: z.number().int().min(16).max(4096).optional(),
  cornerRadius: z.number().min(0).max(100).default(0),
  borderEnabled: z.boolean().default(false),
  borderColor: hexColorSchema.default("#ffffff"),
  borderWidth: z.number().min(0).max(64).default(6),
});

const searchIconsInputJsonSchema: WebMcpInputSchema = {
  type: "object",
  properties: {
    query: {
      type: "string",
      description:
        "Text to match against icon names, IDs, keywords, and categories.",
    },
    pack: {
      type: "string",
      enum: [
        "all",
        "zendesk-garden",
        "feather",
        "remixicon",
        "emoji",
        "custom-svg",
        "custom-image",
      ],
      description: "Optional icon pack filter.",
    },
    limit: {
      type: "integer",
      minimum: 1,
      maximum: 25,
      description: "Maximum number of results to return.",
    },
  },
  additionalProperties: false,
};

const getIconInputJsonSchema: WebMcpInputSchema = {
  type: "object",
  properties: {
    iconId: {
      type: "string",
      minLength: 1,
      maxLength: 160,
      description: "The exact icon ID returned by search_icons.",
    },
  },
  required: ["iconId"],
  additionalProperties: false,
};

const generateIconSvgInputJsonSchema: WebMcpInputSchema = {
  type: "object",
  properties: {
    iconId: {
      type: "string",
      minLength: 1,
      maxLength: 160,
      description: "The exact icon ID returned by search_icons.",
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
    size: {
      type: "integer",
      minimum: 48,
      maximum: 300,
      description: "The SVG artboard size.",
    },
    padding: {
      type: "number",
      minimum: -200,
      maximum: 200,
      description: "Padding around the icon in artboard units.",
    },
    outputSize: {
      type: "integer",
      minimum: 16,
      maximum: 4096,
      description: "Optional rendered width and height.",
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
  },
  required: ["iconId"],
  additionalProperties: false,
};

export function toPublicIconMetadata(icon: IconMetadata): PublicIconMetadata {
  return {
    id: icon.id,
    name: icon.name,
    pack: icon.pack,
    variant: icon.variant,
    category: icon.category,
    size: icon.size,
    isRasterized: icon.isRasterized ?? false,
  };
}

export function toIconDetail(icon: IconMetadata): IconDetail {
  return {
    ...toPublicIconMetadata(icon),
    svg: icon.svg,
  };
}

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

function iconNotFound(iconId: string): WebMcpToolError {
  return new WebMcpToolError(
    "icon_not_found",
    "Icon '" + iconId + "' was not found in the current catalog."
  );
}

export function createWebMcpTools(): WebMcpToolDefinition[] {
  return [
    {
      name: "search_icons",
      title: "Search icons",
      description:
        "Find bundled icons by name, ID, keyword, category, or icon pack.",
      inputSchema: searchIconsInputJsonSchema,
      annotations: { readOnlyHint: true },
      execute: async (inputObject, options) => {
        throwIfAborted(options.signal);
        const input = parseToolInput(searchIconsInputSchema, inputObject);
        const icons = await searchIcons(input.query);
        throwIfAborted(options.signal);
        const filteredIcons = await filterIconsByPack(icons, input.pack);

        return {
          apiVersion: WEBMCP_API_VERSION,
          query: input.query,
          pack: input.pack,
          count: filteredIcons.length,
          icons: filteredIcons.slice(0, input.limit).map(toPublicIconMetadata),
        };
      },
    },
    {
      name: "get_icon",
      title: "Get icon source",
      description: "Read metadata and SVG source for one bundled icon.",
      inputSchema: getIconInputJsonSchema,
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: async (inputObject, options) => {
        throwIfAborted(options.signal);
        const input = parseToolInput(getIconInputSchema, inputObject);
        const icon = await getIconById(input.iconId);
        throwIfAborted(options.signal);
        if (!icon) {
          throw iconNotFound(input.iconId);
        }

        return {
          apiVersion: WEBMCP_API_VERSION,
          icon: toIconDetail(icon),
        };
      },
    },
    {
      name: "generate_icon_svg",
      title: "Generate icon SVG",
      description:
        "Generate a customized SVG from a bundled icon without changing the page or downloading a file.",
      inputSchema: generateIconSvgInputJsonSchema,
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: async (inputObject, options) => {
        throwIfAborted(options.signal);
        const input = parseToolInput(generateIconSvgInputSchema, inputObject);
        const icon = await getIconById(input.iconId);
        throwIfAborted(options.signal);
        if (!icon) {
          throw iconNotFound(input.iconId);
        }

        const settings = {
          ...input,
          outputSize: input.outputSize ?? input.size,
        };
        const svg = renderSvg({
          icon,
          backgroundColor: input.backgroundColor,
          iconColor: input.iconColor,
          size: input.size,
          padding: input.padding,
          outputSize: input.outputSize,
          cornerRadius: input.cornerRadius,
          borderEnabled: input.borderEnabled,
          borderColor: input.borderColor,
          borderWidth: input.borderWidth,
        });

        return {
          apiVersion: WEBMCP_API_VERSION,
          icon: toIconDetail(icon),
          settings,
          svg,
        } satisfies GeneratedIconSvgResult;
      },
    },
  ];
}

export function getDocumentModelContext(): WebMcpModelContext | null {
  if (typeof document === "undefined") {
    return null;
  }

  const modelContext = (document as DocumentWithModelContext).modelContext;
  if (!modelContext || typeof modelContext.registerTool !== "function") {
    return null;
  }

  return modelContext;
}

export async function registerWebMcpTools(
  modelContext: WebMcpModelContext,
  tools: WebMcpToolDefinition[] = createWebMcpTools()
): Promise<WebMcpRegistration> {
  const controller = new AbortController();

  try {
    await Promise.all(
      tools.map((tool) =>
        modelContext.registerTool(tool, { signal: controller.signal })
      )
    );
  } catch (error) {
    controller.abort();
    throw error;
  }

  return {
    toolNames: tools.map((tool) => tool.name),
    dispose: () => controller.abort(),
  };
}
