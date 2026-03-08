import { NextResponse } from "next/server";
import {
  getGradientPreset,
  getGradientPresetNames,
} from "@/src/utils/gradients";

export const runtime = "nodejs";

export async function GET() {
  try {
    const presetNames = getGradientPresetNames();
    const presets = presetNames.map((name) => ({
      name,
      value: getGradientPreset(name),
    }));

    return NextResponse.json({
      count: presets.length,
      presets,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to list gradients";
    return NextResponse.json(
      {
        error: "gradients_read_failed",
        message,
      },
      { status: 500 }
    );
  }
}
