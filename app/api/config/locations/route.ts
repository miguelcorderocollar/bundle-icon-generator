import { NextResponse } from "next/server";
import {
  APP_LOCATIONS,
  getLocationsRequiringIcons,
} from "@/src/types/app-location";

export const runtime = "nodejs";

export async function GET() {
  try {
    const locationsRequiringIcons = getLocationsRequiringIcons().map(
      (location) => location.value
    );

    return NextResponse.json({
      count: APP_LOCATIONS.length,
      locationsRequiringIcons,
      locations: APP_LOCATIONS,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to list locations";
    return NextResponse.json(
      {
        error: "locations_read_failed",
        message,
      },
      { status: 500 }
    );
  }
}
