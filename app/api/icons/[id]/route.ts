import { NextRequest, NextResponse } from "next/server";
import { getIconByIdServer } from "@/src/utils/icon-catalog-server";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const decodedId = decodeURIComponent(id);
    const icon = await getIconByIdServer(decodedId);

    if (!icon) {
      return NextResponse.json(
        {
          error: "icon_not_found",
          message: `Icon '${decodedId}' was not found`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: icon.id,
      name: icon.name,
      pack: icon.pack,
      variant: icon.variant,
      keywords: icon.keywords,
      category: icon.category,
      size: icon.size,
      isRasterized: icon.isRasterized ?? false,
      svg: icon.svg,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get icon";
    return NextResponse.json(
      {
        error: "icon_read_failed",
        message,
      },
      { status: 500 }
    );
  }
}
