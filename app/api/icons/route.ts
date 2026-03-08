import { NextRequest, NextResponse } from "next/server";
import {
  searchIconsServer,
  type ApiIconPack,
} from "@/src/utils/icon-catalog-server";

export const runtime = "nodejs";

const API_ICON_PACKS: ApiIconPack[] = [
  "all",
  "garden",
  "zendesk-garden",
  "feather",
  "remixicon",
  "emoji",
  "custom-svg",
  "custom-image",
];

function normalizePackParam(pack: string | null): ApiIconPack {
  if (!pack) {
    return "all";
  }

  return API_ICON_PACKS.includes(pack as ApiIconPack)
    ? (pack as ApiIconPack)
    : "all";
}

function toSafeInteger(
  value: string | null,
  fallback: number,
  min: number,
  max: number
): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, parsed));
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get("q") ?? "";
    const pack = normalizePackParam(searchParams.get("pack"));
    const category = searchParams.get("category");
    const limit = toSafeInteger(searchParams.get("limit"), 50, 1, 250);
    const offset = toSafeInteger(searchParams.get("offset"), 0, 0, 10000);

    const icons = await searchIconsServer({
      query: q,
      pack,
      category,
      limit,
      offset,
    });

    return NextResponse.json({
      query: {
        q,
        pack,
        category,
        limit,
        offset,
      },
      count: icons.length,
      icons: icons.map((icon) => ({
        id: icon.id,
        name: icon.name,
        pack: icon.pack,
        variant: icon.variant,
        keywords: icon.keywords,
        category: icon.category,
        size: icon.size,
        isRasterized: icon.isRasterized ?? false,
      })),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to search icons";

    return NextResponse.json(
      {
        error: "icons_search_failed",
        message,
      },
      { status: 500 }
    );
  }
}
