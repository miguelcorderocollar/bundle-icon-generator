import { NextResponse } from "next/server";
import { getRemixIconCategoriesServer } from "@/src/utils/icon-catalog-server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const categories = await getRemixIconCategoriesServer();
    return NextResponse.json({
      count: categories.length,
      categories,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to list categories";
    return NextResponse.json(
      {
        error: "categories_read_failed",
        message,
      },
      { status: 500 }
    );
  }
}
