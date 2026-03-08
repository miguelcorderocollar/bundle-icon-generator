import { NextResponse } from "next/server";
import { getIconPacksServer } from "@/src/utils/icon-catalog-server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const packs = await getIconPacksServer();
    return NextResponse.json({
      count: packs.length,
      packs,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to list icon packs";
    return NextResponse.json(
      {
        error: "packs_read_failed",
        message,
      },
      { status: 500 }
    );
  }
}
