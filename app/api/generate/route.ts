import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getIconByIdServer } from "@/src/utils/icon-catalog-server";
import { renderSvgServer } from "@/src/utils/renderer-server";

export const runtime = "nodejs";

const hexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, {
  message: "Expected color in #RRGGBB format",
});

const gradientStopSchema = z.object({
  color: hexColorSchema,
  offset: z.number().min(0).max(100),
});

const linearGradientSchema = z.object({
  type: z.literal("linear"),
  angle: z.number(),
  stops: z.array(gradientStopSchema).min(2),
});

const radialGradientSchema = z.object({
  type: z.literal("radial"),
  centerX: z.number().min(0).max(100),
  centerY: z.number().min(0).max(100),
  radius: z.number().min(0).max(100),
  stops: z.array(gradientStopSchema).min(2),
});

const backgroundSchema = z.union([
  hexColorSchema,
  linearGradientSchema,
  radialGradientSchema,
]);

const generateRequestSchema = z.object({
  iconId: z.string().min(1),
  backgroundColor: backgroundSchema.default("#063940"),
  iconColor: hexColorSchema.default("#ffffff"),
  size: z.number().int().min(48).max(300).default(128),
  padding: z.number().min(-200).max(200).default(8),
  outputSize: z.number().int().min(16).max(4096).optional(),
  zendeskLocationMode: z.boolean().default(false),
  cornerRadius: z.number().min(0).max(100).default(0),
  borderEnabled: z.boolean().default(false),
  borderColor: hexColorSchema.default("#ffffff"),
  borderWidth: z.number().min(0).max(64).default(6),
  filename: z.string().min(1).max(120).optional(),
});

function shouldReturnRawSvg(request: NextRequest): boolean {
  const explicitFormat = request.nextUrl.searchParams.get("format");
  if (explicitFormat) {
    return explicitFormat.toLowerCase() === "svg";
  }

  const accept = request.headers.get("accept")?.toLowerCase() ?? "";
  return accept.includes("image/svg+xml");
}

function createDownloadFilename(requestedFilename: string | undefined): string {
  if (!requestedFilename) {
    return "generated-icon.svg";
  }

  const sanitized = requestedFilename.replace(/[^a-zA-Z0-9._-]/g, "-");
  return sanitized.endsWith(".svg") ? sanitized : `${sanitized}.svg`;
}

export async function POST(request: NextRequest) {
  try {
    const parsedBody = generateRequestSchema.safeParse(await request.json());

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: "validation_failed",
          message: "Invalid request body",
          details: parsedBody.error.flatten(),
        },
        { status: 400 }
      );
    }

    const payload = parsedBody.data;
    const icon = await getIconByIdServer(payload.iconId);
    if (!icon) {
      return NextResponse.json(
        {
          error: "icon_not_found",
          message: `Icon '${payload.iconId}' was not found`,
        },
        { status: 404 }
      );
    }

    const svg = renderSvgServer({
      icon,
      backgroundColor: payload.backgroundColor,
      iconColor: payload.iconColor,
      size: payload.size,
      padding: payload.padding,
      outputSize: payload.outputSize,
      zendeskLocationMode: payload.zendeskLocationMode,
      cornerRadius: payload.cornerRadius,
      borderEnabled: payload.borderEnabled,
      borderColor: payload.borderColor,
      borderWidth: payload.borderWidth,
    });

    if (shouldReturnRawSvg(request)) {
      const filename = createDownloadFilename(payload.filename);
      return new NextResponse(svg, {
        headers: {
          "Content-Type": "image/svg+xml; charset=utf-8",
          "Cache-Control": "no-store",
          "Content-Disposition": `inline; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json({
      icon: {
        id: icon.id,
        name: icon.name,
        pack: icon.pack,
      },
      settings: {
        backgroundColor: payload.backgroundColor,
        iconColor: payload.iconColor,
        size: payload.size,
        padding: payload.padding,
        outputSize: payload.outputSize ?? payload.size,
        zendeskLocationMode: payload.zendeskLocationMode,
        cornerRadius: payload.cornerRadius,
        borderEnabled: payload.borderEnabled,
        borderColor: payload.borderColor,
        borderWidth: payload.borderWidth,
      },
      svg,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate SVG";
    return NextResponse.json(
      {
        error: "svg_generation_failed",
        message,
      },
      { status: 500 }
    );
  }
}
