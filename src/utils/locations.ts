/**
 * Utility functions for working with app locations
 */

import { APP_LOCATIONS, getLocationInfo, type AppLocation } from "@/src/types/app-location";

/**
 * Calculate which SVG files are required based on selected locations
 */
export function calculateRequiredSvgFiles(selectedLocations: AppLocation[]): string[] {
  const svgFiles: string[] = [];
  
  selectedLocations.forEach((location) => {
    if (location === "all_locations") {
      // If "all locations" is selected, get all locations that require icons
      APP_LOCATIONS.forEach((loc) => {
        if (loc.requiresIcon && loc.iconFileName && !svgFiles.includes(loc.iconFileName)) {
          svgFiles.push(loc.iconFileName);
        }
      });
    } else {
      const locationInfo = getLocationInfo(location);
      if (locationInfo?.requiresIcon && locationInfo.iconFileName) {
        if (!svgFiles.includes(locationInfo.iconFileName)) {
          svgFiles.push(locationInfo.iconFileName);
        }
      }
    }
  });
  
  return svgFiles.sort();
}

/**
 * Check if any selected locations require SVG icons
 */
export function hasSvgRequirements(selectedLocations: AppLocation[]): boolean {
  return calculateRequiredSvgFiles(selectedLocations).length > 0;
}

/**
 * Get display text for location count
 */
export function getLocationCountText(count: number): string {
  return `${count} location${count !== 1 ? "s" : ""} selected`;
}

